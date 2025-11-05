import React, { useState, useEffect } from 'react';
import './home-style.css';
import './tasks_modal.css';

// API base: when developing with Vite (different port), point to backend on 4000
const API_BASE = (typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port !== '4000') ? 'http://localhost:4000' : '';

export function Home({ user }) {
// Sidebar Functions
// Tasks are stored on the server; keep local state only and load on mount
const [recurringTasks, setRecurringTasks] = useState([]);
const [normalTasks, setNormalTasks] = useState([]);

// temporary holder used for the create-modal
const [newTask, setNewTask] = useState({ title: '', details: '', recurring: false, frequency: 'Every Day' });

// Create-modal state
const [createPopup, setCreatePopup] = useState({ show: false, title: '', details: '', recurring: false, frequency: 'Every Day' });

function createTask(e) {
    // keep compat with previous form-based call, but prefer modal flow
    e && e.preventDefault();
    const source = e && e._isCreateModal ? createPopup : newTask;
    if (!source.title || !source.title.trim()) return;
    // create via service
    fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: source.title.trim(), details: (source.details||'').trim(), recurring: !!source.recurring, frequency: source.recurring ? (source.frequency || 'Every Day') : '' })
    }).then(async res => {
        if (!res.ok) throw new Error(await res.text());
        const created = await res.json();
        const task = { ...created, last: created.completedDates && created.completedDates.length ? created.completedDates[created.completedDates.length-1] : 'Never' };
        if (task.recurring) setRecurringTasks(t => [task, ...t]); else setNormalTasks(t => [task, ...t]);
    }).catch(err => {
        console.error('Create failed', err);
        alert('Failed to create task');
    });
    setNewTask({ title: '', details: '', recurring: false, frequency: 'Every Day' });
    setCreatePopup({ show: false, title: '', details: '', recurring: false, frequency: 'Every Day' });
}

function removeTask(listName, index) {
    const sourceList = listName === 'recurring' ? recurringTasks : normalTasks;
    const item = sourceList[index];
    if (!item) return;
    fetch(`${API_BASE}/api/tasks/${item.id}`, { method: 'DELETE', credentials: 'include' }).then(async res => {
        if (!res.ok) throw new Error(await res.text());
        if (listName === 'recurring') setRecurringTasks(t => t.filter((_, i) => i !== index)); else setNormalTasks(t => t.filter((_, i) => i !== index));
    }).catch(err => {
        console.error('Delete failed', err);
        alert('Failed to delete task');
    });
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
    const [editPopup, setEditPopup] = useState({ show: false, id: null, title: '', details: '', recurring: false, list: null, frequency: 'Every Day' });

    function openEdit(list, id) {
        const sourceList = list === 'recurring' ? recurringTasks : normalTasks;
        const item = sourceList.find(t => t.id === id);
        if (!item) return alert('Task not found');
        setEditPopup({ show: true, id: item.id, title: item.title, details: item.details || '', recurring: list === 'recurring', list, completedDates: Array.isArray(item.completedDates) ? [...item.completedDates] : [], frequency: item.frequency || 'Every Day' });
    }

    function saveEdit(e) {
        e && e.preventDefault();
        if (!editPopup.id) return;
        const updatedFields = { title: editPopup.title.trim(), details: editPopup.details.trim(), completedDates: Array.isArray(editPopup.completedDates) ? [...editPopup.completedDates] : [], frequency: editPopup.recurring ? (editPopup.frequency || 'Every Day') : '' };
        fetch(`${API_BASE}/api/tasks/${editPopup.id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedFields)
        }).then(async res => {
            if (!res.ok) throw new Error(await res.text());
            const updated = await res.json();
            if (editPopup.list === 'recurring') {
                setRecurringTasks(ts => ts.map(t => t.id === editPopup.id ? { ...t, ...updated } : t));
            } else {
                setNormalTasks(ts => ts.map(t => t.id === editPopup.id ? { ...t, ...updated } : t));
            }
        }).catch(err => {
            console.error('Save failed', err);
            alert('Failed to save');
        });
        setEditPopup({ show: false, id: null, title: '', details: '', recurring: false, list: null, completedDates: [], frequency: 'Every Day' });
    }

// Record completion when a checkbox is checked. We'll append today's date and update last.
function toggleComplete(listName, id, checked) {
    if (!checked) return; // only record on check
    // build a local date string YYYY-MM-DD (avoid toISOString which uses UTC and can shift the day)
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    // update via backend
    const list = listName === 'recurring' ? recurringTasks : normalTasks;
    const item = list.find(t => t.id === id);
    if (!item) return;
    const updatedCompleted = Array.isArray(item.completedDates) ? [...item.completedDates, dateStr] : [dateStr];
    fetch(`${API_BASE}/api/tasks/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedDates: updatedCompleted })
    }).then(async res => {
        if (!res.ok) throw new Error(await res.text());
        const updated = await res.json();
        if (listName === 'recurring') {
            setRecurringTasks(ts => ts.map(t => t.id === id ? { ...t, completedDates: updated.completedDates || updatedCompleted, last: dateStr } : t));
        } else {
            setNormalTasks(ts => ts.map(t => t.id === id ? { ...t, completedDates: updated.completedDates || updatedCompleted, last: dateStr } : t));
        }
    }).catch(err => {
        console.error('Complete update failed', err);
        alert('Failed to record completion');
    });
    // show a quick confirmation toast
    setToast({ show: true, message: 'Task completed! (' + formatDate(dateStr) + ')' });
    setTimeout(() => setToast({ show: false, message: '' }), 2000);
}

