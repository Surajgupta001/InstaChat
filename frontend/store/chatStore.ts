import { create } from 'zustand';
import type { Conversation, Message } from '../types';

interface ChatSlice {
    conversations: Conversation[];
    selectedConversation: Conversation | null;
    messages: Message[];
    typingUsers: Record<string, boolean>;

    setConversations: (conversations: Conversation[] | ((prev: Conversation[]) => Conversation[])) => void;
    setSelectedConversation: (conversation: Conversation | null | ((prev: Conversation | null) => Conversation | null)) => void;
    setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
    setTypingUsers: (typingUsers: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;

    // Optimized actions
    updateConversationLastMessage: (conversationId: string, message: Message) => void;
    addMessage: (message: Message) => void;
    markMessagesRead: (conversationId: string, senderId: string) => void;
    incrementConversationUnread: (conversationId: string) => void;
    clearConversationUnread: (conversationId: string) => void;
    updateMessageReactions: (messageId: string, reactions: any[]) => void;
    removeConversation: (conversationId: string) => void;
    reset: () => void;
}

const initialChat = {
    conversations: [],
    selectedConversation: null,
    messages: [],
    typingUsers: {},
};

export const useChatStore = create<ChatSlice>((set, get) => ({
    ...initialChat,

    setConversations: (conversationsOrFn) =>
        set((state) => ({
            conversations:
                typeof conversationsOrFn === 'function'
                    ? conversationsOrFn(state.conversations)
                    : conversationsOrFn,
        })),

    setSelectedConversation: (conversationOrFn) =>
        set((state) => ({
            selectedConversation:
                typeof conversationOrFn === 'function'
                    ? conversationOrFn(state.selectedConversation)
                    : conversationOrFn,
        })),

    setMessages: (messagesOrFn) =>
        set((state) => ({
            messages:
                typeof messagesOrFn === 'function'
                    ? messagesOrFn(state.messages)
                    : messagesOrFn,
        })),

    setTypingUsers: (typingOrFn) =>
        set((state) => ({
            typingUsers:
                typeof typingOrFn === 'function'
                    ? typingOrFn(state.typingUsers)
                    : typingOrFn,
        })),

    updateConversationLastMessage: (conversationId, message) =>
        set((state) => ({
            conversations: state.conversations
                .map((c) =>
                    c._id === conversationId
                        ? { ...c, lastMessage: message, updatedAt: message.createdAt }
                        : c
                )
                .sort(
                    (a, b) =>
                        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                ),
        })),

    addMessage: (message) =>
        set((state) => {
            if (
                state.messages.length > 0 &&
                state.messages[0].conversationId === message.conversationId
            ) {
                return { messages: [...state.messages, message] };
            }
            return state;
        }),

    markMessagesRead: (conversationId, senderId) =>
        set((state) => ({
            messages: state.messages.map((m) =>
                m.sender === senderId ? { ...m, read: true } : m
            ),
            conversations: state.conversations.map((c) => {
                if (c._id === conversationId) {
                    return {
                        ...c,
                        unreadCount: 0,
                        lastMessage: c.lastMessage ? ({ ...c.lastMessage, read: true } as Message) : undefined
                    };
                }
                return c;
            }),
        })),

    incrementConversationUnread: (conversationId) =>
        set((state) => ({
            conversations: state.conversations.map((c) =>
                c._id === conversationId
                    ? { ...c, unreadCount: (c.unreadCount || 0) + 1 }
                    : c
            ),
        })),

    clearConversationUnread: (conversationId) =>
        set((state) => ({
            conversations: state.conversations.map((c) =>
                c._id === conversationId
                    ? { ...c, unreadCount: 0 }
                    : c
            ),
        })),

    updateMessageReactions: (messageId, reactions) =>
        set((state) => ({
            messages: state.messages.map((m) =>
                m._id === messageId ? { ...m, reactions } : m
            ),
        })),

    removeConversation: (conversationId) =>
        set((state) => ({
            conversations: state.conversations.filter((c) => c._id !== conversationId),
            selectedConversation:
                state.selectedConversation?._id === conversationId
                    ? null
                    : state.selectedConversation,
        })),

    reset: () => set(initialChat),
}));
