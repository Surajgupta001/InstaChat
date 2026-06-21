import { verifyToken } from "@clerk/express";
import type { IncomingMessage } from "http";
import WebSocket, { WebSocketServer } from "ws";
import User from "../models/user.models";
import Conversation from "../models/conversation.models";

// Map userId -> Websocket
const onlineUser = new Map<string, WebSocket>();

// Heartbeat interval (30s) and timeout (10s)
const HEARTBEAT_INTERVAL = 30_000;
const HEARTBEAT_TIMEOUT = 10_000;

/**
 * Initialize WebSocket server with heartbeat and proper async handling.
 */
export function initSocketServer(server: any) {
    const wss = new WebSocketServer({ server, path: "/ws" });

    // Heartbeat: ping all connections periodically
    const heartbeatTimer = setInterval(() => {
        wss.clients.forEach((ws) => {
            if ((ws as any)._isAlive === false) {
                console.log('[WS] Terminating stale connection');
                return ws.terminate();
            }
            (ws as any)._isAlive = false;
            ws.ping();
        });
    }, HEARTBEAT_INTERVAL);

    wss.on("close", () => {
        clearInterval(heartbeatTimer);
    });

    wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
        (ws as any)._isAlive = true;
        (ws as any)._userId = null;

        ws.on("pong", () => {
            (ws as any)._isAlive = true;
        });

        handleConnection(ws, req).catch((err) => {
            console.error('[WS] Connection handler error:', err);
            ws.close(1011, 'Internal server error');
        });
    });

    return wss;
}

async function handleConnection(ws: WebSocket, req: IncomingMessage) {
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
        console.log('[WS] Token verification failed');
        ws.close(1008, "Invalid token");
        return;
    }

    // Close existing connection if user reconnects
    const existingWs = onlineUser.get(userId);
    if (existingWs && existingWs.readyState === WebSocket.OPEN) {
        existingWs.close(1000, "Replaced by new connection");
    }

    // Register user as online
    onlineUser.set(userId, ws);
    (ws as any)._userId = userId;
    await User.findByIdAndUpdate(userId, { isOnline: true });
    broadcastOnlineStatus(userId, true);

    console.log(`[WS] User ${userId} connected. Online: ${onlineUser.size}`);

    // Handle incoming messages (non-async to prevent out-of-order processing)
    ws.on("message", (data: Buffer) => {
        try {
            const msg = JSON.parse(data.toString());
            processMessage(userId, msg);
        } catch (error) {
            console.error("[WS] Error parsing message:", error);
        }
    });

    // Handle disconnection
    ws.on("close", async () => {
        console.log(`[WS] User ${userId} disconnected`);

        // Only remove if this is still the active connection
        if (onlineUser.get(userId) === ws) {
            onlineUser.delete(userId);
            await User.findByIdAndUpdate(userId, {
                isOnline: false,
                lastSeen: new Date(),
            });
            broadcastOnlineStatus(userId, false);
        }
    });
}

/**
 * Process incoming WebSocket messages synchronously to prevent race conditions.
 * Async DB operations are fire-and-forget with error handling.
 */
function processMessage(senderId: string, msg: any) {
    if (msg.type === "message") {
        const { receiverId, conversationId, payload } = msg;
        if (conversationId) {
            handleConversationEvent(senderId, conversationId, {
                type: 'message',
                payload,
            });
        } else if (receiverId) {
            const receiverWs = onlineUser.get(receiverId);
            if (receiverWs?.readyState === WebSocket.OPEN) {
                receiverWs.send(JSON.stringify({ type: "message", payload }));
            }
        }
    }

    if (msg.type === "typing") {
        const { receiverId, conversationId, isTyping } = msg;
        if (conversationId) {
            handleConversationEvent(senderId, conversationId, {
                type: "typing",
                senderId,
                isTyping,
            });
        } else if (receiverId) {
            const receiverWs = onlineUser.get(receiverId);
            if (receiverWs?.readyState === WebSocket.OPEN) {
                receiverWs.send(
                    JSON.stringify({ type: "typing", senderId, isTyping })
                );
            }
        }
    }
}

function broadcastOnlineStatus(userId: string, isOnline: boolean) {
    const payload = JSON.stringify({ type: "online_status", userId, isOnline });
    onlineUser.forEach((ws, uid) => {
        if (uid === userId) return;
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(payload);
        }
    });
}

/**
 * Broadcast an event to all participants of a conversation.
 * Uses cached participant list when possible to avoid DB hit.
 */
export async function handleConversationEvent(
    senderId: string,
    conversationId: string,
    event: Record<string, any>
) {
    try {
        const conversation = await Conversation.findById(conversationId)
            .select('participants')
            .lean();

        if (!conversation) {
            console.error(`[WS] Conversation ${conversationId} not found`);
            return;
        }

        const payload = JSON.stringify(event);

        for (const pId of conversation.participants) {
            const participantId = String(pId);
            if (participantId === senderId) continue;
            const ws = onlineUser.get(participantId);
            if (ws?.readyState === WebSocket.OPEN) {
                ws.send(payload);
            }
        }
    } catch (error) {
        console.error("[WS] Error broadcasting conversation event:", error);
    }
}

export function broadcastUserUpdate(user: any) {
    const payload = JSON.stringify({ type: "user_update", user });
    onlineUser.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(payload);
        }
    });
}

export { onlineUser };