// Handler that uses the native input so the checked state is visible, then programmatically unchecks it
function handleCheckboxChange(listName, id, e) {
    const checked = e.target.checked;
    toggleComplete(listName, id, checked);
    if (checked) {
        // leave visually checked briefly, then uncheck
        setTimeout(() => {
            try { e.target.checked = false; } catch (err) { /* ignore */ }
        }, 1500);
    }
}

// Toast state for visual confirmation
const [toast, setToast] = useState({ show: false, message: '' });

// small friendly date formatter
function formatDate(isoDate) {
    try {
        // If isoDate is in YYYY-MM-DD format, parse it as a local date to avoid timezone shifts
        if (typeof isoDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
            const [y, m, dPart] = isoDate.split('-').map(s => parseInt(s, 10));
            const d = new Date(y, m - 1, dPart);
            return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        }
        const d = new Date(isoDate);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) { return isoDate; }
}

// Load tasks from backend on mount
useEffect(() => {
    // If there's no logged-in user, clear the lists and do nothing.
    if (!user || !user.id) {
        setRecurringTasks([]);
        setNormalTasks([]);
        return;
    }

    fetch(`${API_BASE}/api/tasks`, { credentials: 'include' }).then(async res => {
        if (!res.ok) throw new Error('Failed to load tasks for user');
        const all = await res.json();
        const recurring = all.filter(t => t.recurring);
        const normal = all.filter(t => !t.recurring);
        setRecurringTasks(recurring.map(t => ({ ...t, last: (t.completedDates && t.completedDates.length) ? t.completedDates[t.completedDates.length - 1] : 'Never' })));
        setNormalTasks(normal.map(t => ({ ...t, last: (t.completedDates && t.completedDates.length) ? t.completedDates[t.completedDates.length - 1] : 'Never' })));
    }).catch(err => {
        console.error('Load tasks failed', err);
    });
}, [user]);

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
                                <input className="form-check-input" type="checkbox" id={`recurring${i}`} onChange={e => handleCheckboxChange('recurring', t.id, e)} />
                                <div className="task-details">
                                    <label htmlFor={`recurring${i}`}>{t.title}</label>
                                    <p><i>Last completed: {t.last}</i>{t.frequency ? <span style={{ marginLeft: 8 }}>• {t.frequency}</span> : null}</p>
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
                            <input className="form-check-input" type="checkbox" id={`all${i}`} onChange={e => handleCheckboxChange('normal', t.id, e)} />
                            <div className="task-details">
                                <label htmlFor={`all${i}`}>{t.title}</label>
                                <p><i>Last completed: {t.last}</i>{t.frequency ? <span style={{ marginLeft: 8 }}>• {t.frequency}</span> : null}</p>
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
                        {createPopup.recurring && (
                            <label style={{ display: 'block', marginTop: 8 }}>
                                Frequency
                                <select value={createPopup.frequency} onChange={e => setCreatePopup(cp => ({ ...cp, frequency: e.target.value }))} style={{ marginLeft: 8 }}>
                                    <option>Every Day</option>
                                    <option>Every Week</option>
                                    <option>Every Month</option>
                                    <option>Every Year</option>
                                </select>
                            </label>
                        )}
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
                        <div style={{ marginTop: 8 }}>
                            <label><input type="checkbox" checked={editPopup.recurring} onChange={e => setEditPopup(ep => ({ ...ep, recurring: e.target.checked }))} /> Recurring?</label>
                            {editPopup.recurring && (
                                <select value={editPopup.frequency} onChange={e => setEditPopup(ep => ({ ...ep, frequency: e.target.value }))} style={{ marginLeft: 8 }}>
                                    <option>Every Day</option>
                                    <option>Every Week</option>
                                    <option>Every Month</option>
                                    <option>Every Year</option>
                                </select>
                            )}
                        </div>
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