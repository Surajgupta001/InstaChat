import { Router } from "express";
import {
    deleteConversation,
    getConversations,
    getMessages,
    getOrCreateConversation,
    sendMessage,
    markMessagesAsRead,
    reactToMessage,
    createGroupConversation,
    updateGroupMembers,
    deleteMessage,
    editMessage,
} from "../controllers/message.controllers";
import upload from "../middlewares/multer";
import { authMiddlewares } from "../middlewares/auth.middlewares";
import { validate } from "../middlewares/validate";
import {
    sendMessageSchema,
    reactToMessageSchema,
    createGroupSchema,
    updateGroupMembersSchema,
    conversationIdParams,
    targetUserParams,
    messageIdParams,
} from "../validations/message.schema";
import { messageLimiter, uploadLimiter } from "../middlewares/rateLimiter";

const messageRouter = Router();

messageRouter.use(authMiddlewares);

messageRouter.get('/conversations', getConversations);
messageRouter.post('/conversations/group', validate(createGroupSchema), createGroupConversation);
messageRouter.put('/conversations/group/:conversationId/members', validate(updateGroupMembersSchema), updateGroupMembers);
messageRouter.get('/conversations/:conversationId/messages', getMessages);
messageRouter.get('/conversations/with/:targetUserId', getOrCreateConversation);
messageRouter.put('/conversations/:conversationId/read', markMessagesAsRead);
messageRouter.post('/:messageId/react', validate(reactToMessageSchema), reactToMessage);
messageRouter.post('/send', uploadLimiter, upload.single('file'), messageLimiter, sendMessage);
messageRouter.delete('/conversations/:conversationId', deleteConversation);
messageRouter.delete('/:messageId', deleteMessage);
messageRouter.put('/:messageId', editMessage);

export default messageRouter;
