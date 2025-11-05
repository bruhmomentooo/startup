const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const port = process.env.PORT || (process.argv.length > 2 ? Number(process.argv[2]) : 4000);

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static frontend files from the parent folder (project root `startup`)
const staticRoot = path.join(__dirname, '..');
// serve files and let the client-side router handle routing; set index to index.html
app.use(express.static(staticRoot, { index: 'index.html' }));

// Simple health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Example API placeholder (in-memory) -- optional, can be expanded later
const tasks = [];
app.get('/api/tasks', (req, res) => res.json(tasks));
app.post('/api/tasks', (req, res) => {
	const { title, details, recurring, frequency } = req.body || {};
	if (!title) return res.status(400).json({ error: 'title required' });
	const t = { id: `t-${Date.now()}`, title, details: details || '', recurring: !!recurring, frequency: recurring ? (frequency || 'Every Day') : '' };
	tasks.push(t);
	res.status(201).json(t);
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