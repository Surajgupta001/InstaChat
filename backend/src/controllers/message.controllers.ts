import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middlewares";
import Conversation from "../models/conversation.models";
import { findConversation } from "../../utils/utility";
import { uploadBuffer } from "../config/cloudinary";
import Message from "../models/message.models";
import { handleConversationEvent, onlineUser } from "../socket/socketManager";
import crypto from "crypto";

// Start or get a conversation with a user
export const getOrCreateConversation = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const targetUserId = String(req.params.targetUserId);

    if (userId === targetUserId) {
        return res.status(400).json({
            success: false,
            message: "Cannot create a conversation with yourself",
        });
    }

    let conversation: any = await findConversation(userId, targetUserId);

    if (conversation) {
        await conversation.populate('participants', 'name email handle avatar isOnline lastSeen');
        await conversation.populate('lastMessage');
    } else {
        conversation = await Conversation.create({
            participants: [userId, targetUserId],
        });
        await conversation.populate('participants', 'name email handle avatar isOnline lastSeen');
    }

    const other = (conversation.participants as any[]).find(
        (p: any) => String(p._id) !== userId
    );

    res.status(200).json({
        success: true,
        message: "Conversation retrieved successfully",
        conversation: {
            _id: conversation._id,
            participant: other,
            lastMessage: conversation.lastMessage,
        },
    });
};

// Get all conversations for the current user
export const getConversations = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const conversations = await Conversation.find({
        participants: { $in: [userId] },
    })
        .populate('participants', 'name email handle avatar isOnline lastSeen')
        .populate('lastMessage')
        .sort({ updatedAt: -1 })
        .lean();

    const formattedConversations = await Promise.all(conversations.map(async (c) => {
        const other = (c.participants as any[]).find(
            (p: any) => String(p._id) !== userId
        );
        const unreadCount = await Message.countDocuments({
            conversationId: c._id,
            receiver: userId,
            read: false,
        });
        return {
            _id: c._id,
            participant: c.isGroup
                ? {
                      _id: c._id,
                      name: c.groupName,
                      avatar: c.groupAvatar || '',
                      handle: 'group',
                      isOnline: false,
                      lastSeen: new Date().toISOString(),
                  }
                : other,
            lastMessage: c.lastMessage,
            isGroup: c.isGroup || false,
            groupName: c.groupName,
            groupAvatar: c.groupAvatar,
            groupAdmins: c.groupAdmins,
            participants: c.participants,
            unreadCount,
            updatedAt: c.updatedAt,
        };
    }));

    res.status(200).json({
        success: true,
        message: "Conversations retrieved successfully",
        conversations: formattedConversations,
    });
};

// Send a message in a conversation
export const sendMessage = async (req: AuthRequest, res: Response) => {
    const senderId = req.user!.id;
    const { receiverId, conversationId, text, replyToId } = req.body;
    const file = req.file;

    if (!receiverId && !conversationId) {
        return res.status(400).json({
            success: false,
            message: "Either receiverId or conversationId must be provided",
        });
    }

    if (!text?.trim() && !file) {
        return res.status(400).json({
            success: false,
            message: "Either text or a file must be provided",
        });
    }

    // Prevent self-messaging
    if (receiverId && receiverId === senderId) {
        return res.status(400).json({
            success: false,
            message: "Cannot send a message to yourself",
        });
    }

    let mediaUrl = '';
    let mediaType: "image" | "video" | undefined;

    if (file) {
        try {
            const resourceType = file.mimetype.startsWith('video') ? 'video' : 'image';
            mediaType = resourceType as "image" | "video";

            const result = await uploadBuffer(file.buffer, {
                folder: 'instachat',
                resourceType,
                transformation: resourceType === 'image'
                    ? [{ quality: 'auto', fetch_format: 'auto' }]
                    : undefined,
            });

            mediaUrl = result.secure_url;
        } catch (err) {
            console.error('Cloudinary upload error:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to upload file',
            });
        }
    }

    let conversation;

    if (conversationId) {
        conversation = await Conversation.findOne({
            _id: conversationId,
            participants: { $in: [senderId] },
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found or you are not a participant",
            });
        }
    } else {
        conversation = await findConversation(senderId, receiverId);

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
            });
        }
    }

    const receiver =
        receiverId ||
        (conversation.participants as any[]).find(
            (p: any) => String(p) !== senderId
        );

    // Generate idempotency key from content hash to prevent duplicate messages
    const contentHash = crypto
        .createHash('sha256')
        .update(`${senderId}:${conversation._id}:${text || ''}:${mediaUrl}:${Date.now()}`)
        .digest('hex')
        .slice(0, 32);

    const message = await Message.create({
        sender: senderId,
        receiver,
        conversationId: conversation._id,
        text: text?.trim(),
        mediaUrl: mediaUrl || undefined,
        mediaType,
        replyTo: replyToId || undefined,
        idempotencyKey: contentHash,
    });

    if (replyToId) {
        await message.populate('replyTo');
    }

    conversation.lastMessage = message._id as any;
    conversation.updatedAt = new Date();
    await conversation.save();

    res.status(200).json({
        success: true,
        message,
    });
};

// Get all messages in a conversation (paginated)
export const getMessages = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: { $in: [userId] },
    });

    if (!conversation) {
        return res.status(404).json({
            success: false,
            message: "Conversation not found",
        });
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
        Message.find({ conversationId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('replyTo')
            .lean(),
        Message.countDocuments({ conversationId }),
    ]);

    // Mark unread messages as read
    const result = await Message.updateMany(
        { conversationId, receiver: userId, read: false },
        { read: true }
    );

    if (result.modifiedCount > 0) {
        await handleConversationEvent(userId, String(conversationId), {
            type: "messages_read",
            conversationId,
            readerId: userId,
        });
    }

    // Return in chronological order (oldest first)
    res.status(200).json({
        success: true,
        messages: messages.reverse(),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
};

// Delete a conversation
export const deleteConversation = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { conversationId } = req.params;

    try {
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found",
            });
        }

        const isParticipant = conversation.participants.some(
            (p) => String(p) === userId
        );

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: "You are not a participant in this conversation",
            });
        }

        await handleConversationEvent(userId, String(conversationId), {
            type: "chat_deleted",
            conversationId,
        });

        await Message.deleteMany({ conversationId });
        await Conversation.findByIdAndDelete(conversationId);

        res.status(200).json({
            success: true,
            message: "Conversation deleted successfully",
        });
    } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({
            success: false,
            message: "An error occurred while deleting the conversation",
        });
    }
};

// Mark all messages in a conversation as read
export const markMessagesAsRead = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { conversationId } = req.params;

    try {
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: { $in: [userId] },
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found",
            });
        }

        const result = await Message.updateMany(
            { conversationId, receiver: userId, read: false },
            { read: true }
        );

        if (result.modifiedCount > 0) {
            await handleConversationEvent(userId, String(conversationId), {
                type: "messages_read",
                conversationId,
                readerId: userId,
            });
        }

        res.status(200).json({
            success: true,
            message: "Messages marked as read successfully",
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({
            success: false,
            message: "An error occurred while marking messages as read",
        });
    }
};

// React to a message (or toggle/remove reaction)
export const reactToMessage = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji || !emoji.trim()) {
        return res.status(400).json({
            success: false,
            message: "Emoji is required",
        });
    }

    try {
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found",
            });
        }

        const conversation = await Conversation.findOne({
            _id: message.conversationId,
            participants: { $in: [userId] },
        });

        if (!conversation) {
            return res.status(403).json({
                success: false,
                message: "You are not a participant in this conversation",
            });
        }

        if (!message.reactions) {
            message.reactions = [];
        }

        const existingIdx = message.reactions.findIndex(
            (r) => r.userId === userId
        );

        if (existingIdx > -1) {
            const existingReaction = message.reactions[existingIdx];
            if (existingReaction && existingReaction.emoji === emoji) {
                message.reactions.splice(existingIdx, 1);
            } else if (existingReaction) {
                existingReaction.emoji = emoji;
            }
        } else {
            message.reactions.push({ userId, emoji });
        }

        await message.save();

        await handleConversationEvent(userId, String(message.conversationId), {
            type: "message_reaction",
            messageId,
            conversationId: message.conversationId,
            reactions: message.reactions,
        });

        res.status(200).json({
            success: true,
            message: "Reaction updated successfully",
            reactions: message.reactions,
        });
    } catch (error) {
        console.error('Error reacting to message:', error);
        res.status(500).json({
            success: false,
            message: "An error occurred while reacting to the message",
        });
    }
};

