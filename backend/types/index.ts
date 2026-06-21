import type mongoose from "mongoose";
import type { Document } from "mongoose";

export interface IUser {
    _id: string;
    name: string;
    email: string;
    handle: string;
    avatar?: string;
    bio?: string;
    isOnline: boolean;
    lastSeen: Date;
    createdAt: Date;
    updatedAt: Date;
};

export interface IReaction {
    userId: string;
    emoji: string;
}

export interface IMessage extends Document {
    sender: string;                       // Clerk user ID (string)
    receiver?: string;                    // Clerk user ID (string)
    conversationId: mongoose.Types.ObjectId;
    text?: string;
    mediaUrl?: string;
    mediaType?: "image" | "video";
    read: boolean;
    reactions: IReaction[];
    replyTo?: mongoose.Types.ObjectId;
    idempotencyKey?: string;
    createdAt: Date;
};

export interface IConversation extends Document {
    participants: string[];               // Clerk user IDs (strings)
    lastMessage?: mongoose.Types.ObjectId;
    isGroup: boolean;
    groupName?: string;
    groupAvatar?: string;
    groupAdmins: string[];
    updatedAt: Date;
}

export interface IStory extends Document {
    user: string;                         // Clerk user ID (string)
    mediaUrl: string;
    mediaType: "image" | "video";
    caption?: string;
    viewers: string[];
    createdAt: Date;
    updatedAt: Date;
}