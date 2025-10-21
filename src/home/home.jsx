import React, { useState, useEffect } from 'react';
import './home-style.css';
import './tasks_modal.css';

export function Home() {
// Sidebar Functions
// Load from localStorage if available, otherwise seed with defaults
const [recurringTasks, setRecurringTasks] = useState(() => {
    try {
        const raw = localStorage.getItem('recurringTasks');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) { /* ignore malformed data */ }
    return []; // start empty for a fresh login
});

const [normalTasks, setNormalTasks] = useState(() => {
    try {
        const raw = localStorage.getItem('normalTasks');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) { /* ignore malformed data */ }
    return []; // start empty for a fresh login
});

// temporary holder used for the create-modal
const [newTask, setNewTask] = useState({ title: '', details: '', recurring: false });

// Create-modal state
const [createPopup, setCreatePopup] = useState({ show: false, title: '', details: '', recurring: false });

function createTask(e) {
    // keep compat with previous form-based call, but prefer modal flow
    e && e.preventDefault();
    const source = e && e._isCreateModal ? createPopup : newTask;
    if (!source.title || !source.title.trim()) return;
        const task = { id: `${source.recurring ? 'r' : 'n'}-${Date.now()}-${Math.floor(Math.random()*1000)}`, title: source.title.trim(), details: (source.details||'').trim(), last: 'Never', completedDates: [] };
    if (source.recurring) {
        setRecurringTasks(t => [task, ...t]);
    } else {
        setNormalTasks(t => [task, ...t]);
    }
    setNewTask({ title: '', details: '', recurring: false });
    setCreatePopup({ show: false, title: '', details: '', recurring: false });
}

function removeTask(listName, index) {
    if (listName === 'recurring') {
        setRecurringTasks(t => t.filter((_, i) => i !== index));
    } else {
        setNormalTasks(t => t.filter((_, i) => i !== index));
    }
}

function addToGoogleCalendar() {
    alert('Add to Google Calendar (not implemented)');
}

function manageNotifications() {
    alert('Manage notifications (not implemented)');
}

// Task Functions
const [popup, setPopup] = useState({ show: false, title: '', details: '', completedDates: [] });

function viewTask(task) {
    setPopup({ show: true, title: task.title, details: task.details, completedDates: task.completedDates || [] });
}

function editTask(title) {
        // Kept for compatibility, but prefer openEdit to show modal
        alert('Edit screen for: ' + title);
}

function closePopup() {
    setPopup({ show: false, title: '', details: '', completedDates: [] });
}

    // Edit modal state
    const [editPopup, setEditPopup] = useState({ show: false, id: null, title: '', details: '', recurring: false, list: null });

    // Track checkbox temporary resets: when user checks, we flash the toast and then uncheck visually
    const [resetChecks, setResetChecks] = useState(new Set());

    function openEdit(list, id) {
        const sourceList = list === 'recurring' ? recurringTasks : normalTasks;
        const item = sourceList.find(t => t.id === id);
        if (!item) return alert('Task not found');
        setEditPopup({ show: true, id: item.id, title: item.title, details: item.details || '', recurring: list === 'recurring', list, completedDates: Array.isArray(item.completedDates) ? [...item.completedDates] : [] });
    }

    function saveEdit(e) {
        e && e.preventDefault();
        if (!editPopup.id) return;
            const updatedFields = { title: editPopup.title.trim(), details: editPopup.details.trim(), completedDates: Array.isArray(editPopup.completedDates) ? [...editPopup.completedDates] : [] };
        if (editPopup.list === 'recurring') {
            setRecurringTasks(ts => ts.map(t => t.id === editPopup.id ? { ...t, ...updatedFields } : t));
        } else {
            setNormalTasks(ts => ts.map(t => t.id === editPopup.id ? { ...t, ...updatedFields } : t));
        }
            setEditPopup({ show: false, id: null, title: '', details: '', recurring: false, list: null, completedDates: [] });
    }

// Record completion when a checkbox is checked. We'll append today's date and update last.
function toggleComplete(listName, id, checked) {
    if (!checked) return; // only record on check
    const dateStr = (new Date()).toISOString().slice(0,10);
    if (listName === 'recurring') {
        setRecurringTasks(ts => ts.map(t => t.id === id ? { ...t, completedDates: Array.isArray(t.completedDates) ? [...t.completedDates, dateStr] : [dateStr], last: dateStr } : t));
    } else {
        setNormalTasks(ts => ts.map(t => t.id === id ? { ...t, completedDates: Array.isArray(t.completedDates) ? [...t.completedDates, dateStr] : [dateStr], last: dateStr } : t));
    }
    // show a quick confirmation toast
    setToast({ show: true, message: 'Task completed! (' + formatDate(dateStr) + ')' });
    setTimeout(() => setToast({ show: false, message: '' }), 2000);
    // schedule a visual uncheck after a short delay
    setResetChecks(prev => {
        const copy = new Set(prev);
        copy.add(id);
        return copy;
    });
    setTimeout(() => setResetChecks(prev => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
    }), 300);
}

