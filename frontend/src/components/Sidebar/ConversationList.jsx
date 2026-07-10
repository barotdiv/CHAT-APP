import React from 'react';
import ConversationItem from './ConversationItem';

export default function ConversationList({ chats, activeChatId, onSelectChat, onRenameChat, onDeleteChat, onTogglePin }) {
  if (chats.length === 0) {
    return <div className="empty-list">No conversations found.</div>;
  }

  const pinnedChats = chats.filter(chat => chat.isPinned);
  const unpinnedChats = chats.filter(chat => !chat.isPinned);

  const renderList = (list) => {
    return list.map(chat => (
      <ConversationItem 
        key={chat.id}
        chat={chat}
        isActive={chat.id === activeChatId}
        onSelect={onSelectChat}
        onRename={onRenameChat}
        onDelete={onDeleteChat}
        onTogglePin={onTogglePin}
      />
    ));
  };

  return (
    <div className="conversation-list">
      {pinnedChats.length > 0 && (
        <div className="chat-section">
          <div className="chat-section-title">Pinned</div>
          {renderList(pinnedChats)}
        </div>
      )}
      
      {unpinnedChats.length > 0 && (
        <div className="chat-section">
          {pinnedChats.length > 0 && <div className="chat-section-title">Recent</div>}
          {renderList(unpinnedChats)}
        </div>
      )}
    </div>
  );
}
