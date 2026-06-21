import mongoose, { Schema } from "mongoose";
import type { IMessage } from "../../types";

const MessageSchema = new Schema<IMessage>({
    sender: {
        type: String,
        ref: "User",
        required: true,
    },
    receiver: {
        type: String,
        ref: "User",
    },
    conversationId: {
        type: Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
    },
    text: {
        type: String,
        trim: true,
    },
    mediaUrl: {
        type: String,
    },
    mediaType: {
        type: String,
        enum: ["image", "video"],
    },
    read: {
        type: Boolean,
        default: false,
    },
    reactions: [{
        userId: { type: String, required: true },
        emoji: { type: String, required: true },
    }],
    replyTo: {
        type: Schema.Types.ObjectId,
        ref: "Message",
    },
    idempotencyKey: {
        type: String,
        sparse: true,
        unique: true,
    },
}, {
    timestamps: true,
});

// Critical indexes for query performance
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ conversationId: 1, receiver: 1, read: 1 });
MessageSchema.index({ sender: 1, conversationId: 1 });

const Message = mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
