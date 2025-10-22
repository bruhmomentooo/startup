import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';

import { BrowserRouter, NavLink, Route, Routes, Navigate } from 'react-router-dom';
import { Home } from './home/home';
import { Login } from './login/login';
import { About } from './about/about';

export default function App() {
    // current logged-in user (simple string email). persisted to localStorage as 'currentUser'
    const [userName, setUserName] = useState(() => {
        try {
            return localStorage.getItem('currentUser') || '';
        } catch (e) { return ''; }
    });

    const [navOpen, setNavOpen] = useState(false);

    const toggleNav = () => setNavOpen(o => !o);
    const closeNav = () => setNavOpen(false);

    // persist current user
    useEffect(() => {
        try { if (userName) localStorage.setItem('currentUser', userName); else localStorage.removeItem('currentUser'); } catch (e) {}
    }, [userName]);

    // Simple auth handler: login or create account. We store a minimal users map in localStorage under 'users'
    function handleAuth(email, password, create = false) {
        if (!email) return { success: false, message: 'Email required' };
        // load users
        let users = {};
        try { users = JSON.parse(localStorage.getItem('users') || '{}'); } catch (e) { users = {}; }
        if (create) {
            if (users[email]) return { success: false, message: 'Account already exists' };
            users[email] = { password };
            try { localStorage.setItem('users', JSON.stringify(users)); } catch (e) {}
            setUserName(email);
            return { success: true };
        }
        // login
        if (!users[email]) return { success: false, message: 'No account found' };
        if (users[email].password !== password) return { success: false, message: 'Invalid password' };
        setUserName(email);
        return { success: true };
    }

    function handleLogout() {
        setUserName('');
    }

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
                                    <li className="nav-item">
                                        {userName ? (
                                            <NavLink className="nav-link" to="/home">Home</NavLink>
                                        ) : (
                                            <span className="nav-link disabled" aria-disabled="true">Home</span>
                                        )}
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className="nav-link" to="/about">About</NavLink>
                                    </li>
                                    <li className="nav-item">
                                        {userName ? (
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
                    <Route path="/home" element={userName ? <Home userName={userName} /> : <Navigate to="/" replace />} />
                    <Route path="/about" element={<About userName={userName} />} />
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