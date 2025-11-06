import React, { useEffect, useState } from 'react';

export function About() {
    const [bgUrl, setBgUrl] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/photo-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: 'workspace', perPage: 1 }) });
                if (!res.ok) return;
                const data = await res.json();
                if (cancelled) return;
                const photo = data && data.results && data.results[0];
                if (photo && photo.urls && photo.urls.regular) setBgUrl(photo.urls.regular);
            } catch (e) { /* ignore */ }
        })();
        return () => { cancelled = true; };
    }, []);

    // Apply full-bleed background to the document body when bgUrl is available
    useEffect(() => {
        if (!bgUrl) return;
        const prev = {
            backgroundImage: document.body.style.backgroundImage,
            backgroundSize: document.body.style.backgroundSize,
            backgroundPosition: document.body.style.backgroundPosition,
            backgroundRepeat: document.body.style.backgroundRepeat,
            backgroundAttachment: document.body.style.backgroundAttachment
        };
        const overlay = 'linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35))';
        document.body.style.backgroundImage = `${overlay}, url(${bgUrl})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed';
        // ensure body occupies full viewport
        document.documentElement.style.minHeight = '100%';
        document.body.style.minHeight = '100vh';
        return () => {
            document.body.style.backgroundImage = prev.backgroundImage || '';
            document.body.style.backgroundSize = prev.backgroundSize || '';
            document.body.style.backgroundPosition = prev.backgroundPosition || '';
            document.body.style.backgroundRepeat = prev.backgroundRepeat || '';
            document.body.style.backgroundAttachment = prev.backgroundAttachment || '';
        };
    }, [bgUrl]);

    const mainStyle = { padding: 20 };
    const containerStyle = { maxWidth: 900, margin: '0 auto', background: 'rgba(255,255,255,0.92)', borderRadius: 8, padding: 28 };

    return (
        <main style={mainStyle}>
            <div className="task_container" style={containerStyle}>
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
export default About;