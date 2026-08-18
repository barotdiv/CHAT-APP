import { GoogleGenerativeAI } from '@google/generative-ai';
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

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
                image: msg.image
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

export const addMessage = async (req, res) => {
    try {
        const { content } = req.body;

        const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        // 1. Fetch previous messages
        const previousMessages = await Message.find({ chatId: req.params.id }).sort({ createdAt: 1 });

        // 2. Format history for Gemini
        const formattedHistory = previousMessages.map(msg => {
            const parts = [{ text: msg.content || '' }];

            // If a past message had an image, attach it so the AI remembers it
            if (msg.image) {
                const [meta, base64Data] = msg.image.split(',');
                const mimeType = meta.split(':')[1].split(';')[0];

                parts.push({
                    inlineData: { data: base64Data, mimeType: mimeType }
                });
            }

            return {
                role: msg.role === 'user' ? 'user' : 'model',
                parts: parts
            };
        });

        // 3. Process the NEW uploaded image (if the user attached one)
        let imageBase64DataUrl = null;
        let currentMessageParts = [{ text: content || '' }]; // What we will send to Gemini

        if (req.file) {
            // Convert the uploaded memory buffer into a Base64 string
            const base64String = req.file.buffer.toString('base64');

            // Format it as a Data URL so we can easily display it in React later
            imageBase64DataUrl = `data:${req.file.mimetype};base64,${base64String}`;

            // Add the image part for Gemini to analyze
            currentMessageParts.push({
                inlineData: {
                    data: base64String,
                    mimeType: req.file.mimetype
                }
            });
        }

        // 4. Save the new User message to the database (including the image Data URL)
        const userMessage = await Message.create({
            chatId: req.params.id,
            role: 'user',
            content,
            image: imageBase64DataUrl // This will be null if no image was uploaded
        });

        // 5. Initialize Gemini
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '') {
            return res.status(401).json({
                message: "Invalid or missing GEMINI_API_KEY in backend/.env. Please get a free API key from https://aistudio.google.com/app/apikey and put it in backend/.env"
            });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-3.5-flash",
            systemInstruction: "You are a helpful AI assistant. If the user asks you to generate, draw, or create an image of something, you must respond with EXACTLY this URL string format and nothing else: https://image.pollinations.ai/prompt/{url_encoded_prompt} (where {url_encoded_prompt} is a highly detailed, comma-separated visual description of the requested image with spaces replaced by %20). Do not include any markdown syntax or other text in your reply when generating an image."
        });

        // 6. Start the chat session
        const chatSession = model.startChat({ history: formattedHistory });

        // 7. Send the new message (text + optional image) to the AI
        const result = await chatSession.sendMessage(currentMessageParts);
        const aiReplyText = result.response.text();

        // 8. Save AI reply
        const aiMessage = await Message.create({
            chatId: req.params.id,
            role: 'ai',
            content: aiReplyText
        });

        // Update chat title if it's still 'New Chat'
        if (chat.title === 'New Chat') {
            chat.title = content ? (content.length > 30 ? content.substring(0, 30) + '...' : content) : 'Image Upload';
        }

        chat.updatedAt = Date.now();
        await chat.save();

        res.status(201).json({ userMessage, aiMessage, chatTitle: chat.title });
    } catch (error) {
        console.error("AI Error:", error);
        let errorMsg = error.message;
        if (errorMsg && (errorMsg.includes("401") || errorMsg.includes("API key not valid"))) {
            errorMsg = "Gemini API 401 Unauthorized: Invalid API Key. Please get a valid key from https://aistudio.google.com/app/apikey and set GEMINI_API_KEY in backend/.env";
        }
        res.status(500).json({ message: errorMsg });
    }
};