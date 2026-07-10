import React, { useState } from 'react';
import SidebarHeader from './SidebarHeader';
import SearchBar from './SearchBar';
import ConversationList from './ConversationList';
import { Menu, X } from 'lucide-react';

export default function Sidebar({ 
  chats, activeChatId, onNewChat, onSelectChat, onRenameChat, onDeleteChat 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const filteredChats = chats.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);

  return (
    <>
      <button 
        className="mobile-menu-btn" 
        onClick={toggleMobileSidebar}
        aria-label="Toggle sidebar"
      >
        <Menu size={24} />
      </button>

      {isMobileOpen && (
        <div className="sidebar-overlay" onClick={toggleMobileSidebar}></div>
      )}

      <aside className={`sidebar-container ${isMobileOpen ? 'open' : ''}`}>
        {isMobileOpen && (
          <button className="mobile-close-btn" onClick={toggleMobileSidebar}>
            <X size={24} />
          </button>
        )}

        <SidebarHeader onNewChat={() => {
          onNewChat();
          if (isMobileOpen) setIsMobileOpen(false);
        }} />
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <div className="sidebar-scroll-area">
          <ConversationList 
            chats={filteredChats}
            activeChatId={activeChatId}
            onSelectChat={(id) => {
              onSelectChat(id);
              if (isMobileOpen) setIsMobileOpen(false);
            }}
            onRenameChat={onRenameChat}
            onDeleteChat={onDeleteChat}
          />
        </div>
      </aside>
    </>
  );
}
