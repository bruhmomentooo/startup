const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
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
const fs = require('fs');
// Database helper (connects to MongoDB when available)
const { connectDB } = require('./database');

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
	app.use(session({
		secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			secure: false,
			sameSite: 'lax',
		}
	}));

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
app.post('/api/tasks', requireAuth, (req, res) => {
	const { title, details, recurring, frequency } = req.body || {};
	if (!title || typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'title required' });
	const uid = req.session.userId;
	const t = {
		id: `t-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
		title: title.trim(),
		details: (details || '').toString(),
		recurring: !!recurring,
		frequency: recurring ? (frequency || 'Every Day') : '',
		ownerId: uid,
		createdAt: new Date().toISOString(),
		completedDates: []
	};
	tasks.push(t);
	saveTasks().catch(err => console.error('Failed to save tasks after create', err));
	res.status(201).json(t);
});

// List tasks for a specific user
// List tasks for a specific user (only allowed for that user)
app.get('/api/users/:id/tasks', requireAuth, (req, res) => {
	const uid = req.params.id;
	if (req.session.userId !== uid) return res.status(403).json({ error: 'forbidden' });
	const user = users.find(u => u.id === uid);
	if (!user) return res.status(404).json({ error: 'user not found' });
	const userTasks = tasks.filter(t => t.ownerId === uid);
	res.json(userTasks);
});

// Get single task
app.get('/api/tasks/:id', (req, res) => {
	const id = req.params.id;
	const t = tasks.find(x => x.id === id);
	if (!t) return res.status(404).json({ error: 'not found' });
	res.json(t);
});

// Update task (partial updates allowed)
app.put('/api/tasks/:id', (req, res) => {
	const id = req.params.id;
	const idx = tasks.findIndex(x => x.id === id);
	if (idx === -1) return res.status(404).json({ error: 'not found' });
	const { title, details, recurring, frequency, completedDates } = req.body || {};
	const existing = tasks[idx];
	// Only owner can modify
	if (!req.session || req.session.userId !== existing.ownerId) return res.status(403).json({ error: 'forbidden' });
	if (typeof title === 'string' && title.trim()) existing.title = title.trim();
	if (typeof details === 'string') existing.details = details;
	if (typeof recurring === 'boolean') existing.recurring = recurring;
	if (typeof frequency === 'string') existing.frequency = frequency;
	if (Array.isArray(completedDates)) existing.completedDates = completedDates;
	existing.updatedAt = new Date().toISOString();
	tasks[idx] = existing;
	saveTasks().catch(err => console.error('Failed to save tasks after update', err));
	res.json(existing);
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
	const id = req.params.id;
	const idx = tasks.findIndex(x => x.id === id);
	if (idx === -1) return res.status(404).json({ error: 'not found' });
	const existing = tasks[idx];
	if (!req.session || req.session.userId !== existing.ownerId) return res.status(403).json({ error: 'forbidden' });
	const removed = tasks.splice(idx, 1)[0];
	saveTasks().catch(err => console.error('Failed to save tasks after delete', err));
	res.json(removed);
});

// For SPA client-side routing: return index.html for unknown GET routes (except /api)
// Use function middleware instead of a wildcard path so Express path parsing isn't used
app.use((req, res, next) => {
	if (req.method !== 'GET') return next();
	if (req.path.startsWith('/api/')) return next();
	res.sendFile(path.join(staticRoot, 'index.html'));
});

app.listen(port, () => console.log(`Service listening on http://localhost:${port}`));

module.exports = app;