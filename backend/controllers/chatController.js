import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import { streamChatResponse, formatAIError, getGreetingReply } from "../services/aiService.js";

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
        const chat = await Chat.create({
            userId: req.user._id,
            title: 'New Chat'
        });
        res.status(201).json(chat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateChat = async (req, res) => {
    try {
        const { title, isPinned } = req.body;

        const chat = await Chat.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { title, isPinned },
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
            isPinned: false
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
    // 1. Set SSE Headers
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

        // Check for ChatGPT-style standard greeting reply (e.g. "hello", "hey", "hi", "hello there", etc.)
        const greetingReply = !req.file ? getGreetingReply(content) : null;

        if (greetingReply) {
            const userMessage = await Message.create({
                chatId: req.params.id,
                role: 'user',
                content: content || '',
                image: null
            });
            sendEvent('user_message', { userMessage });

            // Stream ChatGPT default greeting chunk by chunk for smooth animation
            const words = greetingReply.split(' ');
            let fullText = '';
            for (let i = 0; i < words.length; i++) {
                const chunk = (i === 0 ? '' : ' ') + words[i];
                fullText += chunk;
                sendEvent('delta', { delta: chunk });
                await new Promise(r => setTimeout(r, 40));
            }

            const aiMessage = await Message.create({
                chatId: req.params.id,
                role: 'ai',
                content: fullText,
                usage: { promptTokens: 5, candidateTokens: 10, totalTokens: 15, model: 'chatgpt-greeting' }
            });

            if (chat.title === 'New Chat') {
                chat.title = content ? (content.length > 30 ? content.substring(0, 30) + '...' : content) : 'Greeting';
            }
            chat.updatedAt = Date.now();
            await chat.save();

            sendEvent('done', { aiMessage, chatTitle: chat.title });
            return res.end();
        }

        // 2. Fetch previous messages
        const previousMessages = await Message.find({ chatId: req.params.id }).sort({ createdAt: 1 });

        // 3. Format history for Gemini
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

        // 4. Process current message uploaded image (if any)
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

        // 5. Save user message to database
        const userMessage = await Message.create({
            chatId: req.params.id,
            role: 'user',
            content: content || '',
            image: imageBase64DataUrl
        });

        // Emit user_message event to client
        sendEvent('user_message', { userMessage });

        // 6. Stream response from Gemini via aiService
        const { fullText, usage } = await streamChatResponse({
            formattedHistory,
            currentMessageParts,
            onChunk: (chunkText) => {
                sendEvent('delta', { delta: chunkText });
            }
        });

        // 7. Save AI reply to database
        const aiMessage = await Message.create({
            chatId: req.params.id,
            role: 'ai',
            content: fullText,
            usage
        });

        // Update chat title if it's 'New Chat'
        if (chat.title === 'New Chat') {
            chat.title = content ? (content.length > 30 ? content.substring(0, 30) + '...' : content) : 'Image Upload';
        }
        chat.updatedAt = Date.now();
        await chat.save();

        // Emit done event to client
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
 * Non-streaming addMessage fallback (updated to use aiService)
 */
export const addMessage = async (req, res) => {
    try {
        const { content } = req.body;

        const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        const greetingReply = !req.file ? getGreetingReply(content) : null;

        if (greetingReply) {
            const userMessage = await Message.create({
                chatId: req.params.id,
                role: 'user',
                content: content || '',
                image: null
            });

            const aiMessage = await Message.create({
                chatId: req.params.id,
                role: 'ai',
                content: greetingReply,
                usage: { promptTokens: 5, candidateTokens: 10, totalTokens: 15, model: 'chatgpt-greeting' }
            });

            if (chat.title === 'New Chat') {
                chat.title = content ? (content.length > 30 ? content.substring(0, 30) + '...' : content) : 'Greeting';
            }

            chat.updatedAt = Date.now();
            await chat.save();

            return res.status(201).json({ userMessage, aiMessage, chatTitle: chat.title });
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

        const { fullText, usage } = await streamChatResponse({
            formattedHistory,
            currentMessageParts
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