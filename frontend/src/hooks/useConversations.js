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

  const duplicateChat = async (id) => {
    try {
      const res = await fetch(`/api/chats/${id}/duplicate`, { method: 'POST', headers: getHeaders() });
      if (res.ok) {
        const newChat = await res.json();
        const formattedChat = { ...newChat, id: newChat._id, messages: [] };
        setChats(prev => [formattedChat, ...prev]);
        setActiveChatId(formattedChat.id);
      }
    } catch (error) {
      console.error("Error duplicating chat:", error);
    }
  };

  const deleteMessage = async (chatId, messageId) => {
    try {
      const res = await fetch(`api/chats/${chatId}/messages/${messageId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setChats(prev => prev.map(c => {
          if (c.id === chatId) {
            return {
              ...c,
              messages: c.messages.filter(m => m.id !== messageId)
            };
          }
          return c;
        }));
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const exportChat = (chatId, format = 'txt') => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat || !chat.messages.length) return alert("No messages to export.");

    const title = chat.title || "Chat Export";
    let content = "";

    if (format === 'md') {
      content = `# ${title}\n\nExported from NovaAI\n\n---\n\n`;
      chat.messages.forEach(msg => {
        const sender = msg.role === 'user' ? '**User**' : '**NovaAI**';
        const time = msg.createdAt ? new Date(msg.createdAt).toLocaleString() : '';
        content += `### ${sender} (${time})\n${msg.content}\n\n`;
      });
    } else if (format === 'txt' || format === 'pdf') {
      content = `${title.toUpperCase()}\nExported from NovaAI\n${'='.repeat(40)}\n\n`;
      chat.messages.forEach(msg => {
        const sender = msg.role === 'user' ? 'User' : 'NovaAI';
        const time = msg.createdAt ? new Date(msg.createdAt).toLocaleString() : '';
        content += `[${time}] ${sender}:\n${msg.content}\n\n${'-'.repeat(30)}\n\n`;
      });
    }
    if (format === 'pdf') {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>${title} - NovaAI Export</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 30px, line-through: 1.6; color: #111; }
              h1 { border-bottom: 2px solid #ccc; padding-bottom: 8px; }
              .msg { margin-bottom: 20px; padding: 12px; border-radius: 8px; background: #f4f4f5; }
              .msg.user { background: #e0f2fe; }
              .meta { font-size: 0.8em; color: #666; font-weight: bold; margin-bottom: 4px; }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            ${chat.message.map(m => `
              <div class="msg ${m.role}">
                <div class="meta">${m.role === 'user' ? 'User' : 'NovaAI'} (${new Date(m.createdAt || Date.now()).toLocaleString()})</div>
                <div>${m.content}</div>
              </div>
            `).join('')}
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
      return;
    }
    const mimeType = format === 'md' ? 'text/markdown' : 'text/plain';
    const extension = format === 'md' ? '.md' : '.txt';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addMessage = async (chatId, role, content, imageFile = null) => {
    if (role === 'ai') return;

    let targetChatId = chatId;
    if (!targetChatId) {
      try {
        const res = await fetch('/api/chats', { method: 'POST', headers: getHeaders() });
        if (res.ok) {
          const newChat = await res.json();
          const formattedChat = { ...newChat, id: newChat._id, messages: [] };
          setChats(prev => [formattedChat, ...prev]);
          setActiveChatId(formattedChat.id);
          targetChatId = formattedChat.id;
        }
      } catch (error) {
        console.error("Failed to auto-create chat", error);
        return;
      }
    }

    // Optimistically update the UI so it feels fast
    const tempId = Date.now().toString();

    // If we have an image, we can optionally create a local preview URL for the UI!
    let localImageUrl = null;
    if (imageFile) {
      localImageUrl = URL.createObjectURL(imageFile);
    }

    const tempMessage = { id: tempId, role: 'user', content, image: localImageUrl, createdAt: new Date().toISOString() };

    setChats(prev => prev.map(c => {
      if (c.id === targetChatId) return { ...c, messages: [...c.messages, tempMessage] };
      return c;
    }));

    try {
      let bodyData;
      // We start with JUST our Authorization token
      let fetchHeaders = { 'Authorization': `Bearer ${localStorage.getItem('chatAppToken')}` };

      // Did the user attach an image?
      if (imageFile) {
        // Yes! Create a FormData envelope
        bodyData = new FormData();
        bodyData.append('content', content);
        bodyData.append('image', imageFile); // 'image' MUST match the name in upload.single('image')
        // CRITICAL: We DO NOT set the Content-Type header here. The browser does it for us automatically!
      } else {
        bodyData = JSON.stringify({ content });
        fetchHeaders['Content-Type'] = 'application/json';
      }

      // Send the request using our dynamic headers and body
      const res = await fetch(`/api/chats/${targetChatId}/messages`, {
        method: 'POST',
        headers: fetchHeaders,
        body: bodyData
      });

      if (res.ok) {
        const { userMessage, aiMessage, chatTitle } = await res.json();

        setChats(prev => prev.map(c => {
          if (c.id === targetChatId) {
            const filtered = c.messages.filter(m =>
              m.id !== tempId &&
              m.id !== userMessage._id &&
              m.id !== aiMessage._id
            );
            return {
              ...c,
              title: chatTitle || c.title,
              messages: [
                ...filtered,
                { ...userMessage, id: userMessage._id },
                { ...aiMessage, id: aiMessage._id }
              ]
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
    duplicateChat,
    deleteMessage,
    exportChat,
    addMessage,
  };
};