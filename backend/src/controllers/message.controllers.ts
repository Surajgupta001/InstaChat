import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middlewares";
import Conversation from "../models/conversation.models";
import { findConversation } from "../../utils/utility";
import { Readable } from "stream";
import cloudinary from "../config/cloudinary";
import Message from "../models/message.models";

// Start or get a conversation with a user
export const getOrCreateConversation = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const targetUserId = String(req.params.targetUserId);

    let conversation: any = await findConversation(userId, targetUserId);

    if (conversation) {
        await conversation.populate('participants', 'name email handle avatar isOnline lastSeen');
        await conversation.populate('lastMessage');
    } else {
        // Create new conversation
        conversation = await Conversation.create({
            participants: [userId, targetUserId],
        });

        await conversation.populate('participants', 'name email handle avatar isOnline lastSeen');
    }

    const other = (conversation.participants as any[]).find((p: any) => String(p._id) !== userId);

    res
        .status(200)
        .json({
            success: true,
            message: "Conversation retrieved successfully",
            conversation: {
                _id: conversation._id,
                participants: other,
                lastMessage: conversation.lastMessage,
            }
        });
};

// Get all conversations for the current user
export const getConversations = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const conversations = await Conversation.find({
        participants: {
            $in: [userId]
        }
    }).populate('participants', 'name email handle avatar isOnline lastSeen').populate('lastMessage').sort({ updatedAt: -1 });

    const formattedConversations = conversations.map((c) => {
        const other = (c.participants as any[]).find((p: any) => String(p._id) !== userId);
        return {
            _id: c._id,
            participants: other,
            lastMessage: c.lastMessage,
            isGroup: false,
            updatedAt: c.updatedAt,
        };
    });

    res
        .status(200)
        .json({
            success: true,
            message: "Conversations retrieved successfully",
            conversations: formattedConversations,
        });

};

// Send a message in a conversation
export const sendMessage = async (req: AuthRequest, res: Response) => {
    const senderId = req.user!.id;
    const { receiverId, conversationId, text } = req.body;

    const file = req.file;

    if ((!receiverId && !conversationId) || (!text?.trim() && !file)) {
        return res
            .status(400)
            .json({
                success: false,
                message: "Either receiverId or conversationId must be provided, and either text or a file must be provided.",
            });
    }

    let mediaUrl = '';
    let mediaType: "image" | "video" | undefined;

    if (file) {
        try {
            const resourceType = file.mimetype.startsWith('video') ? 'video' : 'image';
            mediaType = resourceType as "image" | "video"; // assign to outer variable

            const uploadPromise = new Promise<{ string_url: string }>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream({
                    folder: 'instachat',
                    resource_type: resourceType
                }, (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result as any);
                    }
                })

                const readableStream = new Readable();
                readableStream.push(file.buffer);
                readableStream.push(null);
                readableStream.pipe(uploadStream);
            })

            const result = await uploadPromise;
            mediaUrl = (result as any).secure_url;
        } catch (err) {
            console.error('Cloudinary upload error:', err);
            return res
                .status(500)
                .json({
                    success: false,
                    message: 'Failed to upload file'
                });
        }
    }

    let conversation;

    if (conversationId) {
        conversation = await Conversation.findOne({
            _id: conversationId,
            participants: { $in: [senderId] }
        });

        if (!conversation) {
            return res
                .status(404)
                .json({
                    success: false,
                    message: "Conversation not found or you are not a participant.",
                });
        }
    } else {
        conversation = await findConversation(senderId, receiverId);

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
            });
        }

        if (!conversation) {
            return res
                .status(404)
                .json({
                    success: false,
                    message: "Conversation not found and could not be created.",
                });
        }
    }

    const receiver = receiverId || (conversation.participants as any[]).find((p: any) => String(p) !== senderId);

    const message = await Message.create({
        sender: senderId,
        receiver,
        conversationId: conversation._id,
        text: text?.trim(),
        mediaUrl: mediaUrl || undefined,
        mediaType,
    });

    conversation.lastMessage = message._id as any;
    conversation.updatedAt = new Date();
    await conversation.save();

    res
        .status(200)
        .json({
            success: true,
            message,
        });
};

// Get all messages in a conversation
export const getMessages = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: {
            $in: [userId]
        }
    })

    if (!conversation) {
        return res
            .status(404)
            .json({
                success: false,
                message: "Conversation not found",
            });
    }

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    await Message.updateMany({
        conversationId,
        receiver: userId,
        read: false
    }, {
        read: true
    })

    res
        .status(200)
        .json({
            success: true,
            messages,
        });
};

// Delete a conversation
export const deleteConversation = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { conversationId } = req.body;

    try {
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res
                .status(404)
                .json({
                    success: false,
                    message: "Conversation not found",
                });
        }

        // Check if the user is a participant in the conversation
        const isParticipant = conversation.participants.some((p) => String(p) === userId);

        if (!isParticipant) {
            return res
                .status(403)
                .json({
                    success: false,
                    message: "You are not a participant in this conversation",
                });
        }

        // Notify other participants before deleting

        // Delete the conversation and all its messages
        await Message.deleteMany({ conversationId });
        await Conversation.findByIdAndDelete(conversationId);

        res
            .status(200)
            .json({
                success: true,
                message: "Conversation deleted successfully",
            });
    } catch (error) {
        console.error('Error occurred while deleting conversation:', error);
        return res
            .status(500)
            .json({
                success: false,
                message: "An error occurred while deleting the conversation",
            });
    }
};