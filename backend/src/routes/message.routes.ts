import { Router } from "express";
import { deleteConversation, getConversations, getMessages, getOrCreateConversation, sendMessage } from "../controllers/message.controllers";
import upload from "../middlewares/multer";
import { authMiddlewares } from "../middlewares/auth.middlewares";

const messageRouter = Router();

messageRouter.use(authMiddlewares);

messageRouter.get('/conversations', getConversations);
messageRouter.get('/conversations/:conversationId/messages', getMessages);
messageRouter.get('/conversations/with/:targetUserId', getOrCreateConversation);
messageRouter.post('/send', upload.single('file'), sendMessage);
messageRouter.delete('/conversations/:conversationId', deleteConversation);

export default messageRouter;