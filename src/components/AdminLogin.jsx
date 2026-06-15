import React, { useState } from 'react';
import { db, isMockMode } from '../supabaseClient';

export default function AdminLogin({ onLoginSuccess, addToast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const { data, error } = await db.login(email, password);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      addToast(error.message, 'error');
    } else {
      addToast('Logged in successfully!', 'success');
      onLoginSuccess(data.session);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('admin@nayepankh.org');
    setPassword('admin123');
    setLoading(true);
    setErrorMsg('');

    // Short timeout to let the user see the inputs filling in (micro-animation helper)
    setTimeout(async () => {
      const { data, error } = await db.login('admin@nayepankh.org', 'admin123');
      setLoading(false);
      if (error) {
        setErrorMsg(error.message);
        addToast(error.message, 'error');
      } else {
        addToast('Logged in as administrator!', 'success');
        onLoginSuccess(data.session);
      }
    }, 600);
  };

  return (
    <div className="container" style={{ maxWidth: '440px', marginTop: '40px' }}>
      <div className="card" style={{ animation: 'float-up 0.4s ease-out' }}>
        <div className="auth-header">
          <svg className="brand-icon auth-logo" viewBox="0 0 24 24" fill="currentColor" style={{ margin: '0 auto 12px' }}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>Organizer Portal</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            NayePankh Foundation Admin Access
          </p>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px', textAlign: 'left' }}>
            <strong>Login Failed:</strong> {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} noValidate>
          <div className="form-group">
            <label htmlFor="admin-email">Administrator Email</label>
            <input
              type="email"
              id="admin-email"
              className="form-control"
              placeholder="e.g. organizer@nayepankh.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label htmlFor="admin-password">Password</label>
            <input
              type="password"
              id="admin-password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Secure Admin Login'}
          </button>
        </form>

        <div style={{ marginTop: '20px', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          <strong>Notice:</strong> This area is restricted to NayePankh organizers. 
          Volunteers register via the public form and do not require account access.
        </div>

        {isMockMode && (
          <>
            <div className="auth-divider">DEMO OPTIONS</div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                You are running in <strong>Portfolio Demo Mode</strong>. Use the quick-login below to instantly review the dashboard with seeded data.
              </p>
              <button
                type="button"
                className="btn btn-outline"
                style={{ width: '100%', borderStyle: 'dashed', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                onClick={handleDemoLogin}
                disabled={loading}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/></svg>
                Demo Auto-Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
