import React from 'react';
import { Button } from '@astryxdesign/core';
import { Plus, ShieldAlert } from 'lucide-react';

export default function SidebarHeader({ onNewChat, onTemporaryChat }) {
  return (
    <div className="sidebar-header">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 className="sidebar-title">NovaAI</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
        {onTemporaryChat && (
          <Button
            variant="ghost"
            style={{ width: '100%', fontSize: '0.85rem', color: 'var(--text-muted)' }}
            onClick={onTemporaryChat}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <ShieldAlert size={15} />
              <span>Incognito / Temporary Chat</span>
            </div>
          </Button>
        )}
      </div>
    </div>
  );
}
