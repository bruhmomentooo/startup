import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';

import { BrowserRouter, NavLink, Route, Routes, Navigate } from 'react-router-dom';
import { Home } from './home/home';
import { Login } from './login/login';
import { About } from './about/about';
// Notifications moved from navbar into Home page sidebar

export default function App() {
    // API base: use relative paths so Vite dev server proxy (configured in vite.config.js)
    // forwards `/api` to the backend during development. This keeps requests same-origin
    // so cookies/sessions work in the browser. In production the frontend and backend
    // are served from the same origin so relative paths are correct as well.
    const API_BASE = '';

    // current logged-in user object { id, username }. persisted to localStorage as 'currentUser'
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch (e) { return null; }
    });

    const [navOpen, setNavOpen] = useState(false);

    const toggleNav = () => setNavOpen(o => !o);
    const closeNav = () => setNavOpen(false);

    // persist current user (object)
    useEffect(() => {
        try { if (user) localStorage.setItem('currentUser', JSON.stringify(user)); else localStorage.removeItem('currentUser'); } catch (e) {}
    }, [user]);

    // Async auth handler: call backend users API for register/login
    async function handleAuth(email, password, create = false) {
        if (!email) return { success: false, message: 'Email required' };
        try {
            if (create) {
                const res = await fetch(`${API_BASE}/api/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ username: email, password })
                });
                if (!res.ok) return { success: false, message: await res.text() };
                const data = await res.json();
                setUser({ id: data.id, username: data.username });
                return { success: true };
            } else {
                const res = await fetch(`${API_BASE}/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ username: email, password })
                });
                if (!res.ok) return { success: false, message: await res.text() };
                const data = await res.json();
                setUser({ id: data.id, username: data.username });
                return { success: true };
            }
        } catch (err) {
            console.error('Auth error', err);
            return { success: false, message: err && err.message ? err.message : 'Network error' };
        }
    }

    function handleLogout() {
        // call logout endpoint to destroy session
        try {
            fetch(`${API_BASE}/api/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
        } catch (e) {}
        setUser(null);
    }

    // Sync with server session on mount
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/api/me`, { credentials: 'include' });
                if (!mounted) return;
                if (res.ok) {
                    const data = await res.json();
                    if (data) setUser({ id: data.id, username: data.username });
                }
            } catch (e) { /* ignore */ }
        })();
        return () => { mounted = false; };
    }, []);

    return (
        <BrowserRouter>
            <div>
                <header className="container-fluid">
                    <nav className="navbar navbar-expand-lg custom-navbar">
                        <div className="container-fluid">
                            <a className="navbar-brand" href="#">
                                <img alt="tasktrackerappicon" src="tasktrackerappicon.png" width="40" height="40" />
                                Task Tracker App
                            </a>
                            <button
                                className="navbar-toggler"
                                type="button"
                                aria-controls="navbarNav"
                                aria-expanded={navOpen}
                                aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
                                onClick={toggleNav}
                            >
                                <span className="navbar-toggler-icon">{navOpen ? '\u2715' : '\u2630'}</span>
                            </button>

                            <div className={`collapse navbar-collapse ${navOpen ? 'show' : ''}`} id="navbarNav">
                                    <ul className="navbar-nav ms-auto" onClick={closeNav}>
                                        {/* Notifications moved into Home sidebar to appear under Create Task */}
                                    <li className="nav-item">
                                        {user && user.username ? (
                                            <NavLink className="nav-link" to="/home">Home</NavLink>
                                        ) : (
                                            <span className="nav-link disabled" aria-disabled="true">Home</span>
                                        )}
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className="nav-link" to="/about">About</NavLink>
                                    </li>
                                    <li className="nav-item">
                                        {user && user.username ? (
                                            <NavLink className="nav-link" to="/" onClick={() => { handleLogout(); }}>
                                                Logout
                                            </NavLink>
                                        ) : (
                                            <NavLink className="nav-link" to="/">Login</NavLink>
                                        )}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </nav>
                </header>

                <Routes>
                    <Route path="/" element={<Login onAuthChange={handleAuth} />} exact />
                    <Route path="/home" element={user ? <Home user={user} /> : <Navigate to="/" replace />} />
                    <Route path="/about" element={<About userName={user ? user.username : ''} />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>

                <footer>
                    <div className="footer-content">
                        <span className="text-reset">Author Name: Luke Olsen</span>
                        <br />
                        <a href="https://github.com/bruhmomentooo/startup.git">GitHub</a>
                    </div>
                </footer>
            </div>
        </BrowserRouter>
    );
}

function NotFound() {
  return <main className="container-fluid bg-secondary text-center">404: Return to sender. Address unknown.</main>;
}