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

        // 1. Fetch previous messages
        const previousMessages = await Message.find({ chatId: req.params.id }).sort({ createdAt: 1 });

        // 2. Format history for Gemini, including any previous images!
        const formattedHistory = previousMessages.map(msg => {
            const parts = [{ text: msg.content }];

            // If a past message had an image, attach it so the AI remembers it
            if (msg.image) {
                // Our database saves it as a Data URL (e.g. "data:image/png;base64,iVBORw0K...")
                // Gemini needs us to split that up:
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
        let currentMessageParts = [{ text: content }]; // What we will send to Gemini

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
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

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

        chat.updatedAt = Date.now();
        await chat.save();

        res.status(201).json({ userMessage, aiMessage });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ message: error.message });
    }
};