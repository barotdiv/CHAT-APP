import React, { useState, useEffect, useRef } from 'react';
import { ChatComposer, ChatSendButton, Button } from '@astryxdesign/core';
import { Mic, ImagePlus, X, Copy, RotateCcw, Edit2, Play, Square, Settings, ShieldAlert, Sparkles, Code, Mail, Lightbulb, HelpCircle } from 'lucide-react';
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
    chats, activeChatId, activeChat, setActiveChatId,
    isTemporaryChat, startTemporaryChat, exitTemporaryChat,
    createNewChat, deleteChat, renameChat, togglePinChat, addMessage, deleteMessage, duplicateChat, exportChat,
    stopGenerating, regenerateMessage, editUserMessage, continueResponse, setChatModel, setChatSystemPrompt
  } = useConversations();

  const { settings } = useSettings();
  const messages = activeChat?.messages || [];
  const isStreamingAny = messages.some(m => m.isStreaming);

  const [input, setInput] = useState('');
  const [baseInput, setBaseInput] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editText, setEditText] = useState('');
  const [showSystemPromptModal, setShowSystemPromptModal] = useState(false);
  const [systemPromptInput, setSystemPromptInput] = useState('');

  const chatHistoryRef = useRef(null);
  const fileInputRef = useRef(null);
  const [toastMessage, setToastMessage] = useState('');

  const { isListening, transcript, isSupported, error, toggleListening } = useSpeechRecognition();
  const prevListening = useRef(false);
  const prevMessageCount = useRef(messages.length);

  useEffect(() => {
    if (activeChat) {
      setSystemPromptInput(activeChat.systemInstruction || '');
    }
  }, [activeChatId, activeChat?.systemInstruction]);

  const handleCopyMessage = (content) => {
    if (navigator.clipboard && content) {
      navigator.clipboard.writeText(content);
      showToast('Copied to clipboard');
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  useEffect(() => {
    if (isListening && !prevListening.current) setBaseInput(input);
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

  const handleSaveSystemPrompt = () => {
    if (activeChat) {
      setChatSystemPrompt(activeChat.id, systemPromptInput);
      setShowSystemPromptModal(false);
      showToast('System instructions updated');
    }
  };

  const handleSaveEditUserMessage = async (msgId) => {
    if (!editText.trim()) return;
    setEditingMsgId(null);
    try {
      await editUserMessage(activeChatId, msgId, editText);
    } catch (err) {
      showToast('Failed to edit message');
    }
  };

  let composerStatus = undefined;
  if (!isSupported && settings.voiceInput) {
    composerStatus = { type: 'warning', message: 'Speech recognition is not supported in this browser.' };
  } else if (error && settings.voiceInput) {
    composerStatus = { type: 'error', message: error };
  }

  const SUGGESTED_PROMPTS = [
    { icon: <Code size={20} />, title: "Write a script", prompt: "Write a Python script to scrape top news headlines" },
    { icon: <HelpCircle size={20} />, title: "Explain a concept", prompt: "Explain Quantum Computing in simple terms" },
    { icon: <Mail size={20} />, title: "Draft an email", prompt: "Draft a polite follow-up email to a job interviewer" },
    { icon: <Lightbulb size={20} />, title: "Brainstorm ideas", prompt: "Give me 5 innovative SaaS business ideas for 2026" }
  ];

  return (
    <div className={`layout-container font-size-${settings.fontSize}`}>
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={createNewChat}
        onTemporaryChat={startTemporaryChat}
        onSelectChat={setActiveChatId}
        onRenameChat={renameChat}
        onDeleteChat={deleteChat}
        onTogglePin={togglePinChat}
        onDuplicateChat={duplicateChat}
        onExportChat={exportChat}
      />

      <div className="chat-container">
        {/* Header Toolbar */}
        <div className="chat-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 className="chat-header-title">{activeChat?.title || 'New Chat'}</h3>
            {isTemporaryChat && (
              <span className="incognito-badge">
                <ShieldAlert size={14} /> Incognito Mode
              </span>
            )}
          </div>
          <div className="chat-header-actions">
            {/* Model Selector */}
            <select
              className="model-select-dropdown"
              value={activeChat?.model || 'gemini-2.5-flash'}
              onChange={(e) => setChatModel(activeChatId, e.target.value)}
              title="Select AI Model"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast)</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Reasoning)</option>
            </select>

            {/* Custom System Prompt Button */}
            <button
              className="header-action-btn"
              title="System Instructions"
              onClick={() => setShowSystemPromptModal(true)}
            >
              <Settings size={16} />
            </button>

            {isTemporaryChat && (
              <button
                className="header-action-btn danger"
                title="Exit Incognito"
                onClick={exitTemporaryChat}
              >
                Exit Incognito
              </button>
            )}
          </div>
        </div>

        {/* Chat History Container */}
        <div className="chat-history" ref={chatHistoryRef}>
          {messages.length === 0 ? (
            <div className="empty-chat-welcome">
              <div className="welcome-logo">
                <Sparkles size={40} color="var(--btn-primary-bg, #3b82f6)" />
              </div>
              <h2>How can NovaAI help you today?</h2>
              <p>Select a suggested prompt below or type your request.</p>

              <div className="suggested-prompts-grid">
                {SUGGESTED_PROMPTS.map((card, idx) => (
                  <div
                    key={idx}
                    className="suggested-prompt-card"
                    onClick={() => handleSend(card.prompt)}
                  >
                    <div className="card-icon">{card.icon}</div>
                    <div className="card-title">{card.title}</div>
                    <div className="card-desc">{card.prompt}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
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
                          title="Edit message"
                          onClick={() => {
                            setEditingMsgId(msg.id);
                            setEditText(msg.content);
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
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
                          <img src={msg.image} alt="Uploaded attachment" className="message-image" />
                        )}

                        {editingMsgId === msg.id ? (
                          <div className="inline-edit-box">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="edit-textarea"
                            />
                            <div className="edit-actions">
                              <Button size="sm" variant="ghost" onClick={() => setEditingMsgId(null)}>Cancel</Button>
                              <Button size="sm" variant="primary" onClick={() => handleSaveEditUserMessage(msg.id)}>Submit & Resend</Button>
                            </div>
                          </div>
                        ) : (
                          msg.content
                        )}

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
                          <img src={msg.image} alt="Uploaded attachment" className="message-image" />
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
                                const match = /language-(\w+)/.exec(className || '');
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
                                );
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

                      {!msg.isStreaming && (
                        <div className="message-actions-container">
                          <button
                            className="msg-action-btn"
                            title="Regenerate response"
                            onClick={() => regenerateMessage(activeChatId, msg.id)}
                          >
                            <RotateCcw size={14} />
                          </button>
                          <button
                            className="msg-action-btn"
                            title="Continue response"
                            onClick={() => continueResponse(activeChatId, msg.id)}
                          >
                            <Play size={14} />
                          </button>
                          <button
                            className="msg-action-btn"
                            title="Copy response"
                            onClick={() => handleCopyMessage(msg.content)}
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Input Composer Area */}
        <div className="chat-input-area">
          {/* Stop Generating Floating Action */}
          {isStreamingAny && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={stopGenerating}
                style={{ backgroundColor: 'var(--bg-card)', borderColor: '#ef4444', color: '#ef4444' }}
              >
                <Square size={14} style={{ marginRight: '6px' }} />
                <span>Stop Generating</span>
              </Button>
            </div>
          )}

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

      {/* System Prompt Modal */}
      {showSystemPromptModal && (
        <div className="modal-overlay" onClick={() => setShowSystemPromptModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Custom System Instructions</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Set custom system guidelines for NovaAI to follow in this conversation.
            </p>
            <textarea
              className="system-prompt-textarea"
              placeholder="e.g. You are a senior Python developer. Provide clean, concise code with comments."
              value={systemPromptInput}
              onChange={(e) => setSystemPromptInput(e.target.value)}
              rows={5}
            />
            <div className="modal-actions">
              <Button variant="ghost" onClick={() => setShowSystemPromptModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveSystemPrompt}>Save Instructions</Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-message">
          {toastMessage}
        </div>
      )}

      <style>{`
        .incognito-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          font-size: 0.75rem;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 500;
        }

        .model-select-dropdown {
          background: var(--bg-input, #1e1e24);
          color: var(--text-main, #fff);
          border: 1px solid var(--border-color, #333);
          border-radius: 6px;
          padding: 6px 10px;
          font-size: 0.85rem;
          outline: none;
          cursor: pointer;
        }

        .empty-chat-welcome {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          padding: 32px;
          color: var(--text-main);
        }

        .welcome-logo {
          margin-bottom: 16px;
          padding: 16px;
          border-radius: 50%;
          background: var(--hover-overlay, rgba(255,255,255,0.05));
        }

        .suggested-prompts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          width: 100%;
          max-width: 680px;
          margin-top: 24px;
        }

        .suggested-prompt-card {
          background: var(--bg-card, #18181b);
          border: 1px solid var(--border-color, #27272a);
          border-radius: 12px;
          padding: 16px;
          text-align: left;
          cursor: pointer;
          transition: transform 0.2s, border-color 0.2s;
        }

        .suggested-prompt-card:hover {
          transform: translateY(-2px);
          border-color: var(--btn-primary-bg, #3b82f6);
        }

        .card-icon {
          color: var(--btn-primary-bg, #3b82f6);
          margin-bottom: 8px;
        }

        .card-title {
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 4px;
        }

        .card-desc {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .inline-edit-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }

        .edit-textarea {
          width: 100%;
          background: var(--bg-input, #27272a);
          color: var(--text-main);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 8px;
          font-size: 0.9rem;
          resize: vertical;
          min-height: 60px;
        }

        .edit-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .modal-content {
          background: var(--bg-card, #18181b);
          border: 1px solid var(--border-color, #27272a);
          border-radius: 12px;
          padding: 24px;
          width: 90%;
          max-width: 500px;
          color: var(--text-main);
        }

        .system-prompt-textarea {
          width: 100%;
          background: var(--bg-input, #27272a);
          color: var(--text-main);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 12px;
          font-size: 0.9rem;
          box-sizing: border-box;
          margin-bottom: 16px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .font-size-small .message-bubble { font-size: 0.85rem !important; }
        .font-size-medium .message-bubble { font-size: 0.95rem !important; }
        .font-size-large .message-bubble { font-size: 1.1rem !important; }

        .layout-container { display: flex; height: 100%; width: 100%; overflow: hidden; background-color: var(--bg-app); }
        .chat-header-bar { display: flex; align-items: center; justify-content: space-between; padding: 12px 32px; border-bottom: 1px solid var(--border-color); background-color: var(--bg-app); z-index: 10; }
        .chat-header-title { font-size: 1.05rem; font-weight: 600; margin: 0; color: var(--text-main); }
        .chat-header-actions { display: flex; align-items: center; gap: 8px; }
        .header-action-btn { background: transparent; border: 1px solid var(--border-color); color: var(--text-muted); border-radius: 6px; padding: 6px 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .header-action-btn:hover { background-color: var(--hover-overlay); color: var(--text-main); }
        .header-action-btn.danger:hover { color: #ef4444; border-color: #ef4444; }
        .sidebar-container { width: 280px; height: 100%; background-color: var(--bg-card); border-right: 1px solid var(--border-color); display: flex; flex-direction: column; flex-shrink: 0; transition: transform 0.3s ease; z-index: 40; box-sizing: border-box; }
        .sidebar-header { padding: 16px; display: flex; flex-direction: column; gap: 12px; box-sizing: border-box; }
        .sidebar-title { font-size: 1.15rem; font-weight: 600; margin: 0; color: var(--text-main); }
        .new-chat-btn { width: 100% !important; border-radius: 8px !important; }
        .sidebar-header > div { width: 100%; }
        .sidebar-header button { box-sizing: border-box; min-height: 40px; }
        .sidebar-search { padding: 0 16px 16px; box-sizing: border-box; }
        .search-input-wrapper, .search-input { width: 100%; box-sizing: border-box; }
        .sidebar-scroll-area { flex: 1; min-height: 0; min-width: 0; overflow-y: auto; padding: 0 16px 16px; box-sizing: border-box; }
        .conversation-list, .chat-section { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .chat-section + .chat-section { margin-top: 16px; }
        .chat-section-title { padding: 0 8px 6px; color: var(--text-faded); font-size: 0.72rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
        .conversation-item { display: flex; align-items: center; gap: 10px; width: 100%; min-width: 0; padding: 10px 8px; box-sizing: border-box; border: 1px solid transparent; border-radius: 8px; color: var(--text-main); cursor: pointer; }
        .conversation-item:hover, .conversation-item.active { background-color: var(--hover-overlay); border-color: var(--border-color); }
        .chat-icon { flex: 0 0 auto; color: var(--text-muted); }
        .chat-info { flex: 1 1 auto; min-width: 0; overflow: hidden; }
        .chat-title, .chat-time { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .chat-title { font-size: 0.88rem; }
        .chat-time { margin-top: 3px; color: var(--text-faded); font-size: 0.72rem; }
        .chat-actions { display: flex; align-items: center; flex: 0 0 auto; gap: 2px; }
        .pin-btn { display: flex; align-items: center; justify-content: center; padding: 4px; border: 0; border-radius: 4px; background: transparent; color: var(--text-faded); cursor: pointer; }
        .pin-btn:hover, .pin-btn.is-pinned { color: var(--text-main); background-color: var(--hover-overlay); }
        .chat-rename-input { width: 100%; min-width: 0; box-sizing: border-box; }
        .empty-list { padding: 20px 8px; color: var(--text-muted); font-size: 0.85rem; text-align: center; }
        .mobile-menu-btn, .mobile-close-btn, .sidebar-overlay { display: none; }
        .chat-container { flex: 1; display: flex; flex-direction: column; background-color: transparent; position: relative; min-width: 0; }
        .chat-history { flex: 1; overflow-y: auto; padding: 24px 32px; display: flex; flex-direction: column; gap: 20px; scroll-behavior: smooth; }
        @media (min-width: 769px) { .chat-history { max-width: 800px; margin: 0 auto; width: 100%; } .chat-input-area { max-width: 800px; margin: 0 auto; width: 100%; } }
        .date-divider { display: flex; align-items: center; justify-content: center; gap: 16px; margin: 16px 0 24px; }
        .divider-line { height: 1px; flex: 0.15; background-color: var(--border-highlight); }
        .divider-text { font-size: 0.85rem; color: var(--text-muted); font-weight: 500; }
        .message-row { display: flex; width: 100%; align-items: flex-start; gap: 8px; }
        .message-row.user { justify-content: flex-end; }
        .message-row.ai { justify-content: flex-start; }
        .message-bubble { line-height: 1.6; max-width: 70%; word-break: break-word; padding: 12px 16px; border-radius: 12px; }
        .message-bubble.user { background: var(--btn-primary-bg, #3b82f6); color: #fff; border-bottom-right-radius: 2px; }
        .message-bubble.ai { background: var(--bg-card, #18181b); color: var(--text-main); border-bottom-left-radius: 2px; border: 1px solid var(--border-color); }
        .message-actions-container { display: flex; align-items: center; gap: 4px; opacity: 0; transition: opacity 0.2s; margin-top: 4px; }
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
      `}</style>
    </div>
  );
}
