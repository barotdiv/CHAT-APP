import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Button } from '@astryxdesign/core/Button';
import { Camera } from 'lucide-react';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      updateProfile({ name, avatar });
      setIsSaving(false);
    }, 800);
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString();
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>My Profile</h1>
        
        <div className="profile-card">
          <div className="avatar-section">
            <div className="avatar-container" onClick={() => fileInputRef.current.click()}>
              <div className="avatar-preview">
                {avatar ? (
                  <img src={avatar} alt="Profile" />
                ) : (
                  <span className="avatar-initials">{initials}</span>
                )}
              </div>
              <div className="avatar-overlay">
                <Camera size={20} />
              </div>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImageChange}
            />
            <p className="avatar-hint">Click to change picture</p>
          </div>

          <div className="info-section">
            <div className="form-group">
              <TextInput
                label="Full Name"
                type="text"
                value={name}
                onChange={setName}
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <div className="readonly-field">{user?.email}</div>
            </div>

            <div className="form-group row-group">
              <div className="info-item">
                <label>Account Created</label>
                <div>{formatDate(user?.createdAt)}</div>
              </div>
              <div className="info-item">
                <label>Last Login</label>
                <div>{formatDate(user?.lastLogin)}</div>
              </div>
            </div>

            <div className="action-section">
              <Button 
                label="Save Changes" 
                onClick={handleSave} 
                isLoading={isSaving}
                className="save-btn"
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .profile-page {
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          padding: 32px 24px;
          overflow-y: auto;
          color: var(--text-main);
        }

        .profile-container {
          width: 100%;
          max-width: 600px;
        }

        .profile-container h1 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 24px;
        }

        .profile-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .avatar-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .avatar-container {
          position: relative;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          cursor: pointer;
          overflow: hidden;
          background-color: var(--bg-avatar);
          border: 2px solid var(--border-highlight);
        }

        .avatar-preview {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-initials {
          font-size: 2rem;
          font-weight: 600;
          color: var(--text-main);
        }

        .avatar-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .avatar-container:hover .avatar-overlay {
          opacity: 1;
        }

        .avatar-hint {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .info-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-main);
        }

        .form-group :global(.astryx-text-input-field) {
          background-color: var(--bg-input) !important;
          border: 1px solid var(--border-color) !important;
          border-radius: 12px !important;
          color: var(--text-main) !important;
          padding: 12px 16px !important;
          font-size: 0.95rem !important;
        }

        .form-group :global(.astryx-text-input-field:focus) {
          border-color: var(--btn-primary-bg) !important;
          box-shadow: 0 0 0 1px var(--btn-primary-bg) !important;
        }

        .readonly-field {
          background-color: var(--hover-overlay);
          border: 1px solid var(--border-highlight);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 0.95rem;
          color: var(--text-muted);
          cursor: not-allowed;
        }

        .row-group {
          flex-direction: row;
          gap: 24px;
          margin-top: 8px;
        }

        .info-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .info-item div {
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .action-section {
          margin-top: 16px;
          display: flex;
          justify-content: flex-end;
        }

        .save-btn {
          background-color: var(--btn-primary-bg) !important;
          color: var(--btn-white-text) !important;
          border-radius: 12px !important;
          padding: 10px 24px !important;
          font-weight: 600 !important;
        }

        .save-btn:hover {
          background-color: var(--btn-primary-hover) !important;
        }

        @media (max-width: 480px) {
          .row-group {
            flex-direction: column;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}
