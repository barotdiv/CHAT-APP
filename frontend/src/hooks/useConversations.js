import { useState, useCallback } from 'react';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export function useConversations() {
  const [chats, setChats] = useState([
    {
      id: generateId(),
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        { id: generateId(), role: 'ai', content: 'Hello! I am your AI assistant. How can I help you build amazing tools today?', timestamp: Date.now() }
      ]
    }
  ]);
  const [activeChatId, setActiveChatId] = useState(chats[0].id);

  const createNewChat = useCallback(() => {
    const newChat = {
      id: generateId(),
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        { id: generateId(), role: 'ai', content: 'Hello! I am your AI assistant. How can I help you build amazing tools today?', timestamp: Date.now() }
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
          messages: [
            { id: generateId(), role: 'ai', content: 'Hello! I am your AI assistant. How can I help you build amazing tools today?', timestamp: Date.now() }
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
    addMessage,
  };
}
