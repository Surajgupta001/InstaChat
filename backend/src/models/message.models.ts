import mongoose, { Schema } from "mongoose";
import type { IMessage } from "../../types";

const MessageSchema = new Schema<IMessage>({
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiver: {
        type: Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});

const Message = mongoose.model<IMessage>("Message", MessageSchema);

export default Message;