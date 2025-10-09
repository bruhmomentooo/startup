import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';

export default function App() {
  return (
    <div>
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
                                <a className="nav-link" href="home.html">Home</a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" href="tasks.html">All Tasks</a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" href="index.html">Logout</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        </header>

        <main>App components go here</main>

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