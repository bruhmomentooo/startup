const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
// Load .env in service folder for server-only secrets
try { require('dotenv').config({ path: path.join(__dirname, '.env') }); } catch (e) { /* ignore if dotenv not installed */ }
const session = require('express-session');

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
		const key = process.env.UNSPLASH_KEY;
		if (!key) return res.status(500).json({ error: 'server missing UNSPLASH_KEY' });
		try {
			const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${Number(perPage) || 8}`;
			const upstream = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } });
			const data = await upstream.json();
			return res.json(data);
		} catch (err) {
			console.error('photo search proxy error', err);
			return res.status(500).json({ error: String(err) });
		}
	});

// Serve static frontend files from the parent folder (project root `startup`)
const staticRoot = path.join(__dirname, '..');
// serve files and let the client-side router handle routing; set index to index.html
app.use(express.static(staticRoot, { index: 'index.html' }));

// Simple health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

const fs = require('fs');
const dataDir = path.join(__dirname, 'data');
const tasksFile = path.join(dataDir, 'tasks.json');
const usersFile = path.join(dataDir, 'users.json');

// Ensure data directory exists
try { fs.mkdirSync(dataDir, { recursive: true }); } catch (e) { console.error('Failed to create data dir', e); }

// Example API placeholder: load persisted tasks (file-backed)
let tasks = [];
try {
	if (fs.existsSync(tasksFile)) {
		const raw = fs.readFileSync(tasksFile, 'utf8');
		tasks = JSON.parse(raw) || [];
	}
} catch (e) {
	console.error('Failed to read tasks file, starting empty', e);
	tasks = [];
}

async function saveTasks() {
	try {
		await fs.promises.writeFile(tasksFile, JSON.stringify(tasks, null, 2), 'utf8');
	} catch (e) {
		console.error('Failed to save tasks', e);
	}
}

async function saveUsers() {
	try {
		await fs.promises.writeFile(usersFile, JSON.stringify(users, null, 2), 'utf8');
	} catch (e) {
		console.error('Failed to save users', e);
	}
}

// Simple in-memory users placeholder (will become DB later)
let users = [];
try {
	if (fs.existsSync(usersFile)) {
		const raw = fs.readFileSync(usersFile, 'utf8');
		users = JSON.parse(raw) || [];
	}
} catch (e) {
	console.error('Failed to read users file, starting empty', e);
	users = [];
}
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// List users (sanitized)
app.get('/api/users', (req, res) => {
	res.json(users.map(u => ({ id: u.id, username: u.username, createdAt: u.createdAt })));
});

// Create user
app.post('/api/users', async (req, res) => {
	const { username, password } = req.body || {};
	if (!username || !password) return res.status(400).json({ error: 'username and password required' });
	if (users.find(u => u.username === username)) return res.status(409).json({ error: 'user exists' });
	const id = uuidv4();
	const passwordHash = bcrypt.hashSync(password, 10);
	const user = { id, username, passwordHash, createdAt: new Date().toISOString() };
	users.push(user);
	await saveUsers();
	// Auto-login after registration by setting session
	try {
		if (req.session) req.session.userId = user.id;
	} catch (e) { console.error('Failed to set session during register', e); }
	res.status(201).json({ id: user.id, username: user.username, createdAt: user.createdAt });
});

// Login (simple check against stored users) - returns user info on success
app.post('/api/login', (req, res) => {
	const { username, password } = req.body || {};
	if (!username || !password) return res.status(400).json({ error: 'username and password required' });
	const user = users.find(u => u.username === username);
	if (!user) return res.status(400).json({ error: 'invalid credentials' });
	const ok = bcrypt.compareSync(password, user.passwordHash);
	if (!ok) return res.status(400).json({ error: 'invalid credentials' });
	// Set session user id
	try {
		if (req.session) req.session.userId = user.id;
	} catch (e) { console.error('Failed to set session during login', e); }
	res.json({ id: user.id, username: user.username });
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
app.get('/api/me', (req, res) => {
	const uid = req.session && req.session.userId;
	if (!uid) return res.status(200).json(null);
	const u = users.find(x => x.id === uid);
	if (!u) return res.status(200).json(null);
	res.json({ id: u.id, username: u.username });
});

// Get user by id (sanitized)
app.get('/api/users/:id', (req, res) => {
	const id = req.params.id;
	const u = users.find(x => x.id === id);
	if (!u) return res.status(404).json({ error: 'not found' });
	res.json({ id: u.id, username: u.username, createdAt: u.createdAt });
});

// Update user (username or password)
app.put('/api/users/:id', (req, res) => {
	const id = req.params.id;
	const idx = users.findIndex(x => x.id === id);
	if (idx === -1) return res.status(404).json({ error: 'not found' });
	const { username, password } = req.body || {};
	if (username && users.some((u, i) => u.username === username && i !== idx)) return res.status(409).json({ error: 'username taken' });
	if (typeof username === 'string') users[idx].username = username;
	if (typeof password === 'string' && password.length > 0) users[idx].passwordHash = bcrypt.hashSync(password, 10);
	users[idx].updatedAt = new Date().toISOString();
	const u = users[idx];
	saveUsers().catch(err => console.error('Failed to save users after update', err));
	res.json({ id: u.id, username: u.username, createdAt: u.createdAt, updatedAt: u.updatedAt });
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
	const id = req.params.id;
	const idx = users.findIndex(x => x.id === id);
	if (idx === -1) return res.status(404).json({ error: 'not found' });
	const removed = users.splice(idx, 1)[0];
	// remove tasks owned by this user
	const before = tasks.length;
	tasks = tasks.filter(t => t.ownerId !== id);
	const removedTasks = before - tasks.length;
	saveUsers().catch(err => console.error('Failed to save users after delete', err));
	saveTasks().catch(err => console.error('Failed to save tasks after user delete', err));
	res.json({ id: removed.id, username: removed.username, removedTasks });
});

// List all tasks
function requireAuth(req, res, next) {
	if (!req.session || !req.session.userId) return res.status(401).json({ error: 'unauthenticated' });
	next();
}

// List all tasks for the logged-in user
app.get('/api/tasks', requireAuth, (req, res) => {
	const uid = req.session.userId;
	const userTasks = tasks.filter(t => t.ownerId === uid);
	res.json(userTasks);
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