import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import ChatInterface from './pages/ChatInterface';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import ProfileDropdown from './components/ProfileDropdown';
import { useAuth } from './context/AuthContext';

export default function App() {
  const location = useLocation();
  const { user } = useAuth();
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
          {user && <ProfileDropdown />}
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
          background-color: #0F1117;
          color: var(--color-text-primary, #fff);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .top-nav {
          display: flex;
          align-items: center;
          padding: 0 var(--spacing-6, 24px);
          height: 64px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          background-color: #0F1117;
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
        .nav-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 16px;
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          font-weight: 500;
          font-size: 0.95rem;
          position: relative;
          transition: color 0.2s;
        }
        .nav-link:hover {
          color: #fff;
        }
        .nav-link.active {
          color: #fff;
        }
        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background-color: #fff;
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
