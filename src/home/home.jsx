import React, { useState } from 'react';
import './home-style.css';
import './tasks_modal.css';

export function Home() {
  const [popup, setPopup] = useState({ show: false, title: '', details: '' });

  function viewTask(title, details) {
    setPopup({ show: true, title, details });
  }

  function editTask(title) {
    alert('Edit screen for: ' + title);
    // In future: open a form modal instead of alert
  }

  function closePopup() {
    setPopup({ show: false, title: '', details: '' });
  }

  return (
    <main>
        <div className="content">
            {/* Sidebar */}
            <div id="siteSidebar" className="sidebar">
                <button type="get">Create</button>
                <button type="get">Select/Edit</button>
                <button type="get">Add to Google Calendar</button>
                <button type="get">Notifications</button>
            </div>
            {/* Recurring Task List */}
            <div className="task_container" id="recurringTasks">
                <h3>Recurring Tasks</h3>
                <div className="task">
                        <input className="form-check-input" type="checkbox" id="recurring1" />
                        <div className="task-details">
                            <label htmlFor="recurring1">Task 1</label>
                            <p>Description for Task 1</p>
                            <p><i>Last completed: 08-14-2023</i></p>
                        </div>
                        <button type="button" onClick={() => viewTask('Task 1', 'Details about Task 1')}>View</button>
                        <button type="button" onClick={() => editTask('Task 1')}>Edit</button>
                </div>
                <div className="task">
                        <input className="form-check-input" type="checkbox" id="recurring2" />
                        <div className="task-details">
                            <label htmlFor="recurring2">Task 2</label>
                            <p>Description for Task 2</p>
                            <p><i>Last completed: 9-30-2024</i></p>
                        </div>
                        <button type="button" onClick={() => viewTask('Task 2', 'Details about Task 2')}>View</button>
                        <button type="button" onClick={() => editTask('Task 2')}>Edit</button>
                </div>
                <div className="task">
                        <input className="form-check-input" type="checkbox" id="recurring3" />
                        <div className="task-details">
                            <label htmlFor="recurring3">Task 3</label>
                            <p>Description for Task 3</p>
                            <p><i>Last completed: 02-01-2025</i></p>
                        </div>
                        <button type="button" onClick={() => viewTask('Task 3', 'Details about Task 3')}>View</button>
                        <button type="button" onClick={() => editTask('Task 3')}>Edit</button>
                </div>
            </div>

            <div className="task_container" id="allTasks">
                <h3>All Tasks</h3>
                <div className="task">
                    <input className="form-check-input" type="checkbox" id="all1" />
                    <div className="task-details">
                        <label htmlFor="all1">Task 1</label>
                        <p>Description for Task 1</p>
                        <p><i>Last completed: 08-14-2023</i></p>
                    </div>
                    <button type="button" onClick={() => viewTask('Task 1', 'Details about Task 1')}>View</button>
                    <button type="button" onClick={() => editTask('Task 1')}>Edit</button>
                </div>
                <div className="task">
                    <input className="form-check-input" type="checkbox" id="all2" />
                    <div className="task-details">
                        <label htmlFor="all2">Task 2</label>
                        <p>Description for Task 2</p>
                        <p><i>Last completed: 9-30-2024</i></p>
                    </div>
                    <button type="button" onClick={() => viewTask('Task 2', 'Details about Task 2')}>View</button>
                    <button type="button" onClick={() => editTask('Task 2')}>Edit</button>
                </div>
                <div className="task">
                    <input className="form-check-input" type="checkbox" id="all3" />
                    <div className="task-details">
                        <label htmlFor="all3">Task 3</label>
                        <p>Description for Task 3</p>
                        <p><i>Last completed: 02-01-2025</i></p>
                    </div>
                    <button type="button" onClick={() => viewTask('Task 3', 'Details about Task 3')}>View</button>
                    <button type="button" onClick={() => editTask('Task 3')}>Edit</button>
                </div>
            </div>
        </div>
        {/* Popup Code */}
        <div id="popup" className="popup" style={{ display: popup.show ? 'block' : 'none' }} onClick={(e) => { if (e.target.id === 'popup') closePopup(); }}>
            <div className="popup-content">
                <span className="close" onClick={closePopup}>&times;</span>
                <h2 id="popup-title">{popup.title}</h2>
                <div id="popup-details">{popup.details}</div>
            </div>
        </div>
    </main>
  );
}