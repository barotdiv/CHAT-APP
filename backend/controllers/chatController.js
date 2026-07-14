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

export const addMessage = async (req, res) => {
    try {
        const { content } = req.body;

        const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        // 1. Fetch the PREVIOUS chat history so the AI remembers the conversation context!
        const previousMessages = await Message.find({ chatId: req.params.id }).sort({ createdAt: 1 });

        // 2. Format the history exactly how Google Gemini expects it
        const formattedHistory = previousMessages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model', // Gemini uses 'model' instead of 'ai'
            parts: [{ text: msg.content }]
        }));

        // 3. Save the new User message to the database
        const userMessage = await Message.create({
            chatId: req.params.id,
            role: 'user',
            content
        });

        // 4. Initialize Gemini (we use 1.5-flash because it is extremely fast)
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // 5. Start a chat session with the AI, giving it the history
        const chatSession = model.startChat({
            history: formattedHistory,
        });

        // 6. Send the user's newest message to the AI
        const result = await chatSession.sendMessage(content);

        // 7. Extract the text reply from the AI's response
        const aiReplyText = result.response.text();

        // 8. Save the AI's reply to the database
        const aiMessage = await Message.create({
            chatId: req.params.id,
            role: 'ai',
            content: aiReplyText
        });

        // Update the chat's 'updatedAt' timestamp
        chat.updatedAt = Date.now();
        await chat.save();

        // Send both messages back to the React frontend
        res.status(201).json({ userMessage, aiMessage });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ message: error.message });
    }
};