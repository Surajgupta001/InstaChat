import { createContext, ReactNode, useCallback, useContext, useEffect, useRef } from "react";
import type { Conversation, Message, User, UserStory, WsEvent } from "../types";
import axios from "axios";
import { API_BASE_URL, WS_BASE_URL } from "../constants/Config";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useAuthStore, useChatStore, useUiStore } from "../store";

export const api = axios.create({
    baseURL: API_BASE_URL,
});

const _tokenRef = { current: null as string | null };

type Setter<T> = T | ((prev: T) => T);

interface AppContextType {
    auth: { user: User | null; token: string | null; loading: boolean };
    logout: () => Promise<void>;
    updateUser: (user: User) => Promise<void>;

    users: User[];
    setUsers: (users: Setter<User[]>) => void;

    userStories: UserStory[];
    setUserStories: (stories: Setter<UserStory[]>) => void;

    conversations: Conversation[];
    setConversations: (conversations: Setter<Conversation[]>) => void;
    selectedConversation: Conversation | null;
    setSelectedConversation: (c: Conversation | null) => void;

    messages: Message[];
    setMessages: (messages: Setter<Message[]>) => void;

    fetchStories: () => Promise<void>;
    typingUsers: Record<string, boolean>;
    sendWsEvent: (data: object) => void;
    markAsRead: (conversationId: string) => Promise<void>;
    createGroup: (groupName: string, participantIds: string[]) => Promise<Conversation | null>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
    const { getToken, isLoaded: authLoaded, isSignedIn, signOut } = useAuth();
    const { user: clerkUser, isLoaded: userLoaded } = useUser();

    const wsRef = useRef<WebSocket | null>(null);
    const getTokenRef = useRef(getToken);

    // Zustand stores
    const authStore = useAuthStore();
    const chatStore = useChatStore();
    const uiStore = useUiStore();

    // Selected conversation ref for WS handler
    const selectedConversationRef = useRef(chatStore.selectedConversation);
    useEffect(() => {
        selectedConversationRef.current = chatStore.selectedConversation;
    }, [chatStore.selectedConversation]);

    useEffect(() => {
        getTokenRef.current = getToken;
    }, [getToken]);

    // Attach clerk token on every request
    useEffect(() => {
        const interceptor = api.interceptors.request.use(async (config) => {
            try {
                if (isSignedIn) {
                    const token = await getTokenRef.current();
                    if (token) {
                        config.headers['Authorization'] = `Bearer ${token}`;
                        _tokenRef.current = token;
                    }
                }
            } catch (err) {
                console.error('Axios interceptor error:', err);
            }
            return config;
        });
        return () => {
            api.interceptors.request.eject(interceptor);
        };
    }, [isSignedIn]);

    // Keep Local AuthState in sync with DB
    useEffect(() => {
        if (!authLoaded || !userLoaded) return;

        if (isSignedIn && clerkUser) {
            getTokenRef.current().then((token) => {
                if (token) _tokenRef.current = token;

                api.get('/users/profile')
                    .then(({ data }) => {
                        if (data.success) {
                            authStore.setAuth({ token: _tokenRef.current, user: data.user, loading: false });
                        }
                    })
                    .catch(() => {
                        const mappedUser: User = {
                            _id: clerkUser.id,
                            name: clerkUser.firstName || '',
                            email: clerkUser.primaryEmailAddress?.emailAddress || '',
                            handle: clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || clerkUser.id,
                            avatar: clerkUser.imageUrl || '',
                            bio: (clerkUser.publicMetadata?.bio as string) || 'Hey there! I am using InstaChat.',
                            isOnline: true,
                            lastSeen: new Date().toISOString(),
                        };
                        authStore.setAuth({ token: _tokenRef.current, user: mappedUser, loading: false });
                    });
            });
        } else {
            authStore.setAuth({ token: null, user: null, loading: false });
        }
    }, [isSignedIn, authLoaded, userLoaded, clerkUser]);

