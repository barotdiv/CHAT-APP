import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Trash2 } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';

export default function Settings() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Mock settings state
  const [fontSize, setFontSize] = useState('medium');
  const [timestamps, setTimestamps] = useState(true);
  const [enterToSend, setEnterToSend] = useState(true);
  const [voiceInput, setVoiceInput] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);

  const handleSignOutAll = () => {
    logout();
    navigate('/signin');
  };

  const handleClearHistory = () => {
    alert("Chat history cleared. (Mock action)");
  };

  const handleExportHistory = () => {
    alert("Exporting chat history... (Mock action)");
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      logout();
      navigate('/signin');
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1>Settings</h1>

        <div className="settings-content">
          
          {/* General Section */}
          <section className="settings-section">
            <h2>General</h2>
            


            <div className="setting-item">
              <div className="setting-info">
                <label>Language</label>
                <p>Application language.</p>
              </div>
              <div className="setting-value">English (US)</div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Font Size</label>
                <p>Adjust chat text size.</p>
              </div>
              <select value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="setting-select">
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </section>

          {/* Chat Settings Section */}
          <section className="settings-section">
            <h2>Chat Settings</h2>

            <div className="setting-item">
              <div className="setting-info">
                <label>Show Timestamps</label>
                <p>Display time next to messages.</p>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={timestamps} onChange={() => setTimestamps(!timestamps)} />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Enter to Send</label>
                <p>Press Enter to send message, Shift+Enter for new line.</p>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={enterToSend} onChange={() => setEnterToSend(!enterToSend)} />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Voice Input</label>
                <p>Enable microphone for voice typing.</p>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={voiceInput} onChange={() => setVoiceInput(!voiceInput)} />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item setting-actions">
              <Button label="Clear Chat History" onClick={handleClearHistory} className="secondary-btn" />
              <Button label="Export Chat History" onClick={handleExportHistory} className="secondary-btn" />
            </div>
          </section>

          {/* Notifications Section */}
          <section className="settings-section">
            <h2>Notifications</h2>

            <div className="setting-item">
              <div className="setting-info">
                <label>Enable Notifications</label>
                <p>Receive push notifications for new messages.</p>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={notifications} onChange={() => setNotifications(!notifications)} />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Notification Sounds</label>
                <p>Play a sound for incoming messages.</p>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={sound} onChange={() => setSound(!sound)} />
                <span className="slider"></span>
              </label>
            </div>
          </section>

          {/* Privacy Section */}
          <section className="settings-section">
            <h2>Privacy & Security</h2>

            <div className="setting-item">
              <div className="setting-info">
                <label>Sign out everywhere</label>
                <p>Sign out from all active sessions.</p>
              </div>
              <button className="danger-text-btn" onClick={handleSignOutAll}>
                <LogOut size={16} /> Sign out all devices
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Delete Account</label>
                <p>Permanently remove your data and account.</p>
              </div>
              <button className="danger-text-btn" onClick={handleDeleteAccount}>
                <Trash2 size={16} /> Delete Account
              </button>
            </div>
          </section>

          {/* About Section */}
          <section className="settings-section about-section">
            <h2>About</h2>
            <div className="about-info">
              <p><strong>Application Name:</strong> AI Studio</p>
              <p><strong>Version:</strong> 1.0.0 (Build 42)</p>
              <p><strong>Developer:</strong> AI Solutions Inc.</p>
            </div>
            <div className="about-links">
              <a href="#">Terms of Service</a>
              <span className="dot">•</span>
              <a href="#">Privacy Policy</a>
            </div>
          </section>

        </div>
      </div>

      <style>{`
        .settings-page {
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          padding: 32px 24px;
          overflow-y: auto;
          color: var(--text-main);
        }

        .settings-container {
          width: 100%;
          max-width: 800px;
        }

        .settings-container h1 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 24px;
        }

        .settings-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .settings-section {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 24px 32px;
        }

        .settings-section h2 {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-main);
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-color);
        }

        .setting-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
        }

        .setting-item:not(:last-child) {
          border-bottom: 1px solid var(--border-color);
        }

        .setting-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding-right: 24px;
        }

        .setting-info label {
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-main);
        }

        .setting-info p {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin: 0;
        }

        .setting-value {
          color: var(--text-muted);
          font-size: 0.9rem;
          padding: 8px 12px;
        }

        /* Select styling */
        .setting-select {
          background-color: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-main);
          padding: 8px 12px;
          font-size: 0.9rem;
          cursor: pointer;
          min-width: 150px;
        }
        
        .setting-select:focus {
          outline: none;
          border-color: var(--btn-primary-bg);
        }

        /* Toggle styling */
        .toggle {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
          flex-shrink: 0;
        }
        .toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: var(--border-highlight);
          transition: .3s;
          border-radius: 24px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: var(--bg-card);
          transition: .3s;
          border-radius: 50%;
        }
        input:checked + .slider {
          background-color: var(--btn-primary-bg);
        }
        input:checked + .slider:before {
          transform: translateX(20px);
        }

        .setting-actions {
          justify-content: flex-start;
          gap: 16px;
          padding-top: 24px !important;
          border-top: 1px solid var(--border-color) !important;
          margin-top: 12px;
        }

        .secondary-btn {
          background-color: var(--hover-overlay) !important;
          color: var(--text-main) !important;
          border: 1px solid var(--border-highlight) !important;
          border-radius: 8px !important;
          padding: 8px 16px !important;
          font-size: 0.9rem !important;
        }

        .secondary-btn:hover {
          background-color: var(--border-highlight) !important;
        }

        .danger-text-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: none;
          color: #ef4444;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 8px;
          transition: background-color 0.2s;
        }

        .danger-text-btn:hover {
          background-color: var(--danger-hover);
        }

        .about-info p {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-bottom: 8px;
        }
        
        .about-info strong {
          color: var(--text-main);
        }

        .about-links {
          margin-top: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .about-links a {
          color: var(--btn-primary-bg);
          text-decoration: none;
          font-size: 0.9rem;
        }

        .about-links a:hover {
          text-decoration: underline;
        }

        .about-links .dot {
          color: var(--text-faded);
          font-size: 0.8rem;
        }

        @media (max-width: 600px) {
          .setting-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          
          .setting-actions {
            flex-direction: column;
            align-items: stretch;
          }
          
          .setting-actions button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
