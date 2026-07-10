import React, { useState } from 'react';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Button } from '@astryxdesign/core/Button';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { signup } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full Name is required.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      newErrors.password = 'Password must be at least 8 characters, with 1 uppercase, 1 lowercase, 1 number, and 1 special character.';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    if (validate()) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        signup(fullName, email);
        navigate('/chat');
      }, 1500);
    }
  };

  return (
    <div className="signin-page">
      <div className="signin-card">
        <div className="signin-header">
          <h1>Create your account</h1>
          <p>Create a new account to continue.</p>
        </div>

        <form onSubmit={handleSignUp} className="signin-form" noValidate>
          <div className="input-group">
            <TextInput
              label="Full Name"
              type="text"
              value={fullName}
              onChange={setFullName}
            />
            {errors.fullName && <span className="error-text">{errors.fullName}</span>}
          </div>
          <div className="input-group">
            <TextInput
              label="Email Address"
              type="email"
              value={email}
              onChange={setEmail}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>
          <div className="input-group">
            <TextInput
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>
          <div className="input-group">
            <TextInput
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>

          <Button
            type="submit"
            label="Create Account"
            isLoading={isLoading}
            className="signup-btn"
          />
        </form>

        <div className="divider">
          <div className="divider-line"></div>
          <span>Or continue with</span>
          <div className="divider-line"></div>
        </div>

        <div className="social-buttons">
          <Button
            label="Sign up with Apple"
            className="social-btn"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <img src="/assets/apple.svg" alt="Apple" style={{ width: '24px', height: '24px' }} />
              <span>Sign up with Apple</span>
            </div>
          </Button>
          <Button
            label="Sign up with Google"
            className="social-btn"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <img src="/assets/google.svg" alt="Google" style={{ width: '24px', height: '24px' }} />
              <span>Sign up with Google</span>
            </div>
          </Button>
        </div>

        <div className="signin-footer">
          Already have an account? <Link to="/signin" className="link">Sign in</Link>
        </div>
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
          background-color: var(--bg-app);
          color: var(--text-main);
          padding: 24px;
          animation: fadeInPage 0.4s ease-out;
        }

        .signin-card {
          box-sizing: border-box;
          width: 100%;
          max-width: 440px;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
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
          color: var(--text-main);
        }

        .signin-header p {
          font-size: 0.95rem;
          color: var(--text-muted);
          margin: 0;
        }

        .signin-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        /* Style the label provided by TextInput if it exposes a wrapper, or we can just style it globally in input-group */
        .input-group :global(label) {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-main);
          margin-bottom: 4px;
          display: block;
        }

        .input-group :global(.astryx-text-input-field) {
          background-color: var(--bg-input) !important;
          border: 1px solid var(--border-color) !important;
          border-radius: 12px !important;
          color: var(--text-main) !important;
          padding: 12px 16px !important;
          font-size: 0.95rem !important;
          transition: border-color 0.2s, box-shadow 0.2s !important;
        }

        .input-group :global(.astryx-text-input-field:focus) {
          border-color: var(--btn-success-bg) !important;
          box-shadow: 0 0 0 1px var(--btn-success-bg) !important;
        }

        .error-text {
          font-size: 0.8rem;
          color: #ef4444;
          margin-top: 2px;
        }

        .signup-btn {
          width: 100% !important;
          background-color: var(--btn-success-bg) !important;
          color: var(--btn-white-text) !important;
          border-radius: 12px !important;
          padding: 12px !important;
          font-weight: 600 !important;
          font-size: 0.95rem !important;
          margin-top: 8px;
          transition: transform 0.2s, background-color 0.2s !important;
          display: flex !important;
          justify-content: center !important;
        }

        .signup-btn:hover {
          background-color: var(--btn-success-hover) !important;
          transform: scale(1.02);
        }

        .signup-btn:active {
          transform: scale(0.98);
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
          background-color: var(--border-highlight);
        }

        .divider span {
          font-size: 0.85rem;
          color: var(--text-muted);
          white-space: nowrap;
        }

        .social-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .social-btn {
          width: 100% !important;
          background-color: var(--bg-input) !important;
          color: var(--text-main) !important;
          border: 1px solid var(--border-highlight) !important;
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
          background-color: var(--bg-avatar) !important;
          transform: scale(1.02);
        }

        .signin-footer {
          text-align: center;
          margin-top: 32px;
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .signin-footer .link {
          color: var(--text-main);
          font-weight: 500;
          text-decoration: none;
          margin-left: 4px;
        }

        .signin-footer .link:hover {
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
