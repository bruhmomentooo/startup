import React from 'react';
import './home-style.css';

export function Home() {
  return (
    <main>
      <div class="content">
                <div id="siteSidebar" class="sidebar">
                    <button type="get">Create</button>
                    <button type="get">Select/Edit</button>
                    <button type="get">Add to Google Calendar</button>
                    <button type="get">Notifications</button>

                </div>

                <div class="task_container" id="recurringTasks">
                    <h3>Recurring Tasks</h3>
                    <div class="task">
                            <input class="form-check-input" type="checkbox" id="recurring1" />
                            <div class="task-details">
                                <label for="recurring1">Task 1</label>
                                <p>Description for Task 1</p>
                                <p><i>Last completed: 08-14-2023</i></p>
                            </div>
                            <button type="button" onclick="viewTask('Task 1', 'Details about Task 1')">View</button>
                            <button type="button" onclick="editTask('Task 1')">Edit</button>
                    </div>
                    <div class="task">
                            <input class="form-check-input" type="checkbox" id="recurring2" />
                            <div class="task-details">
                                <label for="recurring2">Task 2</label>
                                <p>Description for Task 2</p>
                                <p><i>Last completed: 9-30-2024</i></p>
                            </div>
                            <button type="button" onclick="viewTask('Task 2', 'Details about Task 2')">View</button>
                            <button type="button" onclick="editTask('Task 2')">Edit</button>
                    </div>
                    <div class="task">
                            <input class="form-check-input" type="checkbox" id="recurring3" />
                            <div class="task-details">
                                <label for="recurring3">Task 3</label>
                                <p>Description for Task 3</p>
                                <p><i>Last completed: 02-01-2025</i></p>
                            </div>
                            <button type="button" onclick="viewTask('Task 3', 'Details about Task 3')">View</button>
                            <button type="button" onclick="editTask('Task 3')">Edit</button>
                    </div>
                </div>
                
                <div class="task_container" id="allTasks">
                    <h3>All Tasks</h3>
                    <div class="task">
                        <input class="form-check-input" type="checkbox" id="all1" />
                        <div class="task-details">
                            <label for="all1">Task 1</label>
                            <p>Description for Task 1</p>
                            <p><i>Last completed: 08-14-2023</i></p>
                        </div>
                        <button type="button" onclick="viewTask('Task 1', 'Details about Task 1')">View</button>
                        <button type="button" onclick="editTask('Task 1')">Edit</button>
                    </div>
                    <div class="task">
                        <input class="form-check-input" type="checkbox" id="all2" />
                        <div class="task-details">
                            <label for="all2">Task 2</label>
                            <p>Description for Task 2</p>
                            <p><i>Last completed: 9-30-2024</i></p>
                        </div>
                        <button type="button" onclick="viewTask('Task 2', 'Details about Task 2')">View</button>
                        <button type="button" onclick="editTask('Task 2')">Edit</button>
                    </div>
                    <div class="task">
                        <input class="form-check-input" type="checkbox" id="all3" />
                        <div class="task-details">
                            <label for="all3">Task 3</label>
                            <p>Description for Task 3</p>
                            <p><i>Last completed: 02-01-2025</i></p>
                        </div>
                        <button type="button" onclick="viewTask('Task 3', 'Details about Task 3')">View</button>
                        <button type="button" onclick="editTask('Task 3')">Edit</button>
                    </div>
                </div>
            </div>
    </main>
  );
}