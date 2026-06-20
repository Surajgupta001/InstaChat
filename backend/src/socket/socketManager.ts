import { verifyToken } from "@clerk/express";
import type { IncomingMessage } from "http";
import WebSocket, { WebSocketServer } from "ws";
import User from "../models/user.models";
import Conversation from "../models/conversation.models";

// Map userId -> Websocket
const onlineUser = new Map<string, WebSocket>();

// Initialize WebSocket server
export function initSocketServer(server: any) {
    const wss = new WebSocketServer({ server, path: "/ws" });

    wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
        console.log("New WebSocket connection established");

        // Extract token from query string: /ws?token=...
        const url = new URL(req.url!, `http://${req.headers.host}`);
        const token = url.searchParams.get("token");

        if (!token) {
            ws.close(1008, "Token is required");
            return;
        }

        let userId: string;
        try {
            const decode = await verifyToken(token, {
                secretKey: process.env.CLERK_SECRET_KEY!,
            });
            userId = decode.sub;
        } catch (error) {
            console.log("Token verification failed:", error);
            ws.close(1008, "Invalid token");
            return;
        }

        // Close existing connection if user reconnects from another device
        const existingWs = onlineUser.get(userId);
        if (existingWs && existingWs.readyState === WebSocket.OPEN) {
            existingWs.close(1000, "Replaced by new connection");
        }

        // Register the user as online
        onlineUser.set(userId, ws);
        await User.findByIdAndUpdate(userId, { isOnline: true });

        // Broadcast user becomes online to other users
        broadcastOnlineStatus(userId, true);

        ws.on('message', async (data: Buffer) => {
            try {
                const msg = JSON.parse(data.toString());

                // Forward message to receiver(s)
                if (msg.type === "message") {
                    const { receiverId, conversationId, payload } = msg;
                    if (conversationId) {
                        // Direct message with conversationId
                        await handleConversationEvent(userId, conversationId, { type: 'message', payload });
                    } else if (receiverId) {
                        // Legacy direct message
                        const receiverws = onlineUser.get(receiverId);
                        if (receiverws?.readyState === WebSocket.OPEN) {
                            receiverws.send(JSON.stringify({ type: "message", payload }));
                        }
                    }
                }

                // Forward typing indicator to receiver(s)
                if (msg.type === "typing") {
                    const { receiverId, conversationId, isTyping } = msg;

                    if (conversationId) {
                        // Update Typing status in conversation
                        await handleConversationEvent(userId, conversationId, { type: "typing", senderId: userId, isTyping });
                    } else if (receiverId) {
                        // Legacy typing indicator
                        const receiverws = onlineUser.get(receiverId);
                        if (receiverws?.readyState === WebSocket.OPEN) {
                            receiverws.send(JSON.stringify({ type: "typing", senderId: userId, isTyping }));
                        }
                    }
                }
            } catch (error: any) {
                console.error("Error processing message:", error);
            }
        })

        // Handle disconnection
        ws.on("close", async () => {
            console.log(`WebSocket connection closed for user ${userId}`);
            // Only remove from map if this is still the active connection
            if (onlineUser.get(userId) === ws) {
                onlineUser.delete(userId);
                await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
                broadcastOnlineStatus(userId, false);
            }
        })
    })
    return wss;
}

function broadcastOnlineStatus(userId: string, isOnline: boolean) {
    const payload = JSON.stringify({ type: "online_status", userId, isOnline });
    onlineUser.forEach((ws, uid) => {
        if (uid === userId) return; // Don't broadcast to the user themselves
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(payload);
        }
    });
};

export async function handleConversationEvent(senderId: string, conversationId: string, event: Record<string, any>) {
    try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            console.error(`Conversation with ID ${conversationId} not found`);
            return;
        }

        const payload = JSON.stringify(event);

        conversation.participants.forEach((pId) => {
            const participantId = String(pId);
            if (participantId === senderId) return; // Skip sender
            const ws = onlineUser.get(participantId);
            if (ws?.readyState === WebSocket.OPEN) {
                ws.send(payload);
            }
        })
    } catch (error) {
        console.error("Error broadcasting conversation event:", error);
    }
};

export function broadcastUserUpdate(user: any) {
    const payload = JSON.stringify({ type: "user_update", user });
    onlineUser.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(payload);
        }
    });
}

export { onlineUser };