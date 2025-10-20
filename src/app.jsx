import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';

import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { Home } from './home/home';
import { Login } from './login/login';
import { Tasks } from './tasks/tasks';

export default function App() {
    const [navOpen, setNavOpen] = useState(false);

    const toggleNav = () => setNavOpen(o => !o);
    const closeNav = () => setNavOpen(false);

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
                                        <NavLink className="nav-link" to="/home">Home</NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className="nav-link" to="/tasks">All Tasks</NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink className="nav-link" to="/">Logout</NavLink>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </nav>
                </header>

                <Routes>
                    <Route path="/"
                    element={
                        <Login
                            /*userName={userName}
                            authState={authState}
                            onAuthChange={(userName, authState) => {
                                setAuthState(authState);
                                setUserName(userName);
                            }}*/
                        />
                    }
                    exact
                    />
                    <Route path="/home" element={<Home />} />
                    <Route path="/tasks" element={<Tasks />} />
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