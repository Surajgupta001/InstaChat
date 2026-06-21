import { createContext, Dispatch, ReactNode, SetStateAction, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AuthState, Conversation, Message, User, UserStory, WsEvent } from "../types";
import axios from "axios";
import { API_BASE_URL, WS_BASE_URL } from "../constants/Config";
import { useAuth, useUser } from "@clerk/clerk-expo";

export const api = axios.create({
    baseURL: API_BASE_URL,
});

const _tokenRef = { current: null as string | null };

interface AppContextType {
    auth: AuthState;
    logout: () => Promise<void>;
    updateUser: (user: User) => Promise<void>;

    users: User[];
    setUsers: Dispatch<SetStateAction<User[]>>;

    userStories: UserStory[];
    setUserStories: Dispatch<SetStateAction<UserStory[]>>;

    conversations: Conversation[];
    setConversations: Dispatch<SetStateAction<Conversation[]>>;
    selectedConversation: Conversation | null;
    setSelectedConversation: (c: Conversation | null) => void;

    messages: Message[];
    setMessages: Dispatch<SetStateAction<Message[]>>;

    fetchStories: () => Promise<void>;
    typingUsers: Record<string, boolean>;
    sendWsEvent: (data: object) => void;
}


const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {

    const [auth, setAuth] = useState<AuthState>({ token: null, user: null, loading: true });
    const [users, setUsers] = useState<User[]>([]);

    const { getToken, isLoaded: authLoaded, isSignedIn, signOut } = useAuth();
    const { user: clerkUser, isLoaded: userLoaded } = useUser();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [userStories, setUserStories] = useState<UserStory[]>([]);
    const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

    const wsRef = useRef<WebSocket | null>(null);

    const getTokenRef = useRef(getToken);

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
        })

        return () => {
            api.interceptors.request.eject(interceptor);
        }
    }, [isSignedIn])

    // Keep Local AuthState in sync with DB — triggers lazy user creation in backend
    useEffect(() => {
        if (!authLoaded || !userLoaded) return;

        if (isSignedIn && clerkUser) {
            // Fetch token first to ensure interceptor has it before the API call
            getTokenRef.current().then((token) => {
                if (token) _tokenRef.current = token;

                // Fetch real DB user — authMiddlewares will auto-create if not exists
                api.get('/users/profile')
                    .then(({ data }) => {
                        if (data.success) {
                            setAuth({ token: _tokenRef.current, user: data.user, loading: false });
                        }
                    })
                    .catch(() => {
                        // Fallback to Clerk data if backend is unreachable
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
                        setAuth({ token: _tokenRef.current, user: mappedUser, loading: false });
                    });
            });
        } else {
            setAuth({ token: null, user: null, loading: false });
        }
    }, [isSignedIn, authLoaded, userLoaded, clerkUser]);

    const logout = useCallback(async () => {
        _tokenRef.current = null;
        wsRef.current?.close();
        await signOut();
        setAuth({ token: null, user: null, loading: false });
        setConversations([]);
        setMessages([]);
        setSelectedConversation(null);
    }, [signOut]);

    const updateUser = useCallback(async (user: User) => {
        setAuth((prev) => ({ ...prev, user }));
    }, []);

    const fetchStories = useCallback(async () => {
        if (!_tokenRef.current) return;
        try {
            const { data } = await api.get('/stories');
            if (data.success) {
                setUserStories(data.stories);
            }
        } catch (error) {
            // Retry after 3s until successful, but only if still signed in
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

    // Websocket lifecycle secures with dynamic clerk token
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

                ws.onopen = () => {
                    console.log('✅ WebSocket established');
                };

                ws.onmessage = (e) => {
                    const event: WsEvent = JSON.parse(e.data);

                    if (event.type === 'message') {
                        const incoming = event.payload as Message;
                        setMessages((prev) => {
                            if (prev.length > 0 && prev[0].conversationId === incoming.conversationId) {
                                // Append to end — messages are sorted oldest-first (ASC)
                                return [...prev, incoming];
                            }
                            return prev;
                        })

                        setConversations((prev) => {
                            const exists = prev.some((c) => c._id === incoming.conversationId);
                            if (!exists) {
                                // Fetch all conversations if the incoming one doesn't exist locally
                                api.get('/messages/conversations')
                                    .then(({ data }) => {
                                        if (data.success) {
                                            setConversations(data.conversations);
                                        }
                                    }).catch(console.error);

                                return prev;
                            }

                            return prev.map((c) => c._id === incoming.conversationId ? { ...c, lastMessage: incoming, updatedAt: incoming.createdAt } : c).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                        })
                    }

                    if (event.type === 'typing') {
                        const { senderId, isTyping } = event;
                        if (senderId && isTyping !== undefined) {
                            setTypingUsers((prev) => ({ ...prev, [senderId]: isTyping }));
                        }
                    }

                    if (event.type === 'online_status') {
                        const { userId, isOnline } = event;
                        if (userId && isOnline !== undefined) {
                            setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, isOnline } : u));
                            setConversations((prev) => prev.map((c) => {
                                if (c.participant?._id === userId) {
                                    // Fix: correct key 'participant', not 'participants'
                                    return { ...c, participant: { ...c.participant, isOnline } };
                                }
                                return c;
                            }));
                        }
                    }

                    if (event.type === 'user_update') {
                        const updated = event.user as User;

                        if (updated) {
                            setUsers((prev) => prev.map((u) => u._id === updated._id ? updated : u));
                            setConversations((prev) => prev.map((c) => {
                                if (c.participant?._id === updated._id) {
                                    return { ...c, participant: updated };
                                }
                                return c;
                            }));
                            setSelectedConversation((prev) => {
                                if (prev && prev.participant?._id === updated._id) {
                                    return { ...prev, participant: updated };
                                }
                                return prev;
                            });
                            setUserStories((prev) => prev.map((s) => s.user._id === updated._id ? { ...s, user: updated } : s))
                        }
                    }

                    if (event.type === 'chat_deleted') {
                        const { conversationId } = event;
                        if (conversationId) {
                            setConversations((prev) => prev.filter((c) => c._id !== conversationId));
                            setSelectedConversation((prev) => (prev?._id === conversationId ? null : prev));
                        }
                    }
                };
                ws.onerror = () => {
                    console.warn('[WS] Error — closing and will reconnect');
                    ws?.close();
                    // Reconnect after a short delay
                    if (isMounted) {
                        setTimeout(() => connectWs(), 3000);
                    }
                };
            } catch (error) {
                console.error('WebSocket connection error:', error);
            }
        };

        connectWs();

        return () => {
            isMounted = false;
            ws?.close();
        }
    }, [isSignedIn, authLoaded, userLoaded]);

    return (
        <AppContext.Provider value={{
            auth,
            logout,
            updateUser,
            users,
            setUsers,
            conversations,
            setConversations,
            selectedConversation,
            setSelectedConversation,
            messages,
            setMessages,
            userStories,
            setUserStories,
            fetchStories,
            typingUsers,
            sendWsEvent
        }}>
            {children}
        </AppContext.Provider>
    )
};

export function useApp() {
    const context = useContext(AppContext);

    if (!context) {
        throw new Error("useApp must be used within an AppProvider");
    }

    return context;
}