import { useState, useEffect } from 'react';

// Helper function to easily grab our token and format the headers for every request
const getHeaders = () => {
  const token = localStorage.getItem('chatAppToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const useConversations = () => {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  // 1. Fetch all chats on initial load
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await fetch('/api/chats', { headers: getHeaders() });
        if (res.ok) {
          const data = await res.json();
          // We add an empty 'messages' array to each chat locally so the UI doesn't crash before messages load
          const formattedChats = data.map(chat => ({ ...chat, id: chat._id, messages: [] }));
          setChats(formattedChats);

          if (formattedChats.length > 0 && !activeChatId) {
            setActiveChatId(formattedChats[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    };
    fetchChats();
  }, []); // Only runs once when the app opens

  // 2. Fetch messages whenever the user clicks on a different chat
  useEffect(() => {
    if (!activeChatId) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chats/${activeChatId}/messages`, { headers: getHeaders() });
        if (res.ok) {
          const data = await res.json();

          // Update the specific chat in our local state to contain these downloaded messages
          setChats(prev => prev.map(c => {
            if (c.id === activeChatId) {
              return { ...c, messages: data.map(m => ({ ...m, id: m._id })) };
            }
            return c;
          }));
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    fetchMessages();
  }, [activeChatId]); // Runs every time activeChatId changes

  // 3. Create a New Chat
  const createNewChat = async () => {
    try {
      const res = await fetch('/api/chats', { method: 'POST', headers: getHeaders() });
      if (res.ok) {
        const newChat = await res.json();
        const formattedChat = { ...newChat, id: newChat._id, messages: [] };

        setChats(prev => [formattedChat, ...prev]);
        setActiveChatId(formattedChat.id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 4. Delete a Chat
  const deleteChat = async (id) => {
    try {
      const res = await fetch(`/api/chats/${id}`, { method: 'DELETE', headers: getHeaders() });
      if (res.ok) {
        setChats(prev => prev.filter(c => c.id !== id));
        if (activeChatId === id) setActiveChatId(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 5. Rename a Chat
  const renameChat = async (id, newTitle) => {
    try {
      const res = await fetch(`/api/chats/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ title: newTitle })
      });
      if (res.ok) {
        setChats(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 6. Pin a Chat
  const togglePinChat = async (id) => {
    const chat = chats.find(c => c.id === id);
    if (!chat) return;
    try {
      const res = await fetch(`/api/chats/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ isPinned: !chat.isPinned })
      });
      if (res.ok) {
        setChats(prev => prev.map(c => c.id === id ? { ...c, isPinned: !c.isPinned } : c));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const addMessage = async (chatId, role, content) => {
    if (role === 'ai') return;

    // If the user hasn't created a chat yet, let's automatically create one for them!
    let targetChatId = chatId;
    let isFirstMessage = false;
    
    if (!targetChatId) {
      try {
        const res = await fetch('/api/chats', { method: 'POST', headers: getHeaders() });
        if (res.ok) {
          const newChat = await res.json();
          const formattedChat = { ...newChat, id: newChat._id, messages: [] };
          setChats(prev => [formattedChat, ...prev]);
          setActiveChatId(formattedChat.id);
          targetChatId = formattedChat.id; // Use the new chat ID
          isFirstMessage = true;
        }
      } catch (error) {
        console.error("Failed to auto-create chat", error);
        return;
      }
    } else {
      // Check if this is an existing empty chat named 'New Chat'
      const chat = chats.find(c => c.id === targetChatId);
      if (chat && (chat.title === 'New Chat' || chat.title === '') && chat.messages.length === 0) {
        isFirstMessage = true;
      }
    }

    if (isFirstMessage) {
      const generatedTitle = content.length > 30 ? content.substring(0, 30) + '...' : content;
      // Optimistically rename the chat right now
      renameChat(targetChatId, generatedTitle);
    }

    // Optimistically update the UI
    const tempId = Date.now().toString();
    const tempMessage = { id: tempId, role: 'user', content };
    setChats(prev => prev.map(c => {
      if (c.id === targetChatId) return { ...c, messages: [...c.messages, tempMessage] };
      return c;
    }));

    try {
      // Send the real request to the database using targetChatId
      const res = await fetch(`/api/chats/${targetChatId}/messages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ content })
      });

      if (res.ok) {
        const { userMessage, aiMessage } = await res.json();

        setChats(prev => prev.map(c => {
          if (c.id === targetChatId) {
            const filtered = c.messages.filter(m => m.id !== tempId);
            
            const newMessages = [...filtered];
            if (!newMessages.some(m => String(m.id) === String(userMessage._id))) {
              newMessages.push({ ...userMessage, id: userMessage._id });
            }
            if (!newMessages.some(m => String(m.id) === String(aiMessage._id))) {
              newMessages.push({ ...aiMessage, id: aiMessage._id });
            }
            
            return {
              ...c,
              messages: newMessages
            };
          }
          return c;
        }));
      } else {
        const errorData = await res.json();
        console.error("Backend Error:", errorData.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

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
};