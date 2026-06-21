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

export interface IMessage extends Document {
    sender: string;                       // Clerk user ID (string)
    receiver?: string;                    // Clerk user ID (string)
    conversationId: mongoose.Types.ObjectId;
    text?: string;
    mediaUrl?: string;
    mediaType?: "image" | "video";
    read: boolean;
    createdAt: Date;
};

export interface IConversation extends Document {
    participants: string[];               // Clerk user IDs (strings)
    lastMessage?: mongoose.Types.ObjectId;
    updatedAt: Date;
}

export interface IStory extends Document {
    user: mongoose.Types.ObjectId;
    mediaUrl: string;
    mediaType: "image" | "video";
    caption?: string;
    viewers: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}