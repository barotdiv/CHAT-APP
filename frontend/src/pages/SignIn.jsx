import React, { useState } from 'react';

import { TextInput } from '@astryxdesign/core/TextInput';
import { Button } from '@astryxdesign/core/Button';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      login(email || 'user@example.com');
      navigate('/chat');
    }, 1500);
  };

  return (
    <div className="signin-page">
      <div className="signin-card">
        <div className="signin-header">
          <h1>Welcome back</h1>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="signin-form">
          <div className="input-group">
            <TextInput
              label="Email"
              isLabelHidden
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={setEmail}
            />
          </div>
          <div className="input-group">
            <TextInput
              label="Password"
              isLabelHidden
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={setPassword}
            />
          </div>

          <Button
            type="submit"
            label="Login"
            isLoading={isLoading}
            className="login-btn"
          />
        </form>

        <div className="divider">
          <div className="divider-line"></div>
          <span>Or continue with</span>
          <div className="divider-line"></div>
        </div>

        <div className="social-buttons">
          <Button
            label="Login with Apple"
            className="social-btn"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <img src="/assets/apple.svg" alt="Apple" style={{ width: '24px', height: '24px' }} />
              <span>Login with Apple</span>
            </div>
          </Button>
          <Button
            label="Login with Google"
            className="social-btn"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <img src="/assets/google.svg" alt="Google" style={{ width: '24px', height: '24px' }} />
              <span>Login with Google</span>
            </div>
          </Button>
        </div>

        <div className="signin-footer">
          Don't have an account? <Link to="/signup" className="link">Sign up</Link>
        </div>
      </div>

      <div className="terms-text">
        By clicking continue, you agree to our <Link to="/terms" className="link">Terms of Service</Link> and <Link to="/privacy" className="link">Privacy Policy</Link>.
      </div>

      <style>{`
        .signin-page {
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          width: 100%;
          background-color: #0F1117;
          color: #ffffff;
          padding: 24px;
          animation: fadeInPage 0.4s ease-out;
        }

        .signin-logo-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 32px;
          gap: 12px;
        }

        .logo-icon {
          color: #ffffff;
        }

        .logo-text {
          font-size: 1.15rem;
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        .signin-card {
          box-sizing: border-box;
          width: 100%;
          max-width: 440px;
          background-color: #15171E;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          margin-bottom: 16px;
        }

        .signin-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .signin-header h1 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #ffffff;
        }

        .signin-header p {
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        .signin-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .input-group :global(.astryx-text-input-field) {
          background-color: #1A1C23 !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          color: #ffffff !important;
          padding: 12px 16px !important;
          font-size: 0.95rem !important;
          transition: border-color 0.2s, box-shadow 0.2s !important;
        }

        .input-group :global(.astryx-text-input-field:focus) {
          border-color: #16A34A !important;
          box-shadow: 0 0 0 1px #16A34A !important;
        }

        .input-group :global(.astryx-text-input-field::placeholder) {
          color: rgba(255, 255, 255, 0.4) !important;
        }

        .login-btn {
          width: 100% !important;
          background-color: #ffffff !important;
          color: #0F1117 !important;
          border-radius: 12px !important;
          padding: 12px !important;
          font-weight: 600 !important;
          font-size: 0.95rem !important;
          margin-top: 8px;
          transition: transform 0.2s, opacity 0.2s !important;
          display: flex !important;
          justify-content: center !important;
        }

        .login-btn:hover {
          opacity: 0.9 !important;
          transform: scale(1.02);
        }

        .divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin: 24px 0;
        }

        .divider-line {
          height: 1px;
          flex: 1;
          background-color: rgba(255, 255, 255, 0.1);
        }

        .divider span {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);
          white-space: nowrap;
        }

        .social-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .social-btn {
          width: 100% !important;
          background-color: #1A1C23 !important;
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          padding: 12px !important;
          font-weight: 500 !important;
          font-size: 0.95rem !important;
          transition: background-color 0.2s, transform 0.2s !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
        }

        .social-btn:hover {
          background-color: #272A35 !important;
          transform: scale(1.02);
        }

        .signin-footer {
          text-align: center;
          margin-top: 32px;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .signin-footer .link {
          color: #ffffff;
          font-weight: 500;
          text-decoration: none;
          margin-left: 4px;
        }

        .signin-footer .link:hover {
          text-decoration: underline;
        }

        .terms-text {
          max-width: 400px;
          text-align: center;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.4);
          line-height: 1.5;
        }

        .terms-text .link {
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
        }

        .terms-text .link:hover {
          color: #ffffff;
          text-decoration: underline;
        }

        @keyframes fadeInPage {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Mobile overrides */
        @media (max-width: 480px) {
          .signin-card {
            padding: 24px;
            border-radius: 16px;
          }
        }
      `}</style>
    </div>
  );
}
