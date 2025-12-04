const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const fs = require('fs');
// Load .env in service folder for server-only secrets
try { require('dotenv').config({ path: path.join(__dirname, '.env') }); } catch (e) { /* ignore if dotenv not installed */ }
// If no UNSPLASH_KEY in environment, allow an on-disk program file to contain the key.
// This lets you place the secret directly in the deployed service folder as a small
// `secret.js` or `secret.json` file without using a `.env` file. The file should
// live next to this index.js (services/<your-service>/secret.json or secret.js).
try {
	if (!process.env.UNSPLASH_KEY) {
		const secretJs = path.join(__dirname, 'secret.js');
		const secretJson = path.join(__dirname, 'secret.json');
		if (fs.existsSync(secretJs)) {
			try {
				// secret.js should export an object like: module.exports = { UNSPLASH_KEY: 'xxx' };
				const s = require(secretJs);
				if (s && s.UNSPLASH_KEY) process.env.UNSPLASH_KEY = s.UNSPLASH_KEY;
			} catch (e) { /* ignore parse/require errors */ }
		} else if (fs.existsSync(secretJson)) {
			try {
				const raw = fs.readFileSync(secretJson, 'utf8');
				const s = JSON.parse(raw || '{}');
				if (s && s.UNSPLASH_KEY) process.env.UNSPLASH_KEY = s.UNSPLASH_KEY;
			} catch (e) { /* ignore parse errors */ }
		}
	}
} catch (e) { /* non-fatal */ }
const session = require('express-session');
// Database helper (connects to MongoDB when available)
const { connectDB } = require('./database');
const http = require('http');
const WebSocket = require('ws');

