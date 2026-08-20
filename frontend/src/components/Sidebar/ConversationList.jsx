import React from 'react';
import ConversationItem from './ConversationItem';

export default function ConversationList({ chats, activeChatId, onSelectChat, onRenameChat, onDeleteChat, onTogglePin, onDuplicateChat, onExportChat }) {
  const pinnedChats = chats.filter(chat => chat.isPinned);
  const unpinnedChats = chats.filter(chat => !chat.isPinned);

  if (chats.length === 0) {
    return null;
  }

  return (
    <div className="conversation-list">
      {pinnedChats.length > 0 && (
        <div className="chat-section">
          <div className="chat-section-title">Pinned</div>
          {pinnedChats.map((chat) => (
            <ConversationItem
              key={chat.id}
              chat={chat}
              isActive={chat.id === activeChatId}
              onSelect={onSelectChat}
              onRename={onRenameChat}
              onDelete={onDeleteChat}
              onTogglePin={onTogglePin}
              onDuplicate={onDuplicateChat}
              onExport={onExportChat}
            />
          ))}
        </div>
      )}

      {unpinnedChats.length > 0 && (
        <div className="chat-section">
          {pinnedChats.length > 0 && <div className="chat-section-title">Recent</div>}
          {unpinnedChats.map((chat) => (
            <ConversationItem
              key={chat.id}
              chat={chat}
              isActive={chat.id === activeChatId}
              onSelect={onSelectChat}
              onRename={onRenameChat}
              onDelete={onDeleteChat}
              onTogglePin={onTogglePin}
              onDuplicate={onDuplicateChat}
              onExport={onExportChat}
            />
          ))}
        </div>
      )}
    </div>
  );
}
