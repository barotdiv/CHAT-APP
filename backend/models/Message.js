import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Chat"
    },
    role: {
        type: String,
        required: true,
        enum: ["user", "ai"]
    },
    content: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: false
    },
    parentMessageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null
    },
    version: {
        type: Number,
        default: 1
    },
    isContinued: {
        type: Boolean,
        default: false
    },
    usage: {
        promptTokens: { type: Number, default: 0 },
        candidateTokens: { type: Number, default: 0 },
        totalTokens: { type: Number, default: 0 },
        model: { type: String, default: "" }
    }
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);
export default Message;