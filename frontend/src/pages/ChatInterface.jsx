import React, { useState, useEffect, useRef } from 'react';
import { ChatComposer, ChatSendButton, Button } from '@astryxdesign/core';
import { Mic } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

export default function ChatInterface() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'ai', content: 'Hello! I am your AI assistant. How can I help you build amazing tools today?' }
  ]);
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
  }, [messages]);

  const handleSend = (textOrEvent) => {
    let textToSend = input;
    if (textOrEvent && typeof textOrEvent.preventDefault === 'function') {
      textOrEvent.preventDefault();
    } else if (typeof textOrEvent === 'string') {
      textToSend = textOrEvent;
    }

    if (!textToSend.trim()) return;
    
    const userMsg = { id: Date.now(), role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setBaseInput('');
    
    setTimeout(() => {
      setMessages((prev) => [
        ...prev, 
        { id: Date.now() + 1, role: 'ai', content: 'That sounds like a great idea. I can certainly help you implement the backend logic for that.' }
      ]);
    }, 1000);
  };

  let composerStatus = undefined;
  if (!isSupported) {
    composerStatus = { type: 'warning', message: 'Speech recognition is not supported in this browser.' };
  } else if (error) {
    composerStatus = { type: 'error', message: error };
  }

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