// Create a new group conversation
export const createGroupConversation = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { groupName, participantIds, groupAvatar } = req.body;

    if (!groupName || !groupName.trim()) {
        return res.status(400).json({
            success: false,
            message: "Group name is required",
        });
    }

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        return res.status(400).json({
            success: false,
            message: "At least one participant must be added",
        });
    }

    try {
        const uniqueParticipants = Array.from(new Set([userId, ...participantIds]));

        const conversation = await Conversation.create({
            participants: uniqueParticipants,
            isGroup: true,
            groupName: groupName.trim(),
            groupAvatar: groupAvatar || undefined,
            groupAdmins: [userId],
        });

        await conversation.populate('participants', 'name email handle avatar isOnline lastSeen');

        for (const pId of uniqueParticipants) {
            if (pId === userId) continue;
            const ws = onlineUser.get(pId);
            if (ws?.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: "new_group_chat",
                    conversationId: conversation._id,
                }));
            }
        }

        res.status(201).json({
            success: true,
            message: "Group conversation created successfully",
            conversation: {
                _id: conversation._id,
                participant: {
                    _id: conversation._id,
                    name: conversation.groupName,
                    avatar: conversation.groupAvatar || '',
                    handle: 'group',
                    isOnline: false,
                    lastSeen: new Date().toISOString(),
                },
                lastMessage: undefined,
                isGroup: true,
                groupName: conversation.groupName,
                groupAvatar: conversation.groupAvatar,
                groupAdmins: conversation.groupAdmins,
                participants: conversation.participants,
                updatedAt: conversation.updatedAt,
            },
        });
    } catch (error) {
        console.error('Error creating group conversation:', error);
        res.status(500).json({
            success: false,
            message: "An error occurred while creating the group conversation",
        });
    }
};

// Add or remove members from a group
export const updateGroupMembers = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { conversationId } = req.params;
    const { participantIds } = req.body;

    if (!participantIds || !Array.isArray(participantIds)) {
        return res.status(400).json({
            success: false,
            message: "participantIds array is required",
        });
    }

    try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Group conversation not found",
            });
        }

        if (!conversation.isGroup) {
            return res.status(400).json({
                success: false,
                message: "This is not a group conversation",
            });
        }

        const isAdmin = conversation.groupAdmins.some(
            (adminId) => adminId === userId
        );
        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Only group admins can update group members",
            });
        }

        const updatedParticipants = Array.from(new Set([userId, ...participantIds]));
        conversation.participants = updatedParticipants;

        conversation.groupAdmins = conversation.groupAdmins.filter((adminId) =>
            updatedParticipants.includes(adminId)
        );

        await conversation.save();
        await conversation.populate('participants', 'name email handle avatar isOnline lastSeen');

        await handleConversationEvent(userId, String(conversationId), {
            type: "group_members_updated",
            conversationId,
            participants: conversation.participants,
        });

        res.status(200).json({
            success: true,
            message: "Group members updated successfully",
            conversation,
        });
    } catch (error) {
        console.error('Error updating group members:', error);
        res.status(500).json({
            success: false,
            message: "An error occurred while updating the group members",
        });
    }
};

// Delete a single message
export const deleteMessage = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { messageId } = req.params;

    try {
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found",
            });
        }

        // Only sender can delete their message
        if (String(message.sender) !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own messages",
            });
        }

        const conversationId = message.conversationId;
        await Message.findByIdAndDelete(messageId);

        // Update lastMessage in Conversation if it was the deleted message
        const conversation = await Conversation.findById(conversationId);
        if (conversation && String(conversation.lastMessage) === messageId) {
            const lastMsg = await Message.findOne({ conversationId }).sort({ createdAt: -1 });
            conversation.lastMessage = lastMsg ? lastMsg._id as any : undefined;
            await conversation.save();
        }

        // Notify socket clients
        await handleConversationEvent(userId, String(conversationId), {
            type: "message_deleted",
            messageId,
            conversationId,
        });

        res.status(200).json({
            success: true,
            message: "Message deleted successfully",
        });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({
            success: false,
            message: "An error occurred while deleting the message",
        });
    }
};

// Edit a single message
export const editMessage = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { messageId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
        return res.status(400).json({
            success: false,
            message: "Text content is required",
        });
    }

    try {
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found",
            });
        }

        // Only sender can edit their message
        if (String(message.sender) !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only edit your own messages",
            });
        }

        message.text = text.trim();
        await message.save();

        // Notify socket clients
        await handleConversationEvent(userId, String(message.conversationId), {
            type: "message_edited",
            messageId,
            conversationId: message.conversationId,
            text: message.text,
        });

        res.status(200).json({
            success: true,
            message: "Message edited successfully",
            updatedMessage: message,
        });
    } catch (error) {
        console.error('Error editing message:', error);
        res.status(500).json({
            success: false,
            message: "An error occurred while editing the message",
        });
    }
};
