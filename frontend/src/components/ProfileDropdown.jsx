import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Settings, User } from 'lucide-react';

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const toggleDropdown = () => setIsOpen(!isOpen);

  if (!user) return null;

  // Generate initials for avatar
  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="profile-dropdown-container" ref={dropdownRef}>
      <button className="profile-trigger" onClick={toggleDropdown}>
        <div className="avatar">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <span className="profile-name">{user.name}</span>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            <span className="dropdown-name">{user.name}</span>
            <span className="dropdown-email">{user.email}</span>
          </div>
          <div className="dropdown-divider"></div>
          <button className="dropdown-item" onClick={() => { setIsOpen(false); navigate('/profile'); }}>
            <User size={16} />
            <span>My Profile</span>
          </button>
          <button className="dropdown-item" onClick={() => { setIsOpen(false); navigate('/settings'); }}>
            <Settings size={16} />
            <span>Settings</span>
          </button>
          <div className="dropdown-divider"></div>
          <button className="dropdown-item text-danger" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}

      <style>{`
        .profile-dropdown-container {
          position: relative;
          margin-left: auto;
        }

        .profile-trigger {
          display: flex;
          align-items: center;
          gap: 12px;
          background: transparent;
          border: none;
          padding: 4px 12px;
          border-radius: 24px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .profile-trigger:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #2D303E;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-weight: 600;
          font-size: 0.85rem;
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-name {
          font-size: 0.95rem;
          font-weight: 500;
          color: #fff;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 220px;
          background-color: #15171E;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          padding: 8px 0;
          z-index: 50;
          animation: slideDown 0.2s ease-out;
        }

        .dropdown-header {
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
        }

        .dropdown-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: #fff;
        }

        .dropdown-email {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dropdown-divider {
          height: 1px;
          background-color: rgba(255, 255, 255, 0.08);
          margin: 4px 0;
        }

        .dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s, color 0.2s;
          text-align: left;
        }

        .dropdown-item:hover {
          background-color: rgba(255, 255, 255, 0.05);
          color: #fff;
        }

        .dropdown-item.text-danger {
          color: #ef4444;
        }

        .dropdown-item.text-danger:hover {
          background-color: rgba(239, 68, 68, 0.1);
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