    const logout = useCallback(async () => {
        _tokenRef.current = null;
        wsRef.current?.close();
        await signOut();
        authStore.reset();
        chatStore.reset();
    }, [signOut]);

    const updateUser = useCallback(async (user: User) => {
        authStore.setUser(user);
    }, []);

    const fetchStories = useCallback(async () => {
        if (!_tokenRef.current) return;
        try {
            const { data } = await api.get('/stories');
            if (data.success) {
                uiStore.setUserStories(data.stories);
            }
        } catch (error) {
            if (_tokenRef.current) {
                setTimeout(() => fetchStories(), 3000);
            }
        }
    }, []);

    const sendWsEvent = useCallback((data: object) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(data));
        }
    }, []);

    const markAsRead = useCallback(async (conversationId: string) => {
        if (!_tokenRef.current) return;
        try {
            await api.put(`/messages/conversations/${conversationId}/read`);
        } catch (error) {
            console.error('[markAsRead] Failed:', error);
        }
    }, []);

    const createGroup = useCallback(async (groupName: string, participantIds: string[]) => {
        if (!_tokenRef.current) return null;
        try {
            const { data } = await api.post('/messages/conversations/group', { groupName, participantIds });
            if (data.success) {
                chatStore.setConversations((prev) => [data.conversation, ...prev]);
                return data.conversation;
            }
        } catch (error) {
            console.error('[createGroup] Failed:', error);
        }
        return null;
    }, []);

    const setSelectedConversation = useCallback((c: Conversation | null) => {
        chatStore.setSelectedConversation(c);
        if (c) {
            chatStore.clearConversationUnread(c._id);
            api.put(`/messages/conversations/${c._id}/read`).catch(console.error);
        }
    }, []);

    // WebSocket lifecycle
    useEffect(() => {
        if (!isSignedIn || !authLoaded || !userLoaded) {
            wsRef.current?.close();
            return;
        }

        let isMounted = true;
        let ws: WebSocket | null = null;

        const connectWs = async () => {
            try {
                const token = await getTokenRef.current();
                if (!token || !isMounted) return;

                ws = new WebSocket(`${WS_BASE_URL}/ws?token=${token}`);
                wsRef.current = ws;

                ws.onopen = () => console.log('WebSocket connected');

                ws.onmessage = (e) => {
                    const event: WsEvent = JSON.parse(e.data);
                    const userId = authStore.user?._id;

                    if (event.type === 'message') {
                        const incoming = event.payload as Message;

                        const isCurrentChat = selectedConversationRef.current?._id === incoming.conversationId;

                        if (isCurrentChat) {
                            incoming.read = true;
                            api.put(`/messages/conversations/${incoming.conversationId}/read`).catch(console.error);
                            chatStore.clearConversationUnread(incoming.conversationId);
                        } else {
                            chatStore.incrementConversationUnread(incoming.conversationId);
                        }

                        chatStore.addMessage(incoming);
                        chatStore.updateConversationLastMessage(incoming.conversationId, incoming);

                        // If conversation doesn't exist locally, refresh list
                        const exists = useChatStore.getState().conversations.some(
                            (c) => c._id === incoming.conversationId
                        );
                        if (!exists) {
                            api.get('/messages/conversations')
                                .then(({ data }) => {
                                    if (data.success) chatStore.setConversations(data.conversations);
                                })
                                .catch(console.error);
                        }
                    }

                    if (event.type === 'messages_read') {
                        const { conversationId } = event;
                        if (conversationId && userId) {
                            chatStore.markMessagesRead(conversationId, userId);
                        }
                    }

                    if (event.type === 'message_reaction') {
                        const { messageId, reactions } = event;
                        if (messageId) chatStore.updateMessageReactions(messageId, reactions);
                    }

                    if (event.type === 'new_group_chat') {
                        api.get('/messages/conversations')
                            .then(({ data }) => {
                                if (data.success) chatStore.setConversations(data.conversations);
                            })
                            .catch(console.error);
                    }

                    if (event.type === 'group_members_updated') {
                        const { conversationId, participants } = event;
                        if (conversationId && participants) {
                            chatStore.setConversations((prev) =>
                                prev.map((c) => (c._id === conversationId ? { ...c, participants } : c))
                            );
                        }
                    }

                    if (event.type === 'typing') {
                        const { senderId, isTyping } = event;
                        if (senderId && isTyping !== undefined) {
                            chatStore.setTypingUsers((prev) => ({ ...prev, [senderId]: isTyping }));
                        }
                    }

                    if (event.type === 'online_status') {
                        const { userId: uid, isOnline } = event;
                        if (uid && isOnline !== undefined) {
                            uiStore.updateUserOnlineStatus(uid, isOnline);
                            chatStore.setConversations((prev) =>
                                prev.map((c) => {
                                    if (c.participant?._id === uid) {
                                        return { ...c, participant: { ...c.participant, isOnline } };
                                    }
                                    return c;
                                })
                            );
                        }
                    }

                    if (event.type === 'user_update') {
                        const updated = event.user as User;
                        if (updated) {
                            uiStore.updateUser(updated);
                            chatStore.setConversations((prev) =>
                                prev.map((c) =>
                                    c.participant?._id === updated._id
                                        ? { ...c, participant: updated }
                                        : c
                                )
                            );
                            chatStore.setSelectedConversation((prev) => {
                                if (prev && prev.participant?._id === updated._id) {
                                    return { ...prev, participant: updated };
                                }
                                return prev;
                            });
                        }
                    }

                    if (event.type === 'chat_deleted') {
                        const { conversationId } = event;
                        if (conversationId) chatStore.removeConversation(conversationId);
                    }

                    if (event.type === 'message_edited') {
                        const { messageId, text } = event;
                        if (messageId && text) {
                            chatStore.setMessages((prev) =>
                                prev.map((m) => (m._id === messageId ? { ...m, text } : m))
                            );
                            chatStore.setConversations((prev) =>
                                prev.map((c) => {
                                    if (c.lastMessage && c.lastMessage._id === messageId) {
                                        return { ...c, lastMessage: { ...c.lastMessage, text } as Message };
                                    }
                                    return c;
                                })
                            );
                        }
                    }

                    if (event.type === 'message_deleted') {
                        const { messageId } = event;
                        if (messageId) {
                            chatStore.setMessages((prev) =>
                                prev.filter((m) => m._id !== messageId)
                            );
                            chatStore.setConversations((prev) =>
                                prev.map((c) => {
                                    if (c.lastMessage?._id === messageId) {
                                        return { ...c, lastMessage: undefined };
                                    }
                                    return c;
                                })
                            );
                        }
                    }
                };

                ws.onerror = () => {
                    ws?.close();
                    if (isMounted) setTimeout(() => connectWs(), 3000);
                };
            } catch (error) {
                console.error('WebSocket connection error:', error);
            }
        };

        connectWs();

        return () => {
            isMounted = false;
            ws?.close();
        };
    }, [isSignedIn, authLoaded, userLoaded]);

    return (
        <AppContext.Provider
            value={{
                auth: { user: authStore.user, token: authStore.token, loading: authStore.loading },
                logout,
                updateUser,
                users: uiStore.users,
                setUsers: uiStore.setUsers,
                conversations: chatStore.conversations,
                setConversations: chatStore.setConversations,
                selectedConversation: chatStore.selectedConversation,
                setSelectedConversation,
                messages: chatStore.messages,
                setMessages: chatStore.setMessages,
                userStories: uiStore.userStories,
                setUserStories: uiStore.setUserStories,
                fetchStories,
                typingUsers: chatStore.typingUsers,
                sendWsEvent,
                markAsRead,
                createGroup,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useApp must be used within an AppProvider");
    }
    return context;
}
