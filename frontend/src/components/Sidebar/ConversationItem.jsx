import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import ConversationMenu from './ConversationMenu';

export default function ConversationItem({ chat, isActive, onSelect, onRename, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(chat.title);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSaveRename = () => {
    if (editTitle.trim()) {
      onRename(chat.id, editTitle.trim());
    } else {
      setEditTitle(chat.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveRename();
    } else if (e.key === 'Escape') {
      setEditTitle(chat.title);
      setIsEditing(false);
    }
  };

  const date = new Date(chat.updatedAt);
  const isToday = new Date().toDateString() === date.toDateString();
  const timeStr = isToday ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString();

  return (
    <div 
      className={`conversation-item ${isActive ? 'active' : ''}`}
      onClick={() => !isEditing && onSelect(chat.id)}
    >
      <MessageSquare size={18} className="chat-icon" />
      
      <div className="chat-info">
        {isEditing ? (
          <input 
            ref={inputRef}
            className="chat-rename-input"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveRename}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="chat-title">{chat.title}</span>
        )}
        <span className="chat-time">{timeStr}</span>
      </div>

      {!isEditing && (
        <div className="chat-actions" onClick={e => e.stopPropagation()}>
          <ConversationMenu 
            onRename={() => setIsEditing(true)}
            onDelete={() => onDelete(chat.id)}
          />
        </div>
      )}
    </div>
  );
}
