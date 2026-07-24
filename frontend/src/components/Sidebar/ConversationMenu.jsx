import React, { useState, useEffect, useRef } from 'react';
import { MoreHorizontal, Edit2, Copy, Download, Trash2 } from 'lucide-react';

export default function ConversationMenu({ onRename, onDelete, onDuplicate, onExport }) {
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

  const handleRename = (e) => {
    e.stopPropagation();
    onRename();
    setIsOpen(false);
  };

  const handleDuplicate = (e) => {
    e.stopPropagation();
    if (onDuplicate) onDuplicate();
    setIsOpen(false);
  }

  const handleExport = (e) => {
    e.stopPropagation();
    if (onExport) onExport();
    setIsOpen(false);
  }

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete();
    setIsOpen(false);
  };

  return (
    <div className="conversation-menu-container" ref={menuRef}>
      <button className="menu-trigger" onClick={toggleMenu} aria-label="Chat options">
        <MoreHorizontal size={16} />
      </button>

      {isOpen && (
        <div className="menu-dropdown">
          <button className="menu-item" onClick={handleRename}>
            <Edit2 size={14} /> Rename
          </button>
          <button className="menu-item" onClick={handleDuplicate}>
            <Copy size={14} /> Duplicate
          </button>
          <button className="menu-item" onClick={handleExport}>
            <Download size={14} /> Export
          </button>
          <button className="menu-item delete" onClick={handleDelete}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
