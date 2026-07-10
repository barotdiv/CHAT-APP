import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Button } from '@astryxdesign/core/Button';

export default function ChatInterface() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'ai', content: 'Hello! I am your AI assistant. How can I help you build amazing tools today?' }
  ]);
  const [input, setInput] = useState('');
  const chatHistoryRef = useRef(null);

  const scrollToBottom = () => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    
    const userMsg = { id: Date.now(), role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    
    setTimeout(() => {
      setMessages((prev) => [
        ...prev, 
        { id: Date.now() + 1, role: 'ai', content: 'That sounds like a great idea. I can certainly help you implement the backend logic for that.' }
      ]);
    }, 1000);
  };

  return (
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
        <form onSubmit={handleSend} className="input-form">
          <div className="input-wrapper">
            <TextInput 
              label="Ask something..." 
              isLabelHidden
              placeholder="Ask something..." 
              value={input}
              onChange={setInput}
            />
          </div>
          <div className="send-btn-wrapper">
            <Button 
              type="submit" 
              variant="primary" 
              label="Send"
              icon={<ArrowUp size={18} strokeWidth={3} />} 
              isIconOnly
              isDisabled={!input.trim()}
              className="send-btn"
            />
          </div>
        </form>
      </div>

      <style>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          background-color: #15171e;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
          overflow: hidden;
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
          background-color: #16A34A;
          color: #ffffff;
          border-radius: 24px;
          padding: 12px 20px;
        }
        .chat-input-area {
          padding: 24px 32px;
          background-color: transparent;
        }
        .input-form {
          position: relative;
          background-color: #1A1C23;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 16px 60px 16px 24px;
          min-height: 72px;
          display: flex;
          align-items: center;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-form:focus-within {
          border-color: #16A34A;
          box-shadow: 0 0 0 1px #16A34A;
        }
        .input-wrapper {
          flex: 1;
          width: 100%;
        }
        /* Override Astryx TextInput base styles */
        .input-wrapper :global(.astryx-text-input-field) {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          color: #fff !important;
          font-size: 1rem !important;
        }
        .input-wrapper :global(.astryx-text-input-field:focus) {
          box-shadow: none !important;
        }
        .input-wrapper :global(.astryx-text-input-field::placeholder) {
          color: rgba(255, 255, 255, 0.4) !important;
        }
        .send-btn-wrapper {
          position: absolute;
          right: 12px;
          bottom: 12px;
        }
        .send-btn {
          background-color: #16A34A !important;
          color: #ffffff !important;
          border-radius: 50% !important;
          width: 40px !important;
          height: 40px !important;
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: transform 0.2s ease, background-color 0.2s !important;
        }
        .send-btn:hover:not(:disabled) {
          background-color: #15803d !important;
          transform: scale(1.05);
        }
        .send-btn:disabled {
          opacity: 0.5 !important;
          cursor: not-allowed !important;
          background-color: rgba(255, 255, 255, 0.1) !important;
          color: rgba(255, 255, 255, 0.3) !important;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
