import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { MessageSquare, Sun, Moon } from 'lucide-react';
import ChatInterface from './pages/ChatInterface';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import ProfileDropdown from './components/ProfileDropdown';
import { useAuth } from './context/AuthContext';
import { useThemeContext } from './context/ThemeContext';

export default function App() {
  const location = useLocation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useThemeContext();
  const isSignIn = location.pathname === '/signin';
  const isSignUp = location.pathname === '/signup';
  const hideNav = isSignIn || isSignUp;

  const getNavClass = (path) => {
    const isActive = location.pathname === path || (path === '/chat' && location.pathname === '/');
    return `nav-link ${isActive ? 'active' : ''}`;
  };

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      {!hideNav && (
        <nav className="top-nav">
          <div className="nav-brand">
            <span className="brand-text">AI Studio</span>
          </div>
          <div className="nav-links">
            <Link to="/chat" className={getNavClass('/chat')}>
              <MessageSquare size={18} />
              <span>Chat Interface</span>
            </Link>

            {!user && (
              <Link to="/signin" className={getNavClass('/signin')}>
                <span>Sign In</span>
              </Link>
            )}
          </div>
          
          <div className="nav-actions">
            <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            {user && <ProfileDropdown />}
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={
            <ProtectedRoute>
              <ChatInterface />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </main>

      <style>{`
        .app-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background-color: var(--bg-app);
          color: var(--text-main);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .top-nav {
          display: flex;
          align-items: center;
          padding: 0 var(--spacing-6, 24px);
          height: 64px;
          border-bottom: 1px solid var(--border-color);
          background-color: var(--bg-app);
        }
        .nav-brand {
          display: flex;
          align-items: center;
          margin-right: 48px;
        }
        .brand-text {
          font-size: 1.15rem;
          font-weight: 600;
          letter-spacing: -0.01em;
        }
        .nav-links {
          display: flex;
          gap: 8px;
          height: 100%;
        }
        .nav-actions {
          display: flex;
          align-items: center;
          margin-left: auto;
          gap: 16px;
        }
        .theme-toggle-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border-radius: 50%;
          transition: background-color 0.2s, color 0.2s;
        }
        .theme-toggle-btn:hover {
          background-color: var(--hover-overlay);
          color: var(--text-main);
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 16px;
          color: var(--text-muted);
          text-decoration: none;
          font-weight: 500;
          font-size: 0.95rem;
          position: relative;
          transition: color 0.2s;
        }
        .nav-link:hover {
          color: var(--text-main);
        }
        .nav-link.active {
          color: var(--text-main);
        }
        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background-color: var(--nav-active-border);
          border-radius: 2px 2px 0 0;
        }
        .main-content {
          flex: 1;
          display: flex;
          overflow: hidden;
          justify-content: center;
          padding: 24px 0;
        }
      `}</style>
    </div>
  );
}
