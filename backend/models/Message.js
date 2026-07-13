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
    }
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);
export default Message;