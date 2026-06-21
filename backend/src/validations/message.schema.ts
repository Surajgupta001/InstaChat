import { z } from "zod";

export const sendMessageSchema = z.object({
    receiverId: z.string().min(1).optional(),
    conversationId: z.string().min(1).optional(),
    text: z
        .string()
        .max(2000, { message: "Message must be 2000 characters or less" })
        .trim()
        .optional(),
    replyToId: z.string().min(1).optional(),
}).refine(
    (data) => data.receiverId || data.conversationId,
    { message: "Either receiverId or conversationId must be provided" }
).refine(
    (data) => data.text || true, // File is checked separately via multer
    { message: "Message text or file is required" }
);

export const reactToMessageSchema = z.object({
    emoji: z
        .string()
        .min(1, { message: "Emoji is required" })
        .max(10, { message: "Emoji is too long" }),
});

export const createGroupSchema = z.object({
    groupName: z
        .string()
        .min(1, { message: "Group name is required" })
        .max(50, { message: "Group name must be 50 characters or less" })
        .trim(),
    participantIds: z
        .array(z.string().min(1))
        .min(1, { message: "At least one participant must be added" })
        .max(256, { message: "Group cannot have more than 256 participants" }),
    groupAvatar: z.string().url().optional(),
});

export const updateGroupMembersSchema = z.object({
    participantIds: z
        .array(z.string().min(1))
        .min(1, { message: "At least one participant must be provided" })
        .max(256, { message: "Group cannot have more than 256 participants" }),
});

export const conversationIdParams = z.object({
    conversationId: z.string().min(1, { message: "Invalid conversation ID" }),
});

export const targetUserParams = z.object({
    targetUserId: z.string().min(1, { message: "Invalid user ID" }),
});

export const messageIdParams = z.object({
    messageId: z.string().min(1, { message: "Invalid message ID" }),
});
