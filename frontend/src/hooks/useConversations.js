import { useState, useEffect, useRef } from 'react';

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
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [temporaryChat, setTemporaryChat] = useState(null);
  const abortControllerRef = useRef(null);

  // 1. Fetch all chats on initial load
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await fetch('/api/chats', { headers: getHeaders() });
        if (res.ok) {
          const data = await res.json();
          const formattedChats = data.map(chat => ({
            ...chat,
            id: chat._id,
            messages: [],
            model: chat.model || 'gemini-2.5-flash',
            systemInstruction: chat.systemInstruction || '',
            folder: chat.folder || 'General'
          }));
          setChats(formattedChats);

          if (formattedChats.length > 0 && !activeChatId && !isTemporaryChat) {
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
    if (!activeChatId || isTemporaryChat) return;

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
  }, [activeChatId, isTemporaryChat]);

  // Create Temporary Incognito Chat
  const startTemporaryChat = () => {
    const tempId = `temp_${Date.now()}`;
    const newTempChat = {
      id: tempId,
      _id: tempId,
      title: 'Temporary Chat (Incognito)',
      isTemporary: true,
      messages: [],
      model: 'gemini-2.5-flash',
      systemInstruction: '',
      folder: 'Temporary'
    };
    setTemporaryChat(newTempChat);
    setIsTemporaryChat(true);
    setActiveChatId(tempId);
  };

  const exitTemporaryChat = () => {
    setIsTemporaryChat(false);
    setTemporaryChat(null);
    if (chats.length > 0) {
      setActiveChatId(chats[0].id);
    }
  };

  // Create a New Chat
  const createNewChat = async (model = 'gemini-2.5-flash', systemInstruction = '', folder = 'General') => {
    if (isTemporaryChat) {
      exitTemporaryChat();
    }
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ title: 'New Chat', model, systemInstruction, folder })
      });
      if (res.ok) {
        const newChat = await res.json();
        const formattedChat = {
          ...newChat,
          id: newChat._id,
          messages: [],
          model: newChat.model || model,
          systemInstruction: newChat.systemInstruction || systemInstruction,
          folder: newChat.folder || folder
        };

        setChats(prev => [formattedChat, ...prev]);
        setActiveChatId(formattedChat.id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Delete a Chat
  const deleteChat = async (id) => {
    if (isTemporaryChat && activeChatId === id) {
      exitTemporaryChat();
      return;
    }
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

  // Update Chat Metadata (Title, Model, System Prompt, Folder, Pin)
  const updateChatMetadata = async (id, fields) => {
    if (isTemporaryChat && activeChatId === id) {
      setTemporaryChat(prev => ({ ...prev, ...fields }));
      return;
    }
    try {
      const res = await fetch(`/api/chats/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(fields)
      });
      if (res.ok) {
        const updated = await res.json();
        setChats(prev => prev.map(c => c.id === id ? {
          ...c,
          ...fields,
          title: updated.title || c.title
        } : c));
      }
    } catch (error) {
      console.error("Error updating chat metadata:", error);
    }
  };

  const renameChat = (id, newTitle) => updateChatMetadata(id, { title: newTitle });
  const togglePinChat = (id) => {
    const chat = chats.find(c => c.id === id);
    if (chat) updateChatMetadata(id, { isPinned: !chat.isPinned });
  };
  const setChatModel = (id, model) => updateChatMetadata(id, { model });
  const setChatSystemPrompt = (id, systemInstruction) => updateChatMetadata(id, { systemInstruction });
  const setChatFolder = (id, folder) => updateChatMetadata(id, { folder });

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
    if (isTemporaryChat && activeChatId === chatId) {
      const idsToDelete = Array.isArray(messageId) ? messageId : messageId.toString().split(',');
      setTemporaryChat(prev => ({
        ...prev,
        messages: prev.messages.filter(m => !idsToDelete.includes(m.id))
      }));
      return;
    }
    const idsToDelete = Array.isArray(messageId) ? messageId : messageId.toString().split(',').filter(Boolean);
    try {
      const res = await fetch(`/api/chats/${chatId}/messages/${idsToDelete.join(',')}`, {
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

  // Stop active stream generation
  const stopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  /**
   * Helper to parse SSE stream response body
   */
  const readSSEStream = async (res, targetChatId, tempAiMsgId, tempUserMsgId = null) => {
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    const updateMessagesState = (updater) => {
      if (isTemporaryChat && activeChatId === targetChatId) {
        setTemporaryChat(prev => ({ ...prev, messages: updater(prev.messages) }));
      } else {
        setChats(prev => prev.map(c => c.id === targetChatId ? { ...c, messages: updater(c.messages) } : c));
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop();

      for (const block of lines) {
        if (!block.trim()) continue;

        let eventName = "message";
        let eventDataRaw = "";

        for (const line of block.split("\n")) {
          if (line.startsWith("event: ")) eventName = line.substring(7).trim();
          else if (line.startsWith("data: ")) eventDataRaw = line.substring(6).trim();
        }

        if (!eventDataRaw) continue;

        try {
          const data = JSON.parse(eventDataRaw);

          if (eventName === 'user_message' && tempUserMsgId) {
            const realUserMsg = data.userMessage;
            updateMessagesState(msgs => msgs.map(m => m.id === tempUserMsgId ? { ...realUserMsg, id: realUserMsg._id } : m));

          } else if (eventName === 'delta') {
            const deltaText = data.delta || '';
            updateMessagesState(msgs => msgs.map(m => m.id === tempAiMsgId ? { ...m, content: m.content + deltaText } : m));

          } else if (eventName === 'done') {
            const { aiMessage, chatTitle, deletedIds } = data;
            setChats(prev => prev.map(c => {
              if (c.id === targetChatId) {
                let currentMsgs = c.messages;
                if (deletedIds && deletedIds.length > 0) {
                  const delStrIds = deletedIds.map(id => id.toString());
                  currentMsgs = currentMsgs.filter(m => !delStrIds.includes(m.id.toString()));
                }
                return {
                  ...c,
                  title: chatTitle || c.title,
                  messages: currentMsgs.map(m => m.id === tempAiMsgId ? { ...aiMessage, id: aiMessage._id, isStreaming: false } : m)
                };
              }
              return c;
            }));

          } else if (eventName === 'error') {
            updateMessagesState(msgs => msgs.map(m => m.id === tempAiMsgId ? {
              ...m,
              content: `⚠️ ${data.message || 'An error occurred'}`,
              isStreaming: false
            } : m));
          }
        } catch (pErr) {
          console.error("Failed to parse SSE JSON:", pErr);
        }
      }
    }
  };

  /**
   * Add message with Server-Sent Events (SSE) progressive streaming
   */
  const addMessage = async (chatId, role, content, imageFile = null) => {
    if (role === 'ai') return;

    let targetChatId = chatId;
    let createdChatObj = null;

    if (!targetChatId && !isTemporaryChat) {
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

    const tempUserMessage = { id: tempUserMsgId, role: 'user', content, image: localImageUrl, createdAt: new Date().toISOString() };
    const tempAiMessage = { id: tempAiMsgId, role: 'ai', content: '', isStreaming: true, createdAt: new Date().toISOString() };

    if (isTemporaryChat) {
      setTemporaryChat(prev => ({
        ...prev,
        messages: [...(prev?.messages || []), tempUserMessage, tempAiMessage]
      }));
    } else {
      setChats(prev => {
        const exists = prev.some(c => c.id === targetChatId);
        if (exists) {
          return prev.map(c => c.id === targetChatId ? { ...c, messages: [...c.messages, tempUserMessage, tempAiMessage] } : c);
        } else if (createdChatObj) {
          return [{ ...createdChatObj, messages: [tempUserMessage, tempAiMessage] }, ...prev];
        }
        return prev;
      });
    }

    abortControllerRef.current = new AbortController();

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
        body: bodyData,
        signal: abortControllerRef.current.signal
      });

      if (res.ok) {
        await readSSEStream(res, targetChatId, tempAiMsgId, tempUserMsgId);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log("Streaming aborted by user");
        const updateFn = msgs => msgs.map(m => m.id === tempAiMsgId ? { ...m, isStreaming: false } : m);
        if (isTemporaryChat) setTemporaryChat(prev => ({ ...prev, messages: updateFn(prev.messages) }));
        else setChats(prev => prev.map(c => c.id === targetChatId ? { ...c, messages: updateFn(c.messages) } : c));
      } else {
        console.error("Streaming error:", error);
      }
    }
  };

  /**
   * Regenerate Response
   */
  const regenerateMessage = async (chatId, messageId) => {
    const tempAiMsgId = `ai_regen_${Date.now()}`;
    const tempAiMessage = { id: tempAiMsgId, role: 'ai', content: '', isStreaming: true, createdAt: new Date().toISOString() };

    setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: [...c.messages, tempAiMessage] } : c));

    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch(`/api/chats/${chatId}/messages/${messageId}/regenerate`, {
        method: 'POST',
        headers: getHeaders(),
        signal: abortControllerRef.current.signal
      });

      if (res.ok) {
        await readSSEStream(res, chatId, tempAiMsgId);
      }
    } catch (error) {
      console.error("Regenerate error:", error);
    }
  };

  /**
   * Edit User Message & Resend
   */
  const editUserMessage = async (chatId, messageId, newContent) => {
    const tempAiMsgId = `ai_edit_${Date.now()}`;
    const tempAiMessage = { id: tempAiMsgId, role: 'ai', content: '', isStreaming: true, createdAt: new Date().toISOString() };

    setChats(prev => prev.map(c => {
      if (c.id === chatId) {
        const msgIdx = c.messages.findIndex(m => m.id === messageId);
        const kept = msgIdx !== -1 ? c.messages.slice(0, msgIdx) : c.messages;
        return {
          ...c,
          messages: [...kept, { id: messageId, role: 'user', content: newContent }, tempAiMessage]
        };
      }
      return c;
    }));

    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch(`/api/chats/${chatId}/messages/${messageId}/edit`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ content: newContent }),
        signal: abortControllerRef.current.signal
      });

      if (res.ok) {
        await readSSEStream(res, chatId, tempAiMsgId);
      }
    } catch (error) {
      console.error("Edit user message error:", error);
    }
  };

  /**
   * Continue Response
   */
  const continueResponse = async (chatId, messageId) => {
    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch(`/api/chats/${chatId}/messages/${messageId}/continue`, {
        method: 'POST',
        headers: getHeaders(),
        signal: abortControllerRef.current.signal
      });

      if (res.ok) {
        await readSSEStream(res, chatId, messageId);
      }
    } catch (error) {
      console.error("Continue response error:", error);
    }
  };

  const exportChat = (chatId, format = 'txt') => {
    const chat = (isTemporaryChat && temporaryChat?.id === chatId)
      ? temporaryChat
      : chats.find(c => c.id === chatId);

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
    } else {
      content = `${title.toUpperCase()}\nExported from NovaAI\n${'='.repeat(40)}\n\n`;
      chat.messages.forEach(msg => {
        const sender = msg.role === 'user' ? 'User' : 'NovaAI';
        const time = msg.createdAt ? new Date(msg.createdAt).toLocaleString() : '';
        content += `[${time}] ${sender}:\n${msg.content}\n\n${'-'.repeat(30)}\n\n`;
      });
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

  const activeChat = isTemporaryChat
    ? temporaryChat
    : (chats.find(c => c.id === activeChatId) || chats[0]);

  return {
    chats,
    activeChatId,
    activeChat,
    setActiveChatId,
    isTemporaryChat,
    startTemporaryChat,
    exitTemporaryChat,
    createNewChat,
    deleteChat,
    renameChat,
    togglePinChat,
    duplicateChat,
    deleteMessage,
    exportChat,
    addMessage,
    stopGenerating,
    regenerateMessage,
    editUserMessage,
    continueResponse,
    setChatModel,
    setChatSystemPrompt,
    setChatFolder,
  };
};