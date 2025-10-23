import React from 'react';

export function About() {
    return (
        <main style={{ padding: 20 }}>
            <div className="task_container" style={{ maxWidth: 900, margin: '0 auto' }}>
                <h1>About Task Tracker</h1>

                <p style={{ lineHeight: 1.6 }}>
                    A task tracker helps you turn intention into action. By breaking work and routines into small,
                    trackable items, a task tracker makes it easy to remember what needs to be done, measure
                    progress, and build consistent habits over time.
                </p>

                <h2>Why use a Task Tracker?</h2>
                <ul>
                    <li><strong>Reduce cognitive load:</strong> Keep tasks out of your head and in one place so you can focus on doing, not remembering.</li>
                    <li><strong>Increase consistency:</strong> Recurring tasks and reminders make it easier to build habits like daily reviews, exercise, or maintenance.</li>
                    <li><strong>Prioritize effectively:</strong> Seeing all tasks together helps you choose what matters most each day.</li>
                    <li><strong>Measure progress:</strong> Recording completions gives a reliable record of what you've finished and when.</li>
                </ul>

                <h2>Key features of this app</h2>
                <ol>
                    <li>Quickly create one-off or recurring tasks.</li>
                    <li>Choose a recurrence frequency (day, week, month, year) for repeating work.</li>
                    <li>Mark tasks complete to record the date and track history.</li>
                    <li>Edit tasks and adjust details without losing past completion records.</li>
                </ol>

                <h2>Tips for using the tracker</h2>
                <ul>
                    <li>Keep task titles short and action-oriented ("Pay bills", "Water plants").</li>
                    <li>Use the details field for quick context (login links, estimated time, or subtasks).</li>
                    <li>Prefer small tasks you can finish in one sitting — completing tasks builds momentum.</li>
                    <li>Use recurring tasks for maintenance and habits rather than one-off reminders.</li>
                </ul>

                <p style={{ marginTop: 16 }}>
                    If you have ideas for additional features (notification scheduling, calendar sync, tags or
                    filters) please add them — the goal is to keep the app useful and lightweight.
                </p>

                <p style={{ fontStyle: 'italic', marginTop: 8 }}>Happy tracking — small steps, big results.</p>
            </div>
        </main>
    );
}