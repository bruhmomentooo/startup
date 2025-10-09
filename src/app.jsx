import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';

import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { Home } from './home/home';
import { Login } from './login/login';
import { Task } from './tasks/tasks';

export default function App() {
  return (
    <div>
        <BrowserRouter>
            <header className="container-fluid">
                <nav className="navbar navbar-expand-lg custom-navbar">
                    <div className="container-fluid">
                        <a className="navbar-brand" href="#">
                            <img alt="tasktrackerappicon" src="tasktrackerappicon.png" width="40" height="40" />
                            Task Tracker App
                        </a>
                        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                            <span className="navbar-toggler-icon"></span>
                        </button>
                        <div className="collapse navbar-collapse" id="navbarNav">
                            <ul className="navbar-nav ms-auto">
                                <li className="nav-item">
                                    <NavLink className="nav-link" to="/home">Home</NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink className="nav-link" to="/tasks">All Tasks</NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink className="nav-link" to="/login">Logout</NavLink>
                                </li>
                            </ul>
                        </div>
                    </div>
                </nav>
            </header>
        </BrowserRouter>

        <Routes>
            <Route path="/home" element={<Home />} />
            <Route path="/tasks" element={<Task />} />
            <Route path="/login" element={<Login />} />
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
  );
}

function NotFound() {
  return <main className="container-fluid bg-secondary text-center">404: Return to sender. Address unknown.</main>;
}