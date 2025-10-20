import React from 'react';

export function Login({ userName, authState, onAuthChange }) {
    return (
        <main className="login-main">
            <div className="welcome_container">
                <h1>Welcome!</h1>
                <p style={{textAlign: "center"}}>Please log in or create an account to begin your task management.</p>
                <form method="get" action="home.html">
                    <div>
                        <label htmlFor="email"><b>Email:</b></label>
                        <input type="text" id="email" name="email" required placeholder="example@gmail.com" />
                    </div>
                    <div>
                        <p><label htmlFor="password"><b>Password:</b></label>
                        <input type="password" id="password" name="password" required placeholder="password" /></p>
                    </div>
                    <div>
                        <p><button type="submit">Login</button></p>
                        <p><button type="submit">Create Account</button></p>
                    </div>
                </form>
            </div>
        </main>
  );
}