import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Login({ onAuthChange }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    async function doAuth(create = false) {
        setError('');
        if (!onAuthChange) return setError('No auth handler');
        try {
            const res = await onAuthChange(email.trim(), password, create);
            if (res && res.success) {
                navigate('/home');
            } else {
                setError(res && res.message ? res.message : 'Authentication failed');
            }
        } catch (err) {
            setError(err && err.message ? err.message : 'Authentication error');
        }
    }

    return (
        <main className="login-main">
            <div className="welcome_container">
                <h1>Welcome!</h1>
                <p style={{textAlign: "center"}}>Please log in or create an account to begin your task management.</p>
                <form onSubmit={e => { e.preventDefault(); doAuth(false); }}>
                    <div>
                        <label htmlFor="email"><b>Email:</b></label>
                        <input type="text" id="email" name="email" required placeholder="example@gmail.com" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div>
                        <p><label htmlFor="password"><b>Password:</b></label>
                        <input type="password" id="password" name="password" required placeholder="password" value={password} onChange={e => setPassword(e.target.value)} /></p>
                    </div>
                    {error && <div style={{ color: 'darkred', marginBottom: 8 }}>{error}</div>}
                    <div>
                        <p><button type="submit">Login</button></p>
                        <p><button type="button" onClick={() => doAuth(true)}>Create Account</button></p>
                    </div>
                </form>
            </div>
        </main>
  );
}