import { useState, useEffect } from 'react';

// Helper function to easily grab token and format headers
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
  }, []);

  // 2. Fetch messages whenever activeChatId changes
  useEffect(() => {
    if (!activeChatId) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chats/${activeChatId}/messages`, { headers: getHeaders() });
        if (res.ok) {
          const data = await res.json();
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
  }, [activeChatId]);

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
    const idsToDelete = Array.isArray(messageId) ? messageId : messageId.toString().split(',').filter(Boolean);
    const idsParam = idsToDelete.join(',');
    try {
      const res = await fetch(`/api/chats/${chatId}/messages/${idsParam}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setChats(prev => prev.map(c => {
          if (c.id === chatId) {
            return {
              ...c,
              messages: c.messages.filter(m => !idsToDelete.includes(m.id))
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
              body { font-family: system-ui, sans-serif; padding: 30px; line-height: 1.6; color: #111; }
              h1 { border-bottom: 2px solid #ccc; padding-bottom: 8px; }
              .msg { margin-bottom: 20px; padding: 12px; border-radius: 8px; background: #f4f4f5; }
              .msg.user { background: #e0f2fe; }
              .meta { font-size: 0.8em; color: #666; font-weight: bold; margin-bottom: 4px; }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            ${chat.messages.map(m => `
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

  /**
   * Add message with Server-Sent Events (SSE) progressive streaming
   */
  const addMessage = async (chatId, role, content, imageFile = null) => {
    if (role === 'ai') return;

    let targetChatId = chatId;
    let createdChatObj = null;

    if (!targetChatId) {
      try {
        const res = await fetch('/api/chats', { method: 'POST', headers: getHeaders() });
        if (res.ok) {
          const newChat = await res.json();
          createdChatObj = { ...newChat, id: newChat._id, messages: [] };
          targetChatId = createdChatObj.id;
          setActiveChatId(targetChatId);
        }
      } catch (error) {
        console.error("Failed to auto-create chat", error);
        return;
      }
    }

    const tempUserMsgId = `user_${Date.now()}`;
    const tempAiMsgId = `ai_${Date.now()}`;
    const localImageUrl = imageFile ? URL.createObjectURL(imageFile) : null;

    const tempUserMessage = {
      id: tempUserMsgId,
      role: 'user',
      content,
      image: localImageUrl,
      createdAt: new Date().toISOString()
    };

    const tempAiMessage = {
      id: tempAiMsgId,
      role: 'ai',
      content: '',
      isStreaming: true,
      createdAt: new Date().toISOString()
    };

    // Optimistically insert User message + Streaming AI placeholder into UI state
    setChats(prev => {
      const exists = prev.some(c => c.id === targetChatId);
      if (exists) {
        return prev.map(c => c.id === targetChatId ? {
          ...c,
          messages: [...c.messages, tempUserMessage, tempAiMessage]
        } : c);
      } else if (createdChatObj) {
        return [{ ...createdChatObj, messages: [tempUserMessage, tempAiMessage] }, ...prev];
      }
      return prev;
    });

    try {
      let bodyData;
      let fetchHeaders = { 'Authorization': `Bearer ${localStorage.getItem('chatAppToken')}` };

      if (imageFile) {
        bodyData = new FormData();
        bodyData.append('content', content || '');
        bodyData.append('image', imageFile);
      } else {
        bodyData = JSON.stringify({ content: content || '' });
        fetchHeaders['Content-Type'] = 'application/json';
      }

      const res = await fetch(`/api/chats/${targetChatId}/messages/stream`, {
        method: 'POST',
        headers: fetchHeaders,
        body: bodyData
      });

      if (!res.ok) {
        let errMessage = "Failed to communicate with AI stream.";
        try {
          const errData = await res.json();
          errMessage = errData.message || errMessage;
        } catch (_) {}

        setChats(prev => prev.map(c => {
          if (c.id === targetChatId) {
            return {
              ...c,
              messages: c.messages.map(m => m.id === tempAiMsgId ? {
                ...m,
                content: `⚠️ Error: ${errMessage}`,
                isStreaming: false
              } : m)
            };
          }
          return c;
        }));
        return;
      }

      // Stream Reader setup
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process SSE lines
        const lines = buffer.split("\n\n");
        buffer = lines.pop(); // Keep last incomplete chunk in buffer

        for (const block of lines) {
          if (!block.trim()) continue;

          let eventName = "message";
          let eventDataRaw = "";

          const blockLines = block.split("\n");
          for (const line of blockLines) {
            if (line.startsWith("event: ")) {
              eventName = line.substring(7).trim();
            } else if (line.startsWith("data: ")) {
              eventDataRaw = line.substring(6).trim();
            }
          }

          if (!eventDataRaw) continue;

          try {
            const data = JSON.parse(eventDataRaw);

            if (eventName === 'user_message') {
              const realUserMsg = data.userMessage;
              setChats(prev => prev.map(c => c.id === targetChatId ? {
                ...c,
                messages: c.messages.map(m => m.id === tempUserMsgId ? { ...realUserMsg, id: realUserMsg._id } : m)
              } : c));

            } else if (eventName === 'delta') {
              const deltaText = data.delta || '';
              setChats(prev => prev.map(c => {
                if (c.id === targetChatId) {
                  return {
                    ...c,
                    messages: c.messages.map(m => m.id === tempAiMsgId ? {
                      ...m,
                      content: m.content + deltaText
                    } : m)
                  };
                }
                return c;
              }));

            } else if (eventName === 'done') {
              const { aiMessage, chatTitle } = data;
              setChats(prev => prev.map(c => {
                if (c.id === targetChatId) {
                  return {
                    ...c,
                    title: chatTitle || c.title,
                    messages: c.messages.map(m => m.id === tempAiMsgId ? {
                      ...aiMessage,
                      id: aiMessage._id,
                      isStreaming: false
                    } : m)
                  };
                }
                return c;
              }));

            } else if (eventName === 'error') {
              const errMsg = data.message || 'An error occurred during AI generation.';
              setChats(prev => prev.map(c => {
                if (c.id === targetChatId) {
                  return {
                    ...c,
                    messages: c.messages.map(m => m.id === tempAiMsgId ? {
                      ...m,
                      content: `⚠️ ${errMsg}`,
                      isStreaming: false
                    } : m)
                  };
                }
                return c;
              }));
            }
          } catch (pErr) {
            console.error("Failed to parse SSE JSON:", pErr, eventDataRaw);
          }
        }
      }

    } catch (error) {
      console.error("Streaming error:", error);
      setChats(prev => prev.map(c => {
        if (c.id === targetChatId) {
          return {
            ...c,
            messages: c.messages.map(m => m.id === tempAiMsgId ? {
              ...m,
              content: `⚠️ Network error: ${error.message}`,
              isStreaming: false
            } : m)
          };
        }
        return c;
      }));
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