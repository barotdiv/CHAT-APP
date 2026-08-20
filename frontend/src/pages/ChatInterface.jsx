import React, { useState, useEffect, useRef } from 'react';
import { ChatComposer, ChatSendButton, Button } from '@astryxdesign/core';
import { Mic, MoreVertical, Trash2, ImagePlus, X, Download, Copy, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useConversations } from '../hooks/useConversations';
import { useSettings } from "../context/SettingsContext";
import Sidebar from '../components/Sidebar/Sidebar';

export default function ChatInterface() {
  const {
    chats, activeChatId, setActiveChatId,
    createNewChat, deleteChat, renameChat, togglePinChat, addMessage, deleteMessage, duplicateChat, exportChat
  } = useConversations();

  const { settings } = useSettings();
  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
  const messages = activeChat?.messages || [];

  const [input, setInput] = useState('');
  const [baseInput, setBaseInput] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const chatHistoryRef = useRef(null);
  const fileInputRef = useRef(null);

  const [toastMessage, setToastMessage] = useState('');

  const { isListening, transcript, isSupported, error, toggleListening } = useSpeechRecognition();
  const prevListening = useRef(false);
  const prevMessageCount = useRef(messages.length);

  const handleCopyMessage = (content) => {
    if (navigator.clipboard && content) {
      navigator.clipboard.writeText(content);
      showToast('Copied to clipboard');
    }
  };

  const handleCopyChat = async (chat) => {
    try {
      let textToCopy = '';
      if (chat.messages && chat.messages.length > 0) {
        textToCopy = chat.messages.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n\n');
      } else {
        const token = localStorage.getItem('chatAppToken');
        const res = await fetch(`/api/chats/${chat.id}/messages`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            textToCopy = data.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n\n');
          } else {
            textToCopy = chat.title;
          }
        } else {
          textToCopy = chat.title;
        }
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
        showToast('Chat copied to clipboard');
      }
    } catch (err) {
      console.error('Failed to copy chat:', err);
      showToast('Failed to copy chat');
    }
  };

  const playSoundEffect = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Audio Context sound error:", e);
    }
  };

  const triggerNotification = (content) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('NovaAI', {
        body: content ? (content.length > 60 ? content.substring(0, 60) + '...' : content) : 'New message received!',
        icon: '/favicon.svg'
      });
    }
  };

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
  }, [messages, activeChatId, settings?.autoScroll]);

  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && (lastMessage.role === 'ai')) {
        if (settings.sound) playSoundEffect();
        if (settings.notifications && document.hidden) triggerNotification(lastMessage.content);
      }
    }
    prevMessageCount.current = messages.length;
    scrollToBottom();
  }, [messages, settings.sound, settings.notifications]);

  const isSendingRef = useRef(false);

  const handleSend = async (textOrEvent) => {
    if (isSendingRef.current) return;

    let textToSend = input;
    if (typeof textOrEvent === 'string' && textOrEvent.trim()) {
      textToSend = textOrEvent;
    } else if (textOrEvent && typeof textOrEvent.preventDefault === 'function') {
      textOrEvent.preventDefault();
    }

    if (!textToSend.trim() && !selectedImage) return;

    isSendingRef.current = true;

    const currentImage = selectedImage;
    const currentText = textToSend;

    setInput('');
    setBaseInput('');
    setSelectedImage(null);

    try {
      await addMessage(activeChatId, 'user', currentText, currentImage);
    } catch (err) {
      showToast(err?.message || 'Failed to send message');
    } finally {
      isSendingRef.current = false;
    }
  };

  let composerStatus = undefined;
  if (!isSupported && settings.voiceInput) {
    composerStatus = { type: 'warning', message: 'Speech recognition is not supported in this browser.' };
  } else if (error && settings.voiceInput) {
    composerStatus = { type: 'error', message: error };
  }

  return (
    <div className={`layout-container font-size-${settings.fontSize}`}>
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={createNewChat}
        onSelectChat={setActiveChatId}
        onRenameChat={renameChat}
        onDeleteChat={deleteChat}
        onTogglePin={togglePinChat}
        onCopyChat={handleCopyChat}
      />

      <div className="chat-container">
        <div className="chat-history" ref={chatHistoryRef}>
          <div className="date-divider">
            <div className="divider-line"></div>
            <span className="divider-text">Conversation</span>
            <div className="divider-line"></div>
          </div>
          {messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.role}`}>
              {msg.role === 'user' ? (
                <>
                  <div className="message-actions-container">
                    <button
                      className="msg-action-btn"
                      title="Copy message"
                      onClick={() => handleCopyMessage(msg.content)}
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <div className={`message-bubble user ${settings.typingAnimation ? 'animated' : ''}`}>
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="Uploaded attachment"
                        className="message-image"
                      />
                    )}
                    {msg.content}
                    {settings.timestamps && (
                      <div className="message-time">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className={`message-bubble ai markdown-body ${settings.typingAnimation ? 'animated' : ''} ${msg.isStreaming ? 'is-streaming' : ''}`}>
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="Uploaded attachment"
                        className="message-image"
                      />
                    )}
                    {msg.isStreaming && !msg.content ? (
                      <div className="typing-indicator">
                        <span>AI is thinking</span>
                        <span className="dot">.</span>
                        <span className="dot">.</span>
                        <span className="dot">.</span>
                      </div>
                    ) : /https?:\/\/image\.pollinations\.ai\//i.test(msg.content) ? (
                      <img
                        src={msg.content.match(/https?:\/\/image\.pollinations\.ai\/[^\s)\]"]+/i)?.[0] || msg.content.trim()}
                        alt="AI Generated Artwork"
                        className="message-image"
                        style={{ marginTop: '8px', maxWidth: '100%', borderRadius: '8px', minWidth: '300px', minHeight: '300px', backgroundColor: 'var(--bg-input)' }}
                      />
                    ) : (
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
                    )}
                    {settings.timestamps && (
                      <div className="message-time">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                  <div className="message-actions-container">
                    <button
                      className="msg-action-btn"
                      title="Copy response"
                      onClick={() => handleCopyMessage(msg.content)}
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="chat-input-area">
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
          <div onKeyDown={(e) => {
            if ((e.key === 'Tab' || e.key === 'Enter') && !e.shiftKey) {
              if (e.key === 'Tab') {
                e.preventDefault();
                handleSend(input);
              }
            }
          }}>
            <ChatComposer
              value={input}
              onChange={setInput}
              onSubmit={(text) => {
                const textToSend = typeof text === 'string' && text.trim() ? text : input;
                handleSend(textToSend);
              }}
              placeholder={settings.enterToSend ? "Type a message (Enter/Tab to send, Shift+Enter for new line)..." : "Type a message..."}
              status={composerStatus}
              sendActions={
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="ghost"
                    size="md"
                    icon={<ImagePlus size={18} strokeWidth={2.5} />}
                    isIconOnly
                    aria-label="Upload Image"
                    onClick={() => fileInputRef.current?.click()}
                  />
                  {settings.voiceInput && (
                    <Button
                      variant="ghost"
                      size="md"
                      icon={<Mic size={18} strokeWidth={2.5} />}
                      isIconOnly
                      aria-label={isListening ? 'Stop dictation' : 'Start dictation'}
                      onClick={toggleListening}
                      className={isListening ? 'mic-listening' : ''}
                    />
                  )}
                </div>
              }
              sendButton={<ChatSendButton onSend={() => handleSend(input)} />}
            />
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="toast-message">
          {toastMessage}
        </div>
      )}

      <style>{`
        .font-size-small .message-bubble { font-size: 0.85rem !important; }
        .font-size-medium .message-bubble { font-size: 0.95rem !important; }
        .font-size-large .message-bubble { font-size: 1.1rem !important; }

        .layout-container { display: flex; height: 100%; width: 100%; overflow: hidden; background-color: var(--bg-app); }
        .sidebar-container { width: 280px; height: 100%; background-color: var(--bg-card); border-right: 1px solid var(--border-color); display: flex; flex-direction: column; flex-shrink: 0; transition: transform 0.3s ease; z-index: 40; }
        .sidebar-header { padding: 16px 16px 8px 16px; display: flex; flex-direction: column; gap: 16px; }
        .sidebar-title { font-size: 1.15rem; font-weight: 600; margin: 0; color: var(--text-main); }
        .new-chat-btn { width: 100% !important; border-radius: 8px !important; }
        .sidebar-scroll-area { flex: 1; overflow-y: auto; padding: 0 16px 16px 16px; }
        .chat-container { flex: 1; display: flex; flex-direction: column; background-color: transparent; position: relative; min-width: 0; }
        .chat-history { flex: 1; overflow-y: auto; padding: 24px 32px; display: flex; flex-direction: column; gap: 20px; scroll-behavior: smooth; }
        @media (min-width: 769px) { .chat-history { max-width: 800px; margin: 0 auto; width: 100%; } .chat-input-area { max-width: 800px; margin: 0 auto; width: 100%; } }
        .date-divider { display: flex; align-items: center; justify-content: center; gap: 16px; margin: 16px 0 24px; }
        .divider-line { height: 1px; flex: 0.15; background-color: var(--border-highlight); }
        .divider-text { font-size: 0.85rem; color: var(--text-muted); font-weight: 500; }
        .message-row { display: flex; width: 100%; align-items: center; gap: 8px; }
        .message-row.user { justify-content: flex-end; }
        .message-row.ai { justify-content: flex-start; }
        .message-bubble { line-height: 1.6; max-width: 70%; word-break: break-word; padding: 12px 16px; border-radius: 12px; }
        .message-bubble.user { background: var(--btn-primary-bg, #3b82f6); color: #fff; border-bottom-right-radius: 2px; }
        .message-bubble.ai { background: var(--bg-card, #18181b); color: var(--text-main); border-bottom-left-radius: 2px; border: 1px solid var(--border-color); }
        .message-actions-container { display: flex; align-items: center; gap: 4px; opacity: 0; transition: opacity 0.2s; }
        .message-row:hover .message-actions-container { opacity: 1; }
        .msg-action-btn { background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; }
        .msg-action-btn:hover { background-color: var(--hover-overlay); color: var(--text-main); }
        .typing-indicator { display: flex; align-items: center; gap: 2px; color: var(--text-muted); font-style: italic; padding: 4px 0; }
        .typing-indicator .dot { animation: blink 1.4s infinite fill-mode; font-weight: bold; }
        .typing-indicator .dot:nth-child(2) { animation-delay: .2s; }
        .typing-indicator .dot:nth-child(3) { animation-delay: .4s; }
        .typing-indicator .dot:nth-child(4) { animation-delay: .6s; }
        @keyframes blink { 0% { opacity: .2; } 20% { opacity: 1; } 100% { opacity: .2; } }
        .message-bubble.is-streaming { border-left: 3px solid var(--btn-primary-bg, #3b82f6); }
        .toast-message { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 500; z-index: 100; }

        .conversation-list { display: flex; flex-direction: column; gap: 4px; padding-top: 8px; }
        .chat-section { display: flex; flex-direction: column; gap: 2px; margin-bottom: 12px; }
        .chat-section-title { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); padding: 6px 8px 4px 8px; letter-spacing: 0.05em; }
        .conversation-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; cursor: pointer; color: var(--text-muted); transition: background-color 0.2s, color 0.2s; user-select: none; width: 100%; box-sizing: border-box; }
        .conversation-item:hover { background-color: var(--hover-overlay); color: var(--text-main); }
        .conversation-item.active { background-color: var(--hover-overlay); color: var(--text-main); font-weight: 500; }
        .chat-icon { flex-shrink: 0; color: var(--text-muted); }
        .conversation-item.active .chat-icon { color: var(--btn-primary-bg, #3b82f6); }
        .chat-title { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.9rem; line-height: 1.4; color: inherit; }
        .chat-rename-input { flex: 1; min-width: 0; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-main); border-radius: 4px; padding: 2px 6px; font-size: 0.9rem; outline: none; }
        .chat-actions, .conversation-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; margin-left: auto; }
        .pin-btn { background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; opacity: 0.4; transition: opacity 0.2s, color 0.2s; }
        .conversation-item:hover .pin-btn, .pin-btn.is-pinned { opacity: 1; }
        .pin-btn.is-pinned { color: var(--btn-primary-bg, #3b82f6); opacity: 1; }
        .pin-btn:hover { background-color: var(--hover-overlay); color: var(--text-main); }

        .conversation-menu-container { position: relative; display: flex; align-items: center; }
        .menu-trigger-btn { background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; opacity: 0.4; transition: opacity 0.2s, color 0.2s; }
        .conversation-item:hover .menu-trigger-btn, .menu-trigger-btn:focus, .menu-trigger-btn.active { opacity: 1; }
        .menu-trigger-btn:hover { background-color: var(--hover-overlay); color: var(--text-main); opacity: 1; }

        .chat-menu-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 4px);
          background-color: var(--bg-card, #15171E);
          border: 1px solid var(--border-color, rgba(255,255,255,0.1));
          border-radius: 8px;
          padding: 4px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
          z-index: 100;
          min-width: 120px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .chat-menu-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          font-size: 0.85rem;
          color: var(--text-main, #ffffff);
          background: transparent;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: background-color 0.15s ease, color 0.15s ease;
        }

        .chat-menu-item:hover {
          background-color: var(--hover-overlay, rgba(255, 255, 255, 0.08));
        }

        .chat-menu-item.delete {
          color: #ef4444;
        }

        .chat-menu-item.delete:hover {
          background-color: rgba(239, 68, 68, 0.15);
          color: #f87171;
        }
      `}</style>
    </div>
  );
}
