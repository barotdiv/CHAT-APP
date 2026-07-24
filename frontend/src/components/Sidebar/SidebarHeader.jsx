import React from 'react';
import { Button } from '@astryxdesign/core';
import { Plus } from 'lucide-react';

export default function SidebarHeader({ onNewChat }) {
  return (
    <div className="sidebar-header">
      <h2 className="sidebar-title">NovaAI</h2>
      <Button
        variant="primary"
        className="new-chat-btn"
        onClick={onNewChat}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Plus size={18} />
          <span>New Chat</span>
        </div>
      </Button>
    </div>
  );
}
