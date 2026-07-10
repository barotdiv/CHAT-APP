import { useState, useCallback, useEffect } from 'react';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const STORAGE_KEY = 'chat-app-data';

const defaultChats = [
  {
    id: generateId(),
    title: 'New Chat',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPinned: false,
    messages: [
      { id: generateId(), role: 'ai', content: `Welcome! 👋
I'm your AI assistant. Ask me anything, and I'll help you find answers, solve problems, or build your next idea.`, timestamp: Date.now() }
    ]
  }
];

export function useConversations() {
  const [chats, setChats] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : defaultChats;
    } catch (e) {
      console.error('Failed to load chats from local storage:', e);
      return defaultChats;
    }
  });

  const [activeChatId, setActiveChatId] = useState(chats[0]?.id || defaultChats[0].id);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    } catch (e) {
      console.error('Failed to save chats to local storage:', e);
    }
  }, [chats]);

  const createNewChat = useCallback(() => {
    const newChat = {
      id: generateId(),
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false,
      messages: [
        { id: generateId(), role: 'ai', content: `Welcome! 👋
I'm your AI assistant. Ask me anything, and I'll help you find answers, solve problems, or build your next idea.`, timestamp: Date.now() }
      ]
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  }, []);

  const deleteChat = useCallback((id) => {
    setChats(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (filtered.length === 0) {
        // Automatically create a new chat if all are deleted
        const newChat = {
          id: generateId(),
          title: 'New Chat',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isPinned: false,
          messages: [
            { id: generateId(), role: 'ai', content: `Welcome! 👋
I'm your AI assistant. Ask me anything, and I'll help you find answers, solve problems, or build your next idea.`, timestamp: Date.now() }
          ]
        };
        setActiveChatId(newChat.id);
        return [newChat];
      }
      if (activeChatId === id) {
        setActiveChatId(filtered[0].id);
      }
      return filtered;
    });
  }, [activeChatId]);

  const renameChat = useCallback((id, newTitle) => {
    setChats(prev => prev.map(chat => 
      chat.id === id ? { ...chat, title: newTitle, updatedAt: Date.now() } : chat
    ));
  }, []);

  const togglePinChat = useCallback((id) => {
    setChats(prev => prev.map(chat => 
      chat.id === id ? { ...chat, isPinned: !chat.isPinned, updatedAt: Date.now() } : chat
    ));
  }, []);

  const addMessage = useCallback((chatId, role, content) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        const newMessage = { id: generateId(), role, content, timestamp: Date.now() };
        // Auto-generate title from first user message if it's currently 'New Chat'
        let newTitle = chat.title;
        if (role === 'user' && chat.title === 'New Chat') {
          newTitle = content.length > 30 ? content.substring(0, 30) + '...' : content;
        }
        return {
          ...chat,
          title: newTitle,
          updatedAt: Date.now(),
          messages: [...chat.messages, newMessage]
        };
      }
      return chat;
    }));
  }, []);

  return {
    chats,
    activeChatId,
    setActiveChatId,
    createNewChat,
    deleteChat,
    renameChat,
    togglePinChat,
    addMessage,
  };
}
