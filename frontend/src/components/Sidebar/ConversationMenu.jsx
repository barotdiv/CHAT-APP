import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical, Copy, Trash2 } from 'lucide-react';

export default function ConversationMenu({ onCopy, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleMenu = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    if (onCopy) onCopy();
    setIsOpen(false);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete();
    setIsOpen(false);
  };

  return (
    <div className="conversation-menu-container" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button 
        className={`menu-trigger-btn ${isOpen ? 'active' : ''}`} 
        onClick={toggleMenu} 
        aria-label="Chat options"
        title="Chat options"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div className="chat-menu-dropdown">
          <button className="chat-menu-item" onClick={handleCopy}>
            <Copy size={14} />
            <span>Copy</span>
          </button>
          <button className="chat-menu-item delete" onClick={handleDelete}>
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}