const port = process.env.PORT || (process.argv.length > 2 ? Number(process.argv[2]) : 4000);

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Simple CORS middleware for development: allow requests from the frontend dev server.
// It echoes the Origin header so browsers see an explicit origin (works with credentials if needed).
app.use((req, res, next) => {
	const origin = req.headers.origin || '*';
	// In production, replace the wildcard/echo behavior with a strict allow-list.
	res.setHeader('Access-Control-Allow-Origin', origin);
	res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	if (req.method === 'OPTIONS') return res.sendStatus(200);
	next();
});

	// Session middleware (development). In production, configure a proper store.
	// Keep the middleware instance so we can reuse it for WebSocket authentication.
	const sessionParser = session({
		secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			secure: false,
			sameSite: 'lax',
		}
	});
	app.use(sessionParser);

	// Photo search proxy to hide API key from the client
	app.post('/api/photo-search', async (req, res) => {
		const { query = 'workspace', perPage = 8 } = req.body || {};
		console.log(`[photo-search] request from=${req.ip} query=${query} perPage=${perPage}`);
		const key = process.env.UNSPLASH_KEY;
		if (!key) return res.status(500).json({ error: 'server missing UNSPLASH_KEY' });
		try {
			const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${Number(perPage) || 8}`;
			const upstream = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } });
			const data = await upstream.json();
			console.log(`[photo-search] upstream status=${upstream.status} results=${(data && data.results && data.results.length) || 0}`);
			return res.json(data);
		} catch (err) {
			console.error('photo search proxy error', err);
			return res.status(500).json({ error: String(err) });
		}
	});

// Serve static frontend files. Detect build output location so deployment can place files
// in different locations (dist, public, or parent folder).
// Allow explicit override via env (useful in deployments)
const envRoot = process.env.STATIC_ROOT;
const possibleRoots = [
	path.join(__dirname, '..', 'dist'),
	path.join(__dirname, '..', 'public'),
	path.join(__dirname, '..'),
	path.join(__dirname, '..', 'startup', 'dist'),
	path.join(__dirname, '..', 'startup', 'public')
];
let staticRoot = null;
if (envRoot && fs.existsSync(path.join(envRoot, 'index.html'))) staticRoot = envRoot;
else staticRoot = possibleRoots.find(p => fs.existsSync(path.join(p, 'index.html')));
if (!staticRoot) {
	// Fallback to parent folder (may still fail later when sendFile is used)
	staticRoot = path.join(__dirname, '..');
	console.warn('Warning: no index.html found in expected static locations. Serving', staticRoot);
}
app.use(express.static(staticRoot, { index: 'index.html' }));

// Simple health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// We'll connect to MongoDB if available and use collections for users/tasks.
// If no DB is configured, the service will continue to run but persistence will be disabled.
let db = null;
let usersCol = null;
let tasksCol = null;
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { ObjectId } = require('mongodb');

// List users (sanitized)
app.get('/api/users', async (req, res) => {
	try {
		if (!usersCol) return res.json([]);
		const docs = await usersCol.find({}, { projection: { passwordHash: 0 } }).toArray();
		const out = docs.map(u => ({ id: String(u._id), username: u.username, createdAt: u.createdAt }));
		return res.json(out);
	} catch (err) {
		console.error('GET /api/users error', err);
		return res.status(500).json({ error: 'server error' });
	}
});

// Create user
app.post('/api/users', async (req, res) => {
	const { username, password } = req.body || {};
	if (!username || !password) return res.status(400).json({ error: 'username and password required' });
	try {
		if (!usersCol) return res.status(503).json({ error: 'database not configured' });
		const existing = await usersCol.findOne({ username });
		if (existing) return res.status(409).json({ error: 'user exists' });
		const passwordHash = bcrypt.hashSync(password, 10);
		const now = new Date().toISOString();
		const result = await usersCol.insertOne({ username, passwordHash, createdAt: now });
		const id = String(result.insertedId);
		// Auto-login after registration by setting session
		try { if (req.session) req.session.userId = id; } catch (e) { console.error('Failed to set session during register', e); }
		return res.status(201).json({ id, username, createdAt: now });
	} catch (err) {
		console.error('POST /api/users error', err);
		return res.status(500).json({ error: 'server error' });
	}
});

// Login (simple check against stored users) - returns user info on success
app.post('/api/login', async (req, res) => {
	const { username, password } = req.body || {};
	if (!username || !password) return res.status(400).json({ error: 'username and password required' });
	try {
		if (!usersCol) return res.status(503).json({ error: 'database not configured' });
		const user = await usersCol.findOne({ username });
		if (!user) return res.status(400).json({ error: 'invalid credentials' });
		const ok = bcrypt.compareSync(password, user.passwordHash);
		if (!ok) return res.status(400).json({ error: 'invalid credentials' });
		// Set session user id
		try { if (req.session) req.session.userId = String(user._id); } catch (e) { console.error('Failed to set session during login', e); }
		return res.json({ id: String(user._id), username: user.username });
	} catch (err) {
		console.error('POST /api/login error', err);
		return res.status(500).json({ error: 'server error' });
	}
});

// Logout - destroy session
app.post('/api/logout', (req, res) => {
	if (req.session) {
		req.session.destroy(err => {
			if (err) return res.status(500).json({ error: 'failed to logout' });
			res.json({ ok: true });
		});
	} else {
		res.json({ ok: true });
	}
});

// Current session user
app.get('/api/me', async (req, res) => {
	const uid = req.session && req.session.userId;
	if (!uid) return res.status(200).json(null);
	try {
		if (!usersCol) return res.status(200).json(null);
		const u = await usersCol.findOne({ _id: new ObjectId(uid) });
		if (!u) return res.status(200).json(null);
		return res.json({ id: String(u._id), username: u.username });
	} catch (err) {
		console.error('GET /api/me error', err);
		return res.status(500).json({ error: 'server error' });
	}
});

// Get user by id (sanitized)
app.get('/api/users/:id', async (req, res) => {
	const id = req.params.id;
	try {
		if (!usersCol) return res.status(404).json({ error: 'not found' });
		const u = await usersCol.findOne({ _id: new ObjectId(id) });
		if (!u) return res.status(404).json({ error: 'not found' });
		return res.json({ id: String(u._id), username: u.username, createdAt: u.createdAt });
	} catch (err) {
		console.error('GET /api/users/:id error', err);
		return res.status(500).json({ error: 'server error' });
	}
});

// Update user (username or password)
app.put('/api/users/:id', async (req, res) => {
	const id = req.params.id;
	const { username, password } = req.body || {};
	try {
		if (!usersCol) return res.status(503).json({ error: 'database not configured' });
		const existing = await usersCol.findOne({ _id: new ObjectId(id) });
		if (!existing) return res.status(404).json({ error: 'not found' });
		if (username && username !== existing.username) {
			const conflict = await usersCol.findOne({ username });
			if (conflict) return res.status(409).json({ error: 'username taken' });
		}
		const update = {};
		if (typeof username === 'string') update.username = username;
		if (typeof password === 'string' && password.length > 0) update.passwordHash = bcrypt.hashSync(password, 10);
		update.updatedAt = new Date().toISOString();
		await usersCol.updateOne({ _id: new ObjectId(id) }, { $set: update });
		const u = await usersCol.findOne({ _id: new ObjectId(id) });
		return res.json({ id: String(u._id), username: u.username, createdAt: u.createdAt, updatedAt: u.updatedAt });
	} catch (err) {
		console.error('PUT /api/users/:id error', err);
		return res.status(500).json({ error: 'server error' });
	}
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
	const id = req.params.id;
	try {
		if (!usersCol || !tasksCol) return res.status(503).json({ error: 'database not configured' });
		const u = await usersCol.findOne({ _id: new ObjectId(id) });
		if (!u) return res.status(404).json({ error: 'not found' });
		const del = await usersCol.deleteOne({ _id: new ObjectId(id) });
		const removedTasksRes = await tasksCol.deleteMany({ ownerId: id });
		return res.json({ id: id, username: u.username, removedTasks: removedTasksRes.deletedCount });
	} catch (err) {
		console.error('DELETE /api/users/:id error', err);
		return res.status(500).json({ error: 'server error' });
	}
});

// List all tasks
function requireAuth(req, res, next) {
	if (!req.session || !req.session.userId) return res.status(401).json({ error: 'unauthenticated' });
	next();
}

// List all tasks for the logged-in user
app.get('/api/tasks', requireAuth, async (req, res) => {
	try {
		if (!tasksCol) return res.json([]);
		const uid = req.session.userId;
		const docs = await tasksCol.find({ ownerId: uid }).toArray();
		const out = docs.map(t => ({ id: String(t._id), title: t.title, details: t.details, recurring: !!t.recurring, frequency: t.frequency || '', ownerId: t.ownerId, createdAt: t.createdAt, completedDates: t.completedDates || [], updatedAt: t.updatedAt }));
		return res.json(out);
	} catch (err) {
		console.error('GET /api/tasks error', err);
		return res.status(500).json({ error: 'server error' });
	}
});

// Create a task for the logged-in user
app.post('/api/tasks', requireAuth, async (req, res) => {
	const { title, details, recurring, frequency } = req.body || {};
	if (!title || typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'title required' });
	try {
		if (!tasksCol) return res.status(503).json({ error: 'database not configured' });
		const uid = req.session.userId;
		const doc = {
			title: title.trim(),
			details: (details || '').toString(),
			recurring: !!recurring,
			frequency: recurring ? (frequency || 'Every Day') : '',
			ownerId: uid,
			createdAt: new Date().toISOString(),
			completedDates: []
		};
		const result = await tasksCol.insertOne(doc);
		const inserted = await tasksCol.findOne({ _id: result.insertedId });
		const out = { id: String(inserted._id), title: inserted.title, details: inserted.details, recurring: !!inserted.recurring, frequency: inserted.frequency || '', ownerId: inserted.ownerId, createdAt: inserted.createdAt, completedDates: inserted.completedDates || [] };
		return res.status(201).json(out);
	} catch (err) {
		console.error('POST /api/tasks error', err);
		return res.status(500).json({ error: 'server error' });
	}
});

// List tasks for a specific user
// List tasks for a specific user (only allowed for that user)
app.get('/api/users/:id/tasks', requireAuth, async (req, res) => {
	const uid = req.params.id;
	if (req.session.userId !== uid) return res.status(403).json({ error: 'forbidden' });
	try {
		if (!tasksCol || !usersCol) return res.status(503).json({ error: 'database not configured' });
		const user = await usersCol.findOne({ _id: new ObjectId(uid) });
		if (!user) return res.status(404).json({ error: 'user not found' });
		const docs = await tasksCol.find({ ownerId: uid }).toArray();
		const out = docs.map(t => ({ id: String(t._id), title: t.title, details: t.details, recurring: !!t.recurring, frequency: t.frequency || '', ownerId: t.ownerId, createdAt: t.createdAt, completedDates: t.completedDates || [], updatedAt: t.updatedAt }));
		return res.json(out);
	} catch (err) {
		console.error('GET /api/users/:id/tasks error', err);
		return res.status(500).json({ error: 'server error' });
	}
});

// Get single task
app.get('/api/tasks/:id', async (req, res) => {
	const id = req.params.id;
	try {
		if (!tasksCol) return res.status(404).json({ error: 'not found' });
		const t = await tasksCol.findOne({ _id: new ObjectId(id) });
		if (!t) return res.status(404).json({ error: 'not found' });
		return res.json({ id: String(t._id), title: t.title, details: t.details, recurring: !!t.recurring, frequency: t.frequency || '', ownerId: t.ownerId, createdAt: t.createdAt, completedDates: t.completedDates || [] });
	} catch (err) {
		console.error('GET /api/tasks/:id error', err);
		return res.status(500).json({ error: 'server error' });
	}
});

// Update task (partial updates allowed)
app.put('/api/tasks/:id', async (req, res) => {
	const id = req.params.id;
	const { title, details, recurring, frequency, completedDates } = req.body || {};
	try {
		if (!tasksCol) return res.status(503).json({ error: 'database not configured' });
		const existing = await tasksCol.findOne({ _id: new ObjectId(id) });
		if (!existing) return res.status(404).json({ error: 'not found' });
		// Only owner can modify
		if (!req.session || req.session.userId !== existing.ownerId) return res.status(403).json({ error: 'forbidden' });
		const update = {};
		if (typeof title === 'string' && title.trim()) update.title = title.trim();
		if (typeof details === 'string') update.details = details;
		if (typeof recurring === 'boolean') update.recurring = recurring;
		if (typeof frequency === 'string') update.frequency = frequency;
		if (Array.isArray(completedDates)) update.completedDates = completedDates;
		update.updatedAt = new Date().toISOString();
		await tasksCol.updateOne({ _id: new ObjectId(id) }, { $set: update });
		const t = await tasksCol.findOne({ _id: new ObjectId(id) });
		return res.json({ id: String(t._id), title: t.title, details: t.details, recurring: !!t.recurring, frequency: t.frequency || '', ownerId: t.ownerId, createdAt: t.createdAt, completedDates: t.completedDates || [], updatedAt: t.updatedAt });
	} catch (err) {
		console.error('PUT /api/tasks/:id error', err);
		return res.status(500).json({ error: 'server error' });
	}
});

// Delete task
app.delete('/api/tasks/:id', async (req, res) => {
	const id = req.params.id;
	try {
		if (!tasksCol) return res.status(503).json({ error: 'database not configured' });
		const existing = await tasksCol.findOne({ _id: new ObjectId(id) });
		if (!existing) return res.status(404).json({ error: 'not found' });
		if (!req.session || req.session.userId !== existing.ownerId) return res.status(403).json({ error: 'forbidden' });
		await tasksCol.deleteOne({ _id: new ObjectId(id) });
		return res.json({ id: id });
	} catch (err) {
		console.error('DELETE /api/tasks/:id error', err);
		return res.status(500).json({ error: 'server error' });
	}
});

// For SPA client-side routing: return index.html for unknown GET routes (except /api)
// Use function middleware instead of a wildcard path so Express path parsing isn't used
app.use((req, res, next) => {
	if (req.method !== 'GET') return next();
	if (req.path.startsWith('/api/')) return next();
	res.sendFile(path.join(staticRoot, 'index.html'));
});

// Notification endpoints (simple): send a test notification to currently logged-in user
app.post('/api/notify-test', requireAuth, (req, res) => {
	const uid = req.session.userId;
	const message = req.body && req.body.message ? String(req.body.message) : 'Test notification';
	const sent = app.locals.sendNotification ? app.locals.sendNotification(uid, { message }) : 0;
	res.json({ ok: true, sent });
});

// Admin/test route to notify arbitrary user id (must be authenticated). Use carefully.
app.post('/api/notify/:userId', requireAuth, (req, res) => {
	const target = req.params.userId;
	const payload = req.body || { message: 'Server notification' };
	const sent = app.locals.sendNotification ? app.locals.sendNotification(target, payload) : 0;
	res.json({ ok: true, sent });
});

// WebSocket clients mapped by userId -> Set of ws
const clientsByUser = new Map();

function addClient(userId, ws) {
	if (!clientsByUser.has(userId)) clientsByUser.set(userId, new Set());
	clientsByUser.get(userId).add(ws);
}

function removeClient(userId, ws) {
	if (!clientsByUser.has(userId)) return;
	const s = clientsByUser.get(userId);
	s.delete(ws);
	if (s.size === 0) clientsByUser.delete(userId);
}

function sendNotification(userId, payload) {
	const set = clientsByUser.get(userId);
	if (!set) return 0;
	const msg = JSON.stringify({ type: 'notification', payload, time: new Date().toISOString() });
	let sent = 0;
	for (const ws of set) {
		if (ws.readyState === WebSocket.OPEN) {
			ws.send(msg);
			sent++;
		}
	}
	return sent;
}

async function start() {
	try {
		const database = await connectDB();
		if (database) {
			db = database;
			usersCol = db.collection('users');
			tasksCol = db.collection('tasks');
			console.log('Connected to MongoDB, using collections users and tasks');
		} else {
			console.warn('No MongoDB configured; running with in-memory or no persistence');
		}
	} catch (err) {
		console.error('Failed to connect to database', err);
	}
	// Create an HTTP server and attach WebSocket server so WS shares same port
	const server = http.createServer(app);

	// Create a wss but we'll handle upgrade manually to attach session
	const wss = new WebSocket.Server({ noServer: true });

	server.on('upgrade', (request, socket, head) => {
		// reuse the session parser to populate request.session
		sessionParser(request, {}, () => {
			const sess = request.session;
			if (!sess || !sess.userId) {
				socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
				socket.destroy();
				return;
			}
			wss.handleUpgrade(request, socket, head, (ws) => {
				wss.emit('connection', ws, request);
			});
		});
	});

	wss.on('connection', (ws, request) => {
		const userId = request.session && request.session.userId;
		if (!userId) {
			ws.close();
			return;
		}
		addClient(userId, ws);
		console.log(`[ws] user connected userId=${userId} totalSockets=${clientsByUser.get(userId).size}`);

		ws.on('message', (msg) => {
			// simple protocol: expect JSON messages with { type, payload }
			try {
				const data = JSON.parse(msg.toString());
				// support ping/pong or client requests here in future
				if (data && data.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
			} catch (e) { /* ignore */ }
		});

		ws.on('close', () => {
			removeClient(userId, ws);
			console.log(`[ws] user disconnected userId=${userId}`);
		});
	});

	// Expose helper on app for other modules or startup code
	app.locals.sendNotification = sendNotification;

	// Start scheduled notifier if DB is available
	const CHECK_MIN = Number(process.env.NOTIFY_CHECK_INTERVAL_MIN) || 5;
	const MIN_NOTIFY_GAP_MS = Number(process.env.NOTIFY_MIN_GAP_MS) || (24 * 60 * 60 * 1000); // default 24h

	async function checkDueTasks() {
		if (!tasksCol) return;
		const now = new Date();

		// 1) Recurring tasks
		const recurring = await tasksCol.find({ recurring: true }).toArray();
		for (const t of recurring) {
			try {
				const completed = Array.isArray(t.completedDates) && t.completedDates.length ? new Date(t.completedDates[t.completedDates.length - 1]) : new Date(t.createdAt || t._id.getTimestamp());
				const lastNotified = t.lastNotifiedAt ? new Date(t.lastNotifiedAt) : null;
				const freq = (t.frequency || '').toLowerCase();
				let due = false;
				if (freq.includes('day')) {
					// due if not completed today
					const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
					if (completed < today) due = true;
				} else if (freq.includes('week')) {
					const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
					if (completed < cutoff) due = true;
				} else if (freq.includes('month')) {
					const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
					if (completed < cutoff) due = true;
				} else {
					// unknown frequency: default to daily
					const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
					if (completed < today) due = true;
				}
				if (!due) continue;
				if (lastNotified && (now.getTime() - lastNotified.getTime()) < MIN_NOTIFY_GAP_MS) continue;
				// send notification
				const sent = app.locals.sendNotification ? app.locals.sendNotification(t.ownerId, { type: 'task_due', taskId: String(t._id), title: t.title, message: `Task due: ${t.title}` }) : 0;
				if (sent > 0) {
					await tasksCol.updateOne({ _id: t._id }, { $set: { lastNotifiedAt: now.toISOString() } });
					console.log(`[notify] sent ${sent} notifications for task ${t._id}`);
				}
			} catch (e) { console.error('checkDueTasks recurring error', e); }
		}

		// 2) Non-recurring tasks with dueDate
		const dueTasks = await tasksCol.find({ dueDate: { $exists: true } }).toArray();
		for (const t of dueTasks) {
			try {
				const dueDate = new Date(t.dueDate);
				if (isNaN(dueDate.getTime())) continue;
				const lastNotified = t.lastNotifiedAt ? new Date(t.lastNotifiedAt) : null;
				// treat completedDates containing a date on/after dueDate as done
				const done = Array.isArray(t.completedDates) && t.completedDates.some(d => new Date(d) >= dueDate);
				if (done) continue;
				if (dueDate <= now) {
					if (lastNotified && (now.getTime() - lastNotified.getTime()) < MIN_NOTIFY_GAP_MS) continue;
					const sent = app.locals.sendNotification ? app.locals.sendNotification(t.ownerId, { type: 'task_due', taskId: String(t._id), title: t.title, message: `Task due: ${t.title}` }) : 0;
					if (sent > 0) {
						await tasksCol.updateOne({ _id: t._id }, { $set: { lastNotifiedAt: now.toISOString() } });
						console.log(`[notify] sent ${sent} notifications for due task ${t._id}`);
					}
				}
			} catch (e) { console.error('checkDueTasks dueDate error', e); }
		}
	}

	// Run initial check then schedule
	try { await checkDueTasks(); } catch (e) { console.error('Initial checkDueTasks failed', e); }
	setInterval(() => { checkDueTasks().catch(err => console.error('checkDueTasks interval error', err)); }, CHECK_MIN * 60 * 1000);

	server.listen(port, () => console.log(`Service listening on http://localhost:${port}`));
}

start();

module.exports = app;