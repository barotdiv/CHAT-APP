import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import { streamChatResponse, formatAIError } from "../services/aiService.js";

export const getChats = async (req, res) => {
    try {
        const chats = (await Chat.find({ userId: req.user._id })).sort({ updatedAt: -1 });
        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createChat = async (req, res) => {
    try {
        const { title, model, systemInstruction, folder } = req.body;
        const chat = await Chat.create({
            userId: req.user._id,
            title: title || 'New Chat',
            model: model || 'gemini-2.5-flash',
            systemInstruction: systemInstruction || '',
            folder: folder || 'General'
        });
        res.status(201).json(chat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateChat = async (req, res) => {
    try {
        const { title, isPinned, model, systemInstruction, folder } = req.body;

        const updateFields = {};
        if (title !== undefined) updateFields.title = title;
        if (isPinned !== undefined) updateFields.isPinned = isPinned;
        if (model !== undefined) updateFields.model = model;
        if (systemInstruction !== undefined) updateFields.systemInstruction = systemInstruction;
        if (folder !== undefined) updateFields.folder = folder;

        const chat = await Chat.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            updateFields,
            { new: true }
        );
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        res.json(chat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteChat = async (req, res) => {
    try {
        const chat = await Chat.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        await Message.deleteMany({ chatId: req.params.id });
        res.json({ message: 'Chat removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const duplicateChat = async (req, res) => {
    try {
        const originalChat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
        if (!originalChat) return res.status(404).json({ message: 'Chat not found' });

        const newChat = await Chat.create({
            userId: req.user._id,
            title: `${originalChat.title} (Copy)`,
            isPinned: false,
            model: originalChat.model,
            systemInstruction: originalChat.systemInstruction,
            folder: originalChat.folder
        });
        const originalMessages = await Message.find({ chatId: req.params.id }).sort({ createdAt: 1 });
        if (originalMessages.length > 0) {
            const newMessages = originalMessages.map(msg => ({
                chatId: newChat._id,
                role: msg.role,
                content: msg.content,
                image: msg.image,
                usage: msg.usage
            }));
            await Message.insertMany(newMessages);
        }
        res.status(201).json(newChat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getMessages = async (req, res) => {
    try {
        const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        const messages = await Message.find({ chatId: req.params.id }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        const ids = req.params.messageId.split(',').filter(Boolean);
        const result = await Message.deleteMany({ _id: { $in: ids }, chatId: req.params.id });
        if (result.deletedCount === 0) return res.status(404).json({ message: 'Message(s) not found' });
        res.json({ message: 'Message(s) deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Stream message controller using Server-Sent Events (SSE)
 */
export const streamMessage = async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    const sendEvent = (event, data) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
        const { content } = req.body;
        const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
        if (!chat) {
            sendEvent('error', { message: 'Chat not found' });
            return res.end();
        }

        const previousMessages = await Message.find({ chatId: req.params.id }).sort({ createdAt: 1 });

        const formattedHistory = previousMessages.map(msg => {
            const parts = [{ text: msg.content || '' }];
            if (msg.image) {
                const [meta, base64Data] = msg.image.split(',');
                const mimeType = meta ? meta.split(':')[1]?.split(';')[0] : 'image/png';
                parts.push({
                    inlineData: { data: base64Data, mimeType: mimeType || 'image/png' }
                });
            }
            return {
                role: msg.role === 'user' ? 'user' : 'model',
                parts: parts
            };
        });

        let imageBase64DataUrl = null;
        let currentMessageParts = [{ text: content || '' }];

        if (req.file) {
            const base64String = req.file.buffer.toString('base64');
            imageBase64DataUrl = `data:${req.file.mimetype};base64,${base64String}`;
            currentMessageParts.push({
                inlineData: {
                    data: base64String,
                    mimeType: req.file.mimetype
                }
            });
        }

        const userMessage = await Message.create({
            chatId: req.params.id,
            role: 'user',
            content: content || '',
            image: imageBase64DataUrl
        });

        sendEvent('user_message', { userMessage });

        const { fullText, usage } = await streamChatResponse({
            formattedHistory,
            currentMessageParts,
            requestedModel: chat.model,
            customSystemInstruction: chat.systemInstruction,
            onChunk: (chunkText) => {
                sendEvent('delta', { delta: chunkText });
            }
        });

        const aiMessage = await Message.create({
            chatId: req.params.id,
            role: 'ai',
            content: fullText,
            usage
        });

        if (chat.title === 'New Chat') {
            chat.title = content ? (content.length > 30 ? content.substring(0, 30) + '...' : content) : 'Image Upload';
        }
        chat.updatedAt = Date.now();
        await chat.save();

        sendEvent('done', { aiMessage, chatTitle: chat.title });
        res.end();

    } catch (error) {
        console.error("Streaming Error:", error);
        const formattedErr = formatAIError(error);
        sendEvent('error', { message: formattedErr });
        res.end();
    }
};

/**
 * Regenerate AI response stream
 */
export const regenerateMessage = async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    const sendEvent = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    try {
        const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
        if (!chat) {
            sendEvent('error', { message: 'Chat not found' });
            return res.end();
        }

        const targetMessageId = req.params.messageId;
        const allMessages = await Message.find({ chatId: req.params.id }).sort({ createdAt: 1 });

        // Find index of message to regenerate
        const msgIndex = allMessages.findIndex(m => m._id.toString() === targetMessageId);
        if (msgIndex === -1) {
            sendEvent('error', { message: 'Target message not found' });
            return res.end();
        }

        // Messages before the target message become the context history
        const messagesBefore = allMessages.slice(0, msgIndex);

        // Delete the target AI message and any subsequent messages
        const idsToDelete = allMessages.slice(msgIndex).map(m => m._id);
        await Message.deleteMany({ _id: { $in: idsToDelete } });

        // Get the last user message from history
        const lastUserMessage = [...messagesBefore].reverse().find(m => m.role === 'user');
        if (!lastUserMessage) {
            sendEvent('error', { message: 'No user prompt found to regenerate' });
            return res.end();
        }

        const historyBeforeUser = messagesBefore.slice(0, messagesBefore.indexOf(lastUserMessage));

        const formattedHistory = historyBeforeUser.map(msg => {
            const parts = [{ text: msg.content || '' }];
            if (msg.image) {
                const [meta, base64Data] = msg.image.split(',');
                const mimeType = meta ? meta.split(':')[1]?.split(';')[0] : 'image/png';
                parts.push({ inlineData: { data: base64Data, mimeType: mimeType || 'image/png' } });
            }
            return { role: msg.role === 'user' ? 'user' : 'model', parts };
        });

        const currentMessageParts = [{ text: lastUserMessage.content || '' }];
        if (lastUserMessage.image) {
            const [meta, base64Data] = lastUserMessage.image.split(',');
            const mimeType = meta ? meta.split(':')[1]?.split(';')[0] : 'image/png';
            currentMessageParts.push({ inlineData: { data: base64Data, mimeType: mimeType || 'image/png' } });
        }

        const { fullText, usage } = await streamChatResponse({
            formattedHistory,
            currentMessageParts,
            requestedModel: chat.model,
            customSystemInstruction: chat.systemInstruction,
            onChunk: (chunkText) => sendEvent('delta', { delta: chunkText })
        });

        const newAiMessage = await Message.create({
            chatId: req.params.id,
            role: 'ai',
            content: fullText,
            usage,
            version: (allMessages[msgIndex]?.version || 1) + 1
        });

        chat.updatedAt = Date.now();
        await chat.save();

        sendEvent('done', { aiMessage: newAiMessage, deletedIds: idsToDelete });
        res.end();

    } catch (error) {
        console.error("Regenerate Error:", error);
        sendEvent('error', { message: formatAIError(error) });
        res.end();
    }
};

/**
 * Edit User Message & Re-stream
 */
export const editUserMessage = async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    const sendEvent = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    try {
        const { content } = req.body;
        const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
        if (!chat) {
            sendEvent('error', { message: 'Chat not found' });
            return res.end();
        }

        const targetMessageId = req.params.messageId;
        const allMessages = await Message.find({ chatId: req.params.id }).sort({ createdAt: 1 });

        const msgIndex = allMessages.findIndex(m => m._id.toString() === targetMessageId);
        if (msgIndex === -1) {
            sendEvent('error', { message: 'Target user message not found' });
            return res.end();
        }

        // Keep messages before the edited user message
        const messagesBefore = allMessages.slice(0, msgIndex);

        // Delete target user message and all subsequent messages
        const idsToDelete = allMessages.slice(msgIndex).map(m => m._id);
        await Message.deleteMany({ _id: { $in: idsToDelete } });

        // Save updated User Message
        const updatedUserMsg = await Message.create({
            chatId: req.params.id,
            role: 'user',
            content: content,
            image: allMessages[msgIndex].image
        });

        sendEvent('user_message', { userMessage: updatedUserMsg, deletedIds: idsToDelete });

        const formattedHistory = messagesBefore.map(msg => {
            const parts = [{ text: msg.content || '' }];
            if (msg.image) {
                const [meta, base64Data] = msg.image.split(',');
                const mimeType = meta ? meta.split(':')[1]?.split(';')[0] : 'image/png';
                parts.push({ inlineData: { data: base64Data, mimeType: mimeType || 'image/png' } });
            }
            return { role: msg.role === 'user' ? 'user' : 'model', parts };
        });

        const currentMessageParts = [{ text: content || '' }];
        if (updatedUserMsg.image) {
            const [meta, base64Data] = updatedUserMsg.image.split(',');
            const mimeType = meta ? meta.split(':')[1]?.split(';')[0] : 'image/png';
            currentMessageParts.push({ inlineData: { data: base64Data, mimeType: mimeType || 'image/png' } });
        }

        const { fullText, usage } = await streamChatResponse({
            formattedHistory,
            currentMessageParts,
            requestedModel: chat.model,
            customSystemInstruction: chat.systemInstruction,
            onChunk: (chunkText) => sendEvent('delta', { delta: chunkText })
        });

        const newAiMessage = await Message.create({
            chatId: req.params.id,
            role: 'ai',
            content: fullText,
            usage
        });

        chat.updatedAt = Date.now();
        await chat.save();

        sendEvent('done', { aiMessage: newAiMessage });
        res.end();

    } catch (error) {
        console.error("Edit User Message Error:", error);
        sendEvent('error', { message: formatAIError(error) });
        res.end();
    }
};

/**
 * Continue AI response stream
 */
export const continueMessage = async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    const sendEvent = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    try {
        const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
        if (!chat) {
            sendEvent('error', { message: 'Chat not found' });
            return res.end();
        }

        const allMessages = await Message.find({ chatId: req.params.id }).sort({ createdAt: 1 });
        const lastMessage = allMessages[allMessages.length - 1];

        if (!lastMessage || lastMessage.role !== 'ai') {
            sendEvent('error', { message: 'No AI message to continue' });
            return res.end();
        }

        const formattedHistory = allMessages.map(msg => {
            const parts = [{ text: msg.content || '' }];
            return { role: msg.role === 'user' ? 'user' : 'model', parts };
        });

        const currentMessageParts = [{ text: "Please continue generating from where you left off. Do not repeat text already written." }];

        const { fullText, usage } = await streamChatResponse({
            formattedHistory,
            currentMessageParts,
            requestedModel: chat.model,
            customSystemInstruction: chat.systemInstruction,
            onChunk: (chunkText) => sendEvent('delta', { delta: chunkText })
        });

        lastMessage.content += `\n${fullText}`;
        lastMessage.isContinued = true;
        if (usage) {
            lastMessage.usage.promptTokens += usage.promptTokens;
            lastMessage.usage.candidateTokens += usage.candidateTokens;
            lastMessage.usage.totalTokens += usage.totalTokens;
        }
        await lastMessage.save();

        chat.updatedAt = Date.now();
        await chat.save();

        sendEvent('done', { aiMessage: lastMessage });
        res.end();

    } catch (error) {
        console.error("Continue Error:", error);
        sendEvent('error', { message: formatAIError(error) });
        res.end();
    }
};

/**
 * Full-text search across user's chats and messages
 */
export const searchChats = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || !q.trim()) return res.json([]);

        const userChats = await Chat.find({ userId: req.user._id });
        const chatIds = userChats.map(c => c._id);

        const regex = new RegExp(q, 'i');

        // Search matching messages
        const matchingMessages = await Message.find({
            chatId: { $in: chatIds },
            content: regex
        }).sort({ createdAt: -1 }).limit(50);

        // Group matches by chat
        const resultsMap = new Map();

        for (const chat of userChats) {
            const titleMatch = regex.test(chat.title);
            const messagesMatch = matchingMessages.filter(m => m.chatId.toString() === chat._id.toString());

            if (titleMatch || messagesMatch.length > 0) {
                resultsMap.set(chat._id.toString(), {
                    chat,
                    titleMatch,
                    matchedMessages: messagesMatch
                });
            }
        }

        res.json(Array.from(resultsMap.values()));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Legacy non-streaming fallback
 */
export const addMessage = async (req, res) => {
    try {
        const { content } = req.body;
        const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        const previousMessages = await Message.find({ chatId: req.params.id }).sort({ createdAt: 1 });

        const formattedHistory = previousMessages.map(msg => {
            const parts = [{ text: msg.content || '' }];
            if (msg.image) {
                const [meta, base64Data] = msg.image.split(',');
                const mimeType = meta ? meta.split(':')[1]?.split(';')[0] : 'image/png';
                parts.push({ inlineData: { data: base64Data, mimeType: mimeType || 'image/png' } });
            }
            return { role: msg.role === 'user' ? 'user' : 'model', parts };
        });

        let imageBase64DataUrl = null;
        let currentMessageParts = [{ text: content || '' }];

        if (req.file) {
            const base64String = req.file.buffer.toString('base64');
            imageBase64DataUrl = `data:${req.file.mimetype};base64,${base64String}`;
            currentMessageParts.push({
                inlineData: { data: base64String, mimeType: req.file.mimetype }
            });
        }

        const userMessage = await Message.create({
            chatId: req.params.id,
            role: 'user',
            content: content || '',
            image: imageBase64DataUrl
        });

        const { fullText, usage } = await streamChatResponse({
            formattedHistory,
            currentMessageParts,
            requestedModel: chat.model,
            customSystemInstruction: chat.systemInstruction
        });

        const aiMessage = await Message.create({
            chatId: req.params.id,
            role: 'ai',
            content: fullText,
            usage
        });

        if (chat.title === 'New Chat') {
            chat.title = content ? (content.length > 30 ? content.substring(0, 30) + '...' : content) : 'Image Upload';
        }

        chat.updatedAt = Date.now();
        await chat.save();

        res.status(201).json({ userMessage, aiMessage, chatTitle: chat.title });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ message: formatAIError(error) });
    }
};