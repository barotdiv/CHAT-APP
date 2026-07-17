import React, { useState, useEffect, useRef } from 'react';
import { ChatComposer, ChatSendButton, Button } from '@astryxdesign/core';
import { Mic, MoreVertical, Trash2, ImagePlus, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useConversations } from '../hooks/useConversations';
import Sidebar from '../components/Sidebar/Sidebar';

export default function ChatInterface() {
  const {
    chats, activeChatId, setActiveChatId,
    createNewChat, deleteChat, renameChat, togglePinChat, addMessage, deleteMessage
  } = useConversations();

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
  const messages = activeChat?.messages || [];

  const [input, setInput] = useState('');
  const [baseInput, setBaseInput] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const chatHistoryRef = useRef(null);
  const fileInputRef = useRef(null);

  const [messageMenuOpen, setMessageMenuOpen] = useState(null);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const { isListening, transcript, isSupported, error, toggleListening } = useSpeechRecognition();
  const prevListening = useRef(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.message-actions-container')) {
        setMessageMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

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

    if (!textToSend.trim() && !selectedImage) return;

    // Add user message via hook and catch any API errors
    addMessage(activeChatId, 'user', textToSend, selectedImage).catch(err => {
      showToast(err.message || 'Failed to send message');
    });

    setInput('');
    setBaseInput('');
    setSelectedImage(null);
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
              {msg.role === 'user' && (
                <div className={`message-actions-container ${messageMenuOpen === msg.id ? 'active' : ''}`}>
                  <button className="msg-menu-btn" onClick={() => setMessageMenuOpen(messageMenuOpen === msg.id ? null : msg.id)}>
                    <MoreVertical size={16} />
                  </button>
                  {messageMenuOpen === msg.id && (
                    <div className="msg-dropdown">
                      <button className="msg-dropdown-item delete" onClick={() => { setMessageToDelete(msg.id); setMessageMenuOpen(null); }}>
                        <Trash2 size={14} />
                        Delete Message
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className={`message-bubble ${msg.role} ${msg.role === 'ai' ? 'markdown-body' : ''}`}>
                {/* NEW: If the message has an image, display it! */}
                {msg.image && (
                  <img
                    src={msg.image}
                    alt="Uploaded attachment"
                    className="message-image"
                  />
                )}
                {msg.role === 'ai' ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
                <div className="message-time">
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {msg.role === 'ai' && (
                <div className={`message-actions-container ${messageMenuOpen === msg.id ? 'active' : ''}`}>
                  <button className="msg-menu-btn" onClick={() => setMessageMenuOpen(messageMenuOpen === msg.id ? null : msg.id)}>
                    <MoreVertical size={16} />
                  </button>
                  {messageMenuOpen === msg.id && (
                    <div className="msg-dropdown">
                      <button className="msg-dropdown-item delete" onClick={() => { setMessageToDelete(msg.id); setMessageMenuOpen(null); }}>
                        <Trash2 size={14} />
                        Delete Message
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="chat-input-area">

          {/* NEW: Image Preview Box */}
          {selectedImage && (
            <div className="image-preview-container">
              <div className="image-preview">
                <img src={URL.createObjectURL(selectedImage)} alt="Preview" />
                <button
                  className="remove-image-btn"
                  onClick={() => setSelectedImage(null)}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
          {/* NEW: Hidden File Input */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setSelectedImage(e.target.files[0]);
              }
            }}
          />
          <ChatComposer
            value={input}
            onChange={setInput}
            onSubmit={handleSend}
            placeholder="Type a message..."
            status={composerStatus}
            sendActions={
              <div style={{ display: 'flex', gap: '8px' }}>
                {/* NEW: The Upload Button */}
                <Button
                  variant="ghost"
                  size="md"
                  icon={<ImagePlus size={18} strokeWidth={2.5} />}
                  isIconOnly
                  aria-label="Upload Image"
                  onClick={() => fileInputRef.current?.click()}
                />

                {/* Your existing Mic Button */}
                <Button
                  variant="ghost"
                  size="md"
                  icon={<Mic size={18} strokeWidth={2.5} />}
                  isIconOnly
                  aria-label={isListening ? 'Stop dictation' : 'Start dictation'}
                  onClick={toggleListening}
                  className={isListening ? 'mic-listening' : ''}
                />
              </div>
            }
            sendButton={<ChatSendButton />}
          />
        </div>
      </div>

      {/* Confirmation Dialog */}
      {messageToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Message</h3>
            <p>Are you sure you want to delete this message?</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setMessageToDelete(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => {
                deleteMessage(activeChatId, messageToDelete);
                setMessageToDelete(null);
                showToast('Message deleted successfully');
              }}>Delete Message</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="toast-message">
          {toastMessage}
        </div>
      )}

      <style>{`
        .layout-container {
          display: flex;
          height: 100%;
          width: 100%;
          overflow: hidden;
          background-color: var(--bg-app);
        }

        /* Sidebar Base Styles */
        .sidebar-container {
          width: 280px;
          height: 100%;
          background-color: var(--bg-card);
          border-right: 1px solid var(--border-color);
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
          color: var(--text-main);
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
          color: var(--text-muted);
          z-index: 1;
        }

        .sidebar-search .astryx-text-input-field {
          background-color: var(--bg-input) !important;
          border: 1px solid var(--border-highlight) !important;
          border-radius: 8px !important;
          padding: 12px 16px !important;
          font-size: 1.05rem !important;
          width: 100% !important;
          box-sizing: border-box !important;
          color: var(--text-main) !important;
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
          background-color: var(--border-highlight);
          border-radius: 4px;
        }

        .empty-list {
          color: var(--text-muted);
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
          color: var(--text-main);
          opacity: 0.8;
          transition: background-color 0.2s, opacity 0.2s;
          margin-bottom: 6px;
          position: relative;
          width: 100%;
          box-sizing: border-box;
        }

        .conversation-item:hover, .conversation-item.active {
          background-color: var(--hover-overlay);
          opacity: 1;
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
          color: var(--text-main);
          font-size: 0.9rem;
          font-weight: 500;
          outline: none;
          padding: 0;
          width: 100%;
        }

        .chat-time {
          font-size: 0.75rem;
          color: var(--text-faded);
          margin-top: 2px;
        }

        .chat-section {
          margin-bottom: 12px;
        }

        .chat-section-title {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-faded);
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
          color: var(--text-muted);
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
          background-color: var(--hover-overlay);
          color: var(--text-main);
        }

        .pin-btn.is-pinned {
          color: var(--btn-success-bg);
        }

        .menu-trigger {
          background: transparent;
          border: none;
          color: var(--text-muted);
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
          background-color: var(--hover-overlay);
          color: var(--text-main);
        }

        .conversation-menu-container {
          position: relative;
        }

        .menu-dropdown {
          position: absolute;
          right: 0;
          top: 100%;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
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
          color: var(--text-main);
          font-size: 0.85rem;
          cursor: pointer;
          border-radius: 4px;
          text-align: left;
        }

        .menu-item:hover {
          background-color: var(--hover-overlay);
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
          color: var(--text-main);
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
          color: var(--text-main);
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
          background-color: var(--border-highlight);
        }
        .divider-text {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .message-row {
          display: flex;
          width: 100%;
          animation: fadeIn 0.3s ease-out;
          align-items: center;
          gap: 8px;
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
          display: flex;
          flex-direction: column;
        }
        .message-bubble.ai {
          background-color: transparent;
          color: var(--text-main);
          padding: 8px 0;
        }
        .message-bubble.user {
          background-color: var(--bg-input);
          color: var(--text-main);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 10px 16px;
        }
        .message-time {
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-top: 4px;
          align-self: flex-end;
          line-height: 1;
        }
        .message-bubble.user .message-time {
          color: var(--text-faded);
        }

        .message-image {
          max-width: 100%;
          border-radius: 8px;
          margin-bottom: 8px;
          display: block;
        }

        .image-preview-container {
          padding: 0 16px 12px 16px;
          display: flex;
        }

        .image-preview {
          position: relative;
          display: inline-block;
        }

        .image-preview img {
          height: 60px;
          border-radius: 8px;
          border: 2px solid var(--border-highlight);
        }

        .remove-image-btn {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        /* Markdown Styling for AI responses */
        .markdown-body {
          font-family: inherit;
        }
        .markdown-body > *:first-child {
          margin-top: 0;
        }
        .markdown-body > *:last-child {
          margin-bottom: 0;
        }
        .markdown-body p {
          margin-bottom: 12px;
        }
        .markdown-body h1, .markdown-body h2, .markdown-body h3, 
        .markdown-body h4, .markdown-body h5, .markdown-body h6 {
          margin-top: 24px;
          margin-bottom: 16px;
          font-weight: 600;
          line-height: 1.25;
        }
        .markdown-body h1 { font-size: 1.5em; }
        .markdown-body h2 { font-size: 1.3em; }
        .markdown-body h3 { font-size: 1.1em; }
        
        .markdown-body ul, .markdown-body ol {
          margin-top: 0;
          margin-bottom: 16px;
          padding-left: 2em;
        }
        .markdown-body li + li {
          margin-top: 4px;
        }
        
        .markdown-body blockquote {
          margin: 0 0 16px;
          padding: 0 1em;
          color: var(--text-muted);
          border-left: 0.25em solid var(--border-highlight);
        }
        
        .markdown-body code {
          padding: 0.2em 0.4em;
          margin: 0;
          font-size: 85%;
          background-color: var(--bg-input);
          border-radius: 6px;
          font-family: monospace;
        }
        
        .markdown-body pre {
          margin-bottom: 16px;
          border-radius: 8px;
          overflow: auto;
        }
        
        .markdown-body pre > div {
          border-radius: 8px !important;
          margin: 0 !important;
        }
        
        .markdown-body pre code {
          padding: 0;
          background-color: transparent;
          border-radius: 0;
        }
        
        .markdown-body table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 16px;
        }
        .markdown-body th, .markdown-body td {
          border: 1px solid var(--border-color);
          padding: 8px 12px;
        }
        .markdown-body th {
          background-color: var(--hover-overlay);
          font-weight: 600;
        }
        .markdown-body hr {
          height: 1px;
          background-color: var(--border-color);
          border: none;
          margin: 24px 0;
        }
        .markdown-body a {
          color: #3b82f6;
          text-decoration: none;
        }
        .markdown-body a:hover {
          text-decoration: underline;
        }
        .chat-input-area {
          padding: 24px 32px;
          background-color: transparent;
        }
        .chat-input-area [data-astryx-theme="chat-send-button"] {
          background-color: #16A34A !important;
          color: #ffffff !important;
          border-radius: 50% !important;
          transition: transform 0.2s ease, background-color 0.2s !important;
        }
        .chat-input-area [data-astryx-theme="chat-send-button"]:hover:not(:disabled) {
          background-color: #15803d !important;
          transform: scale(1.05);
        }
        .chat-input-area [data-astryx-theme="chat-send-button"]:disabled {
          opacity: 0.5 !important;
          cursor: not-allowed !important;
          background-color: var(--border-highlight) !important;
          color: var(--text-muted) !important;
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

        .message-actions-container {
          position: relative;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .message-row:hover .message-actions-container,
        .message-actions-container.active {
          opacity: 1;
        }
        .msg-menu-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 6px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .msg-menu-btn:hover {
          background: var(--hover-overlay);
          color: var(--text-main);
        }
        .msg-dropdown {
          position: absolute;
          top: 100%;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 4px;
          z-index: 50;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          min-width: 140px;
        }
        .message-row.user .msg-dropdown {
          right: 0;
        }
        .message-row.ai .msg-dropdown {
          left: 0;
        }
        .msg-dropdown-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 8px 12px;
          background: transparent;
          border: none;
          color: var(--text-main);
          font-size: 0.85rem;
          cursor: pointer;
          border-radius: 4px;
          text-align: left;
        }
        .msg-dropdown-item:hover {
          background: var(--hover-overlay);
        }
        .msg-dropdown-item.delete {
          color: #ef4444;
        }
        .msg-dropdown-item.delete:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        /* Modal Overlay */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          animation: fadeIn 0.2s ease-out;
        }
        .modal-content {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 24px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        }
        .modal-content h3 {
          margin: 0 0 12px 0;
          color: var(--text-main);
          font-size: 1.2rem;
        }
        .modal-content p {
          margin: 0 0 24px 0;
          color: var(--text-muted);
          font-size: 0.95rem;
          line-height: 1.5;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .btn-cancel {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-main);
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }
        .btn-cancel:hover {
          background: var(--hover-overlay);
        }
        .btn-danger {
          background: #ef4444;
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }
        .btn-danger:hover {
          background: #dc2626;
        }

        /* Toast */
        .toast-message {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: #10b981;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 100;
          animation: slideUpFade 0.3s ease-out;
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
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
