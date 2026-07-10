import React, { useState, useEffect, useRef } from 'react';
import { ChatComposer, ChatSendButton, Button } from '@astryxdesign/core';
import { Mic } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useConversations } from '../hooks/useConversations';
import Sidebar from '../components/Sidebar/Sidebar';

export default function ChatInterface() {
  const { 
    chats, activeChatId, setActiveChatId, 
    createNewChat, deleteChat, renameChat, togglePinChat, addMessage 
  } = useConversations();

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
  const messages = activeChat?.messages || [];

  const [input, setInput] = useState('');
  const [baseInput, setBaseInput] = useState('');
  const chatHistoryRef = useRef(null);

  const { isListening, transcript, isSupported, error, toggleListening } = useSpeechRecognition();
  const prevListening = useRef(false);

  useEffect(() => {
    if (isListening && !prevListening.current) {
      setBaseInput(input);
    }
    prevListening.current = isListening;
  }, [isListening, input]);

  useEffect(() => {
    if (isListening && transcript) {
      const space = baseInput && !baseInput.endsWith(' ') ? ' ' : '';
      setInput(baseInput + space + transcript);
    }
  }, [transcript, isListening, baseInput]);

  const scrollToBottom = () => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChatId]);

  const handleSend = (textOrEvent) => {
    let textToSend = input;
    if (textOrEvent && typeof textOrEvent.preventDefault === 'function') {
      textOrEvent.preventDefault();
    } else if (typeof textOrEvent === 'string') {
      textToSend = textOrEvent;
    }

    if (!textToSend.trim()) return;
    
    // Add user message via hook
    addMessage(activeChatId, 'user', textToSend);
    setInput('');
    setBaseInput('');
    
    // Simulate AI response
    setTimeout(() => {
      addMessage(activeChatId, 'ai', 'That sounds like a great idea. I can certainly help you implement the backend logic for that.');
    }, 1000);
  };

  let composerStatus = undefined;
  if (!isSupported) {
    composerStatus = { type: 'warning', message: 'Speech recognition is not supported in this browser.' };
  } else if (error) {
    composerStatus = { type: 'error', message: error };
  }

  return (
    <div className="layout-container">
      <Sidebar 
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={createNewChat}
        onSelectChat={setActiveChatId}
        onRenameChat={renameChat}
        onDeleteChat={deleteChat}
        onTogglePin={togglePinChat}
      />
      
      <div className="chat-container">
        <div className="chat-history" ref={chatHistoryRef}>
          <div className="date-divider">
            <div className="divider-line"></div>
            <span className="divider-text">Today</span>
            <div className="divider-line"></div>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.role}`}>
              <div className={`message-bubble ${msg.role}`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        <div className="chat-input-area">
          <ChatComposer
            value={input}
            onChange={setInput}
            onSubmit={handleSend}
            placeholder="Type a message..."
            status={composerStatus}
            sendActions={
              <Button
                variant="ghost"
                size="md"
                icon={<Mic size={18} strokeWidth={2.5} />}
                isIconOnly
                aria-label={isListening ? 'Stop dictation' : 'Start dictation'}
                onClick={toggleListening}
                className={isListening ? 'mic-listening' : ''}
                style={{ marginRight: '8px' }}
              />
            }
            sendButton={<ChatSendButton />}
          />
        </div>
      </div>

      <style>{`
        .layout-container {
          display: flex;
          height: 100%;
          width: 100%;
          overflow: hidden;
          background-color: #0F1117;
        }

        /* Sidebar Base Styles */
        .sidebar-container {
          width: 280px;
          height: 100%;
          background-color: #15171e;
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          transition: transform 0.3s ease;
          z-index: 40;
        }

        .sidebar-header {
          padding: 16px 16px 8px 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .sidebar-title {
          font-size: 1.15rem;
          font-weight: 600;
          margin: 0;
          color: #ffffff;
        }

        .new-chat-btn {
          width: 100% !important;
          border-radius: 8px !important;
          box-sizing: border-box;
        }

        .sidebar-search {
          padding: 8px 16px 16px 16px;
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }
        
        /* Ensure any internal containers created by Astryx TextInput take full width */
        .sidebar-search > .search-input-wrapper > div,
        .sidebar-search > .search-input-wrapper > input {
          width: 100%;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: rgba(255, 255, 255, 0.5);
          z-index: 1;
        }

        .sidebar-search :global(.astryx-text-input-field) {
          background-color: #1A1C23 !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 8px !important;
          padding: 12px 16px !important;
          font-size: 1.05rem !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }

        .sidebar-scroll-area {
          flex: 1;
          overflow-y: auto;
          padding: 0 16px 16px 16px; /* Align with header and search padding */
        }
        
        .sidebar-scroll-area::-webkit-scrollbar {
          width: 6px;
        }
        .sidebar-scroll-area::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        .empty-list {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.9rem;
          text-align: center;
          margin-top: 24px;
        }

        .conversation-item {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          border-radius: 8px;
          cursor: pointer;
          gap: 12px;
          color: rgba(255, 255, 255, 0.7);
          transition: background-color 0.2s;
          margin-bottom: 6px;
          position: relative;
          width: 100%;
          box-sizing: border-box;
        }

        .conversation-item:hover, .conversation-item.active {
          background-color: #272A35;
          color: #ffffff;
        }

        .chat-icon {
          flex-shrink: 0;
        }

        .chat-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .chat-title {
          font-size: 0.9rem;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chat-rename-input {
          background: transparent;
          border: none;
          color: #ffffff;
          font-size: 0.9rem;
          font-weight: 500;
          outline: none;
          padding: 0;
          width: 100%;
        }

        .chat-time {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 2px;
        }

        .chat-section {
          margin-bottom: 12px;
        }

        .chat-section-title {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.4);
          font-weight: 600;
          letter-spacing: 0.05em;
          margin: 8px 12px;
        }

        .chat-actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .pin-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .conversation-item:hover .pin-btn,
        .pin-btn.is-pinned {
          opacity: 1;
        }

        .pin-btn:hover {
          background-color: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .pin-btn.is-pinned {
          color: #16A34A;
        }

        .menu-trigger {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .conversation-item:hover .menu-trigger {
          opacity: 1;
        }

        .menu-trigger:hover {
          background-color: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .conversation-menu-container {
          position: relative;
        }

        .menu-dropdown {
          position: absolute;
          right: 0;
          top: 100%;
          background-color: #1A1C23;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 4px;
          z-index: 50;
          width: 120px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 8px 12px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.85rem;
          cursor: pointer;
          border-radius: 4px;
          text-align: left;
        }

        .menu-item:hover {
          background-color: #272A35;
          color: #fff;
        }

        .menu-item.delete:hover {
          color: #ef4444;
        }

        /* Mobile specific controls */
        .mobile-menu-btn {
          display: none;
          position: absolute;
          top: 16px;
          left: 16px;
          background: transparent;
          border: none;
          color: #fff;
          cursor: pointer;
          z-index: 30;
          padding: 8px;
        }

        .mobile-close-btn {
          display: none;
          position: absolute;
          top: 16px;
          right: -48px;
          background: transparent;
          border: none;
          color: #fff;
          cursor: pointer;
          padding: 8px;
        }

        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 35;
        }

        /* Existing Chat Interface Styles adapted for layout */
        .chat-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          background-color: transparent;
          position: relative;
          min-width: 0; /* Important for flex child to not blow out */
        }
        
        .chat-history {
          flex: 1;
          overflow-y: auto;
          padding: 24px 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          scroll-behavior: smooth;
        }

        /* Desktop specific adjustments */
        @media (min-width: 769px) {
          .chat-history {
            max-width: 800px;
            margin: 0 auto;
            width: 100%;
          }
          .chat-input-area {
            max-width: 800px;
            margin: 0 auto;
            width: 100%;
          }
        }

        .date-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin: 16px 0 24px;
        }
        .divider-line {
          height: 1px;
          flex: 0.15;
          background-color: rgba(255, 255, 255, 0.1);
        }
        .divider-text {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 500;
        }
        .message-row {
          display: flex;
          width: 100%;
          animation: fadeIn 0.3s ease-out;
        }
        .message-row.user {
          justify-content: flex-end;
        }
        .message-row.ai {
          justify-content: flex-start;
        }
        .message-bubble {
          font-size: 0.95rem;
          line-height: 1.6;
          max-width: 70%;
          word-break: break-word;
        }
        .message-bubble.ai {
          background-color: transparent;
          color: #fff;
          padding: 8px 0;
        }
        .message-bubble.user {
          background-color: #2A2D3E;
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 12px 20px;
        }
        .chat-input-area {
          padding: 24px 32px;
          background-color: transparent;
        }
        .chat-input-area :global([data-astryx-theme="chat-send-button"]) {
          background-color: #16A34A !important;
          color: #ffffff !important;
          border-radius: 50% !important;
          transition: transform 0.2s ease, background-color 0.2s !important;
        }
        .chat-input-area :global([data-astryx-theme="chat-send-button"]:hover:not(:disabled)) {
          background-color: #15803d !important;
          transform: scale(1.05);
        }
        .chat-input-area :global([data-astryx-theme="chat-send-button"]:disabled) {
          opacity: 0.5 !important;
          cursor: not-allowed !important;
          background-color: rgba(255, 255, 255, 0.1) !important;
          color: rgba(255, 255, 255, 0.3) !important;
        }

        .mic-listening {
          background-color: #16A34A !important;
          color: #ffffff !important;
          border-radius: 50% !important;
          animation: pulseMic 1.5s infinite;
        }

        @keyframes pulseMic {
          0% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(22, 163, 74, 0); }
          100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Mobile/Tablet Responsiveness */
        @media (max-width: 768px) {
          .sidebar-container {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            transform: translateX(-100%);
          }
          .sidebar-container.open {
            transform: translateX(0);
          }
          .mobile-menu-btn {
            display: block;
          }
          .mobile-close-btn {
            display: block;
          }
          .sidebar-overlay {
            display: block;
          }
          .chat-history {
            padding-top: 64px; /* Space for hamburger menu */
          }
        }
      `}</style>
    </div>
  );
}