// Toast state for visual confirmation
const [toast, setToast] = useState({ show: false, message: '' });

// small friendly date formatter
function formatDate(isoDate) {
    try {
        const d = new Date(isoDate);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) { return isoDate; }
}

// Persist to localStorage whenever the lists change
useEffect(() => {
    try {
        const toSave = Array.isArray(recurringTasks) ? recurringTasks.filter(t => t && typeof t === 'object') : [];
        localStorage.setItem('recurringTasks', JSON.stringify(toSave));
    } catch (e) {}
}, [recurringTasks]);

useEffect(() => {
    try {
        const toSave = Array.isArray(normalTasks) ? normalTasks.filter(t => t && typeof t === 'object') : [];
        localStorage.setItem('normalTasks', JSON.stringify(toSave));
    } catch (e) {}
}, [normalTasks]);

  return (
    <main>
        <div className="content">
            {/* Sidebar */}
            <div id="siteSidebar" className="sidebar">
                <button type="button" onClick={() => setCreatePopup({ show: true, title: '', details: '', recurring: false })}>Create Task</button>
                <button type="button" onClick={addToGoogleCalendar}>Add to Google Calendar</button>
                <button type="button" onClick={manageNotifications}>Notifications</button>
            </div>
            {/* Recurring Task List */}
                <div className="task_container" id="recurringTasks">
                    <h3>Recurring Tasks</h3>
                    {recurringTasks.length === 0 && <p style={{textAlign: "center"}}>No recurring tasks</p>}
                    {recurringTasks.map((t, i) => (
                        <div className="task" key={`rec-${i}`}>
                                <input className="form-check-input" type="checkbox" id={`recurring${i}`} onChange={e => toggleComplete('recurring', t.id, e.target.checked)} checked={resetChecks.has(t.id) ? false : undefined} />
                                <div className="task-details">
                                    <label htmlFor={`recurring${i}`}>{t.title}</label>
                                    <p><i>Last completed: {t.last}</i></p>
                                </div>
                                <button type="button" onClick={() => viewTask(t)}>View</button>
                                <button type="button" onClick={() => openEdit('recurring', t.id)}>Edit</button>
                                <button type="button" onClick={() => removeTask('recurring', i)}>Remove</button>
                        </div>
                    ))}
                </div>

                <div className="task_container" id="normalTasks">
                    <h3>Tasks</h3>
                    {normalTasks.length === 0 && <p style={{textAlign: "center"}}>No tasks</p>}
                    {normalTasks.map((t, i) => (
                        <div className="task" key={`norm-${i}`}>
                            <input className="form-check-input" type="checkbox" id={`all${i}`} onChange={e => toggleComplete('normal', t.id, e.target.checked)} checked={resetChecks.has(t.id) ? false : undefined} />
                            <div className="task-details">
                                <label htmlFor={`all${i}`}>{t.title}</label>
                                <p><i>Last completed: {t.last}</i></p>
                            </div>
                            <button type="button" onClick={() => viewTask(t)}>View</button>
                            <button type="button" onClick={() => openEdit('normal', t.id)}>Edit</button>
                            <button type="button" onClick={() => removeTask('normal', i)}>Remove</button>
                        </div>
                    ))}
                </div>
        </div>
            {/* View Popup Code */}
            <div id="popup" className="popup" style={{ display: popup.show ? 'block' : 'none' }} onClick={(e) => { if (e.target.id === 'popup') closePopup(); }}>
                <div className="popup-content">
                    <span className="close" onClick={closePopup}>&times;</span>
                        <h2 id="popup-title">{popup.title}</h2>
                        <div id="popup-details">{popup.details}</div>
                        {popup.completedDates && popup.completedDates.length > 0 && (
                            <div style={{ marginTop: 12 }}>
                                <strong>Times completed:</strong>
                                <ul>
                                    {popup.completedDates.map((d, idx) => <li key={idx}>{formatDate(d)}</li>)}
                                </ul>
                            </div>
                        )}
                </div>
            </div>

            {/* Create Popup Code */}
            <div id="createPopup" className="popup" style={{ display: createPopup.show ? 'block' : 'none' }} onClick={(e) => { if (e.target.id === 'createPopup') setCreatePopup({ show: false, title: '', details: '', recurring: false }); }}>
                <div className="popup-content">
                    <span className="close" onClick={() => setCreatePopup({ show: false, title: '', details: '', recurring: false })}>&times;</span>
                    <h2>Create Task</h2>
                    <form onSubmit={(e) => { e && (e._isCreateModal = true); createTask(e); }}>
                        <label>Title</label>
                        <input value={createPopup.title} onChange={e => setCreatePopup(cp => ({ ...cp, title: e.target.value }))} required />
                        <label>Details</label>
                        <input value={createPopup.details} onChange={e => setCreatePopup(cp => ({ ...cp, details: e.target.value }))} />
                        <label><input type="checkbox" checked={createPopup.recurring} onChange={e => setCreatePopup(cp => ({ ...cp, recurring: e.target.checked }))} /> Recurring?</label>
                        <div style={{ marginTop: 12 }}>
                            <button type="submit">Create</button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Edit Popup Code */}
            <div id="editPopup" className="popup" style={{ display: editPopup.show ? 'block' : 'none' }} onClick={(e) => { if (e.target.id === 'editPopup') setEditPopup({ show: false, id: null, title: '', details: '', recurring: false, list: null }); }}>
                <div className="popup-content">
                    <span className="close" onClick={() => setEditPopup({ show: false, id: null, title: '', details: '', recurring: false, list: null })}>&times;</span>
                    <h2>Edit Task</h2>
                    <form onSubmit={saveEdit}>
                        <label>Title</label>
                        <input value={editPopup.title} onChange={e => setEditPopup(ep => ({ ...ep, title: e.target.value }))} required />
                        <label>Details</label>
                        <input value={editPopup.details} onChange={e => setEditPopup(ep => ({ ...ep, details: e.target.value }))} />
                        <label style={{ marginTop: 8, fontWeight: 'bold' }}>Completed dates:</label>
                        {editPopup.completedDates && editPopup.completedDates.length === 0 && <div><em>No recorded completions</em></div>}
                        {editPopup.completedDates && editPopup.completedDates.length > 0 && (
                            <ul>
                                {editPopup.completedDates.map((d, idx) => (
                                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span>{formatDate(d)}</span>
                                        <button
                                            type="button"
                                            className="date-remove-btn"
                                            aria-label={`Remove ${formatDate(d)}`}
                                            onClick={() => setEditPopup(ep => ({ ...ep, completedDates: ep.completedDates.filter((_,i) => i !== idx) }))}
                                        >&times;</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <div style={{ marginTop: 12 }}>
                            <button type="submit">Save</button>
                        </div>
                    </form>
                </div>
            </div>

                        {/* Toast confirmation */}
                        {toast.show && (
                                <div className="task-toast">{toast.message}</div>
                        )}
    </main>
  );
}