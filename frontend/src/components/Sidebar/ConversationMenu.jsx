import React, { useState } from 'react';
import { MoreHorizontal, Edit2, Trash2 } from 'lucide-react';

export default function ConversationMenu({ onRename, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat?')) {
      onDelete();
    }
    setIsOpen(false);
  };

  const handleRename = (e) => {
    e.stopPropagation();
    onRename();
    setIsOpen(false);
  };

  return (
    <div className="conversation-menu-container">
      <button className="menu-trigger" onClick={toggleMenu} aria-label="Chat options">
        <MoreHorizontal size={16} />
      </button>

      {isOpen && (
        <div className="menu-dropdown">
          <button className="menu-item" onClick={handleRename}>
            <Edit2 size={14} /> Rename
          </button>
          <button className="menu-item delete" onClick={handleDelete}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
