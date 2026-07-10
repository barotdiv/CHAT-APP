import React from 'react';
import ConversationItem from './ConversationItem';

export default function ConversationList({ chats, activeChatId, onSelectChat, onRenameChat, onDeleteChat }) {
  if (chats.length === 0) {
    return <div className="empty-list">No conversations found.</div>;
  }

  return (
    <div className="conversation-list">
      {chats.map(chat => (
        <ConversationItem 
          key={chat.id}
          chat={chat}
          isActive={chat.id === activeChatId}
          onSelect={onSelectChat}
          onRename={onRenameChat}
          onDelete={onDeleteChat}
        />
      ))}
    </div>
  );
}
