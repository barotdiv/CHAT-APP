import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        default: "New Chat"
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    model: {
        type: String,
        default: "gemini-2.5-flash"
    },
    systemInstruction: {
        type: String,
        default: ""
    },
    folder: {
        type: String,
        default: "General"
    }
}, { timestamps: true });

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;