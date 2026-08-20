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
    }
}, { timestamps: true });

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;