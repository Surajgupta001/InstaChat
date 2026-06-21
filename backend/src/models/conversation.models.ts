import mongoose, { Schema } from "mongoose";
import type { IConversation } from "../../types";

const ConversationSchema = new Schema<IConversation>({
    participants: [{
        type: String,   // Clerk user IDs are strings, not ObjectId
        ref: "User",
        required: true,
    }],
    lastMessage: {
        type: Schema.Types.ObjectId,
        ref: "Message",
    },
    isGroup: {
        type: Boolean,
        default: false,
    },
    groupName: {
        type: String,
        trim: true,
    },
    groupAvatar: {
        type: String,
    },
    groupAdmins: [{
        type: String,
        ref: "User",
    }],
}, {
    timestamps: true,
});

// Index for fast participant lookups
ConversationSchema.index({ participants: 1 });

const Conversation = mongoose.model<IConversation>("Conversation", ConversationSchema);

export default Conversation;