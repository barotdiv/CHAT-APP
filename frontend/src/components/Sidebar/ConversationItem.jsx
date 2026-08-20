import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Pin } from 'lucide-react';
import ConversationMenu from './ConversationMenu';

export default function ConversationItem({ chat, isActive, onSelect, onRename, onDelete, onTogglePin, onCopyChat }) {
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

  const handleTogglePin = (e) => {
    e.stopPropagation();
    onTogglePin(chat.id);
  };

  const handleDelete = () => {
    if (onDelete) onDelete(chat.id);
  };

  const handleCopy = () => {
    if (onCopyChat) onCopyChat(chat);
  };

  return (
    <div
      className={`conversation-item ${isActive ? 'active' : ''} ${chat.isPinned ? 'pinned' : ''}`}
      onClick={() => !isEditing && onSelect(chat.id)}
    >
      <MessageSquare size={18} className="chat-icon" />

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
        <span className="chat-title" onDoubleClick={() => setIsEditing(true)}>{chat.title}</span>
      )}

      {!isEditing && (
        <div className="chat-actions" onClick={e => e.stopPropagation()}>
          <button
            className={`pin-btn ${chat.isPinned ? 'is-pinned' : ''}`}
            onClick={handleTogglePin}
            aria-label={chat.isPinned ? "Unpin chat" : "Pin chat"}
            title={chat.isPinned ? "Unpin chat" : "Pin chat"}
          >
            <Pin size={16} fill={chat.isPinned ? "currentColor" : "none"} />
          </button>

          <ConversationMenu
            onCopy={handleCopy}
            onDelete={handleDelete}
          />
        </div>
      )}
    </div>
  );
}

