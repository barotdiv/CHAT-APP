import React, { useState } from 'react';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Button } from '@astryxdesign/core/Button';
import { Link } from 'react-router-dom';

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
        // signup logic would go here
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
            icon={<img src="/assets/apple.svg" alt="Apple" width="18" height="18" />}
            className="social-btn"
          />
          <Button
            label="Sign up with Google"
            icon={<img src="/assets/google.svg" alt="Google" width="18" height="18" />}
            className="social-btn"
          />
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
          background-color: #0F1117;
          color: #ffffff;
          padding: 24px;
          animation: fadeInPage 0.4s ease-out;
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

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        /* Style the label provided by TextInput if it exposes a wrapper, or we can just style it globally in input-group */
        .input-group :global(label) {
          font-size: 0.85rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 4px;
          display: block;
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

        .error-text {
          font-size: 0.8rem;
          color: #ef4444;
          margin-top: 2px;
        }

        .signup-btn {
          width: 100% !important;
          background-color: #16A34A !important;
          color: #ffffff !important;
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
          background-color: #15803d !important;
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

        .social-btn img {
          margin-right: 8px;
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
