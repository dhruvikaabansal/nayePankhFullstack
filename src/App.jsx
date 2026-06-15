import React, { useState, useEffect } from 'react';
import { db, isMockMode } from './supabaseClient';
import PublicForm from './components/PublicForm';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import Reports from './components/Reports';

export default function App() {
  const [view, setView] = useState('public'); // public | admin-login | admin-dashboard | admin-reports
  const [session, setSession] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Check auth session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await db.getSession();
      if (data && data.session) {
        setSession(data.session);
      }
    };
    checkSession();

    // Listen to real-time auth changes if Supabase is connected
    let subscription = null;
    if (!isMockMode) {
      const res = db.onAuthStateChange((_event, session) => {
        setSession(session);
      });
      if (res && res.data) {
        subscription = res.data.subscription;
      }
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);


  // Global Toast utility
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove toast
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleLogout = async () => {
    const { error } = await db.logout();
    if (error) {
      addToast(error.message, 'error');
    } else {
      setSession(null);
      setView('public');
      addToast('Logged out successfully.', 'success');
    }
  };

  // Guard routing on active views
  const handleNav = (targetView) => {
    if ((targetView === 'admin-dashboard' || targetView === 'admin-reports') && !session) {
      setView('admin-login');
    } else {
      setView(targetView);
    }
  };

  return (
    <div>
      {/* 1. Supabase vs Mock Mode Banner */}
      <div className="mode-banner">
        <div>
          {isMockMode ? (
            <span>
              <span className="mode-badge">Portfolio Demo Mode</span> Simulating database in LocalStorage. Configure <code>.env</code> file for cloud database.
            </span>
          ) : (
            <span>
              <span className="mode-badge supabase">Supabase Cloud Mode</span> Connected to live database at <code>{import.meta.env.VITE_SUPABASE_URL}</code>.
            </span>
          )}
        </div>
        <div>
          <span style={{ fontSize: '0.8rem', opacity: 0.85, marginRight: '8px' }}>
            NayePankh Foundation (12A/80G Registered NGO)
          </span>
        </div>
      </div>

      {/* 2. Global Navigation */}
      <header className="app-header">
        <div className="brand" onClick={() => setView('public')}>
          <div className="brand-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l8 2.5z" />
            </svg>
          </div>
          <div className="brand-name">
            NayePankh
            <span className="brand-subtitle">Volunteer Hub</span>
          </div>
        </div>

        <nav className="nav-links">
          <button 
            className={`nav-btn ${view === 'public' ? 'active' : ''}`}
            onClick={() => setView('public')}
          >
            Become a Volunteer
          </button>

          {session ? (
            <>
              <button 
                className={`nav-btn admin-btn ${view === 'admin-dashboard' ? 'active' : ''}`}
                onClick={() => handleNav('admin-dashboard')}
              >
                Dashboard
              </button>
              <button 
                className={`nav-btn admin-btn ${view === 'admin-reports' ? 'active' : ''}`}
                onClick={() => handleNav('admin-reports')}
              >
                Reports
              </button>
              <button 
                className="nav-btn logout-btn"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </>
          ) : (
            <button 
              className={`nav-btn admin-btn ${view === 'admin-login' ? 'active' : ''}`}
              onClick={() => handleNav('admin-dashboard')} // Will redirect to login since session is null
            >
              Admin Portal
            </button>
          )}
        </nav>
      </header>

      {/* 3. Surface Router */}
      <main>
        {view === 'public' && (
          <PublicForm addToast={addToast} />
        )}
        
        {view === 'admin-login' && (
          <AdminLogin 
            onLoginSuccess={(sessionData) => {
              setSession(sessionData);
              setView('admin-dashboard');
            }} 
            addToast={addToast} 
          />
        )}

        {view === 'admin-dashboard' && session && (
          <AdminDashboard addToast={addToast} />
        )}

        {view === 'admin-reports' && session && (
          <Reports addToast={addToast} />
        )}
      </main>

      {/* Footer Motif */}
      <footer style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <p>© {new Date().getFullYear()} NayePankh Foundation. All Rights Reserved. Giving Wings to Underprivileged Lives.</p>
        <p style={{ fontSize: '0.75rem', marginTop: '6px', color: 'var(--text-light)' }}>
          Registered Section 8 NGO • 12A/80G Approved
        </p>
      </footer>

      {/* 4. Global Toast Notifications Container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`toast ${toast.type}`}
            onClick={() => removeToast(toast.id)}
            style={{ cursor: 'pointer' }}
          >
            <div className="toast-icon">
              {toast.type === 'success' ? (
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
              )}
            </div>
            <div className="toast-message">{toast.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
