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

// Example API placeholder (in-memory) -- simple REST for tasks
const tasks = [];

// List all tasks
app.get('/api/tasks', (req, res) => {
	res.json(tasks);
});

// Create a task
app.post('/api/tasks', (req, res) => {
	const { title, details, recurring, frequency } = req.body || {};
	if (!title || typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'title required' });
	const t = {
		id: `t-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
		title: title.trim(),
		details: (details || '').toString(),
		recurring: !!recurring,
		frequency: recurring ? (frequency || 'Every Day') : '',
		createdAt: new Date().toISOString(),
		completedDates: []
	};
	tasks.push(t);
	res.status(201).json(t);
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
	if (typeof title === 'string' && title.trim()) existing.title = title.trim();
	if (typeof details === 'string') existing.details = details;
	if (typeof recurring === 'boolean') existing.recurring = recurring;
	if (typeof frequency === 'string') existing.frequency = frequency;
	if (Array.isArray(completedDates)) existing.completedDates = completedDates;
	existing.updatedAt = new Date().toISOString();
	tasks[idx] = existing;
	res.json(existing);
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
	const id = req.params.id;
	const idx = tasks.findIndex(x => x.id === id);
	if (idx === -1) return res.status(404).json({ error: 'not found' });
	const removed = tasks.splice(idx, 1)[0];
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