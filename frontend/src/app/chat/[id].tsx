import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, FlatList, TextInput, Alert, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native'
import { Image } from 'expo-image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getStyles } from '@/assets/styles/ChatScreen.styles';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeStyles } from '../../../context/ThemeContext';
import { formatTime } from '../../../utils/formateTime';
import { formatDateSeparator, isSameDay } from '../../../utils/formatDate';
import Avatar from '../../../components/Avatar';
import Bubble from '../../../components/Bubble';
import { MessageSkeleton } from '../../../components/Skeleton';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { api, useApp } from '../../../context/AppContext';
import { Message } from '../../../types';

const MESSAGE_HEIGHT_ESTIMATE = 80;
const GROUPING_THRESHOLD_MS = 60_000; // 1 minute

function DateSeparator({ date }: { date: string }) {
    const { colors } = useTheme();
    return (
        <View style={{ alignItems: 'center', marginVertical: 12 }}>
            <View style={{
                backgroundColor: 'rgba(139,92,246,0.12)',
                paddingHorizontal: 14,
                paddingVertical: 5,
                borderRadius: 12,
            }}>
                <Text style={{ fontSize: 11.5, color: colors.primary, fontWeight: '600', letterSpacing: 0.4 }}>
                    {formatDateSeparator(date)}
                </Text>
            </View>
        </View>
    );
}

export default function chatScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const {
        auth,
        conversations,
        messages,
        users,
        selectedConversation,
        typingUsers,
        setConversations,
        setMessages,
        sendWsEvent,
        setSelectedConversation,
    } = useApp();

    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [mediaUri, setMediaUri] = useState<string | null>(null);
    const [mediaMime, setMediaMime] = useState<string>('image/jpeg');
    const [mediaName, setMediaName] = useState<string>('media.jpg');
    const [reactingMsg, setReactingMsg] = useState<Message | null>(null);
    const [replyingMsg, setReplyingMsg] = useState<Message | null>(null);
    const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
    const [showScrollFab, setShowScrollFab] = useState(false);

    const { colors } = useTheme();
    const styles = useThemeStyles(getStyles);

    const flatListRef = useRef<FlatList>(null);
    const typingTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

    const partner = selectedConversation?.participant;
    const partnerId = useMemo(() => partner?._id, [partner?._id]);
    const userId = useMemo(() => auth.user?._id, [auth.user?._id]);

    useEffect(() => {
        if (id && conversations.length > 0) {
            const found = conversations.find((c) => c._id === id);
            if (found && selectedConversation?._id !== id) {
                setSelectedConversation(found);
            }
        }
    }, [id, conversations, selectedConversation, setSelectedConversation]);

    const fetchMessages = useCallback(async () => {
        if (!id || auth.loading) return;
        setLoading(true);
        try {
            const { data } = await api.get(`/messages/conversations/${id}/messages`);
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (err) {
            console.error(`[ChatScreen] Failed to load messages:`, err);
            setTimeout(fetchMessages, 1000);
        } finally {
            setLoading(false);
        }
    }, [id, auth.loading]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    const onRefresh = useCallback(async () => {
        if (!id) return;
        setRefreshing(true);
        try {
            const { data } = await api.get(`/messages/conversations/${id}/messages`);
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (err) {
            console.error('[ChatScreen] Refresh failed:', err);
        } finally {
            setRefreshing(false);
        }
    }, [id]);

    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const handleScroll = useCallback((event: any) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
        setShowScrollFab(distanceFromBottom > 200);
    }, []);

    const scrollToBottom = useCallback(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const flatData = useMemo(() => {
        const items: Array<{ type: 'date' | 'message'; data: any; key: string }> = [];
        let lastDate: string | null = null;

        for (const msg of messages) {
            if (!lastDate || !isSameDay(lastDate, msg.createdAt)) {
                items.push({ type: 'date', data: msg.createdAt, key: `date-${msg.createdAt}` });
                lastDate = msg.createdAt;
            }
            items.push({ type: 'message', data: msg, key: msg._id });
        }

        return items;
    }, [messages]);

    const renderItem = useCallback(
        ({ item, index }: { item: typeof flatData[number]; index: number }) => {
            if (item.type === 'date') {
                return <DateSeparator date={item.data} />;
            }

            const msg = item.data as Message;
            const isMine = msg.sender === userId;

            // Grouping logic: is this message grouped with the previous one?
            const prevItem = flatData[index - 1];
            const prevMsg = prevItem?.type === 'message' ? prevItem.data as Message : null;
            const nextItem = flatData[index + 1];
            const nextMsg = nextItem?.type === 'message' ? nextItem.data as Message : null;

            const isGrouped = !!prevMsg
                && prevMsg.sender === msg.sender
                && prevItem.type === 'message'
                && Math.abs(new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()) < GROUPING_THRESHOLD_MS;

            const showSender = !isMine && selectedConversation?.isGroup && (
                !prevMsg
                || prevMsg.sender !== msg.sender
                || Math.abs(new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()) >= GROUPING_THRESHOLD_MS
            );

            return (
                <Bubble
                    message={msg}
                    isMe={isMine}
                    showSender={showSender}
                    isGrouped={isGrouped}
                    onReply={(m) => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setReplyingMsg(m);
                    }}
                    onReact={(m) => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setReactingMsg(m);
                    }}
                    onLongPress={handleLongPress}
                />
            );
        },
        [userId, flatData, selectedConversation?.isGroup]
    );

    const keyExtractor = useCallback((item: typeof flatData[number]) => item.key, []);

    const handleReact = async (messageId: string, emoji: string) => {
        setReactingMsg(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            const message = messages.find((m) => m._id === messageId);
            if (message) {
                let updatedReactions = [...(message.reactions || [])];
                const existingIdx = updatedReactions.findIndex((r) => r.userId === userId);

                if (existingIdx > -1) {
                    if (updatedReactions[existingIdx].emoji === emoji) {
                        updatedReactions.splice(existingIdx, 1);
                    } else {
                        updatedReactions[existingIdx] = { userId: userId!, emoji };
                    }
                } else {
                    updatedReactions.push({ userId: userId!, emoji });
                }

                setMessages((prev) =>
                    prev.map((m) => (m._id === messageId ? { ...m, reactions: updatedReactions } : m))
                );
            }

            const { data } = await api.post(`/messages/${messageId}/react`, { emoji });
            if (data.success) {
                setMessages((prev) =>
                    prev.map((m) => (m._id === messageId ? { ...m, reactions: data.reactions } : m))
                );
            }
        } catch (err) {
            console.error('[React] Error:', err);
        }
    };

    const deleteChat = () => {
        Alert.alert('Confirm delete', 'Delete this chat? This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const { data } = await api.delete(`/messages/conversations/${selectedConversation?._id}`);
                        if (data.success) {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            setConversations((prev) => prev.filter((c) => c._id !== selectedConversation?._id));
                            setSelectedConversation(null);
                            router.back();
                        }
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete the chat. Please try again.');
                    }
                },
            },
        ]);
    };

    const pickMedia = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Allow access to your media library to send photos and videos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0].uri) {
            const asset = result.assets[0];
            setMediaUri(asset.uri);
            setMediaMime(asset.mimeType || 'image/jpeg');
            setMediaName(asset.fileName || (asset.mimeType === 'video' ? 'video.mp4' : 'photo.jpg'));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const handleLongPress = (msg: Message) => {
        const isMine = msg.sender === userId;
        if (!isMine) return;

        Alert.alert(
            'Message Options',
            'Choose an action for this message',
            [
                {
                    text: 'Edit Message',
                    onPress: () => {
                        setEditingMsgId(msg._id);
                        setText(msg.text || '');
                        setReplyingMsg(null);
                    }
                },
                {
                    text: 'Delete Message',
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert(
                            'Confirm Delete',
                            'Delete this message for everyone?',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Delete',
                                    style: 'destructive',
                                    onPress: async () => {
                                        try {
                                            const { data } = await api.delete(`/messages/${msg._id}`);
                                            if (data.success) {
                                                setMessages((prev) => prev.filter((m) => m._id !== msg._id));
                                                sendWsEvent({ type: 'message_deleted', conversationId: id, messageId: msg._id });
                                            }
                                        } catch (error) {
                                            Alert.alert('Error', 'Failed to delete message');
                                        }
                                    }
                                }
                            ]
                        );
                    }
                },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    const send = async () => {
        if (sending || (!text.trim() && !mediaUri)) return;
        setSending(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (editingMsgId) {
            try {
                const { data } = await api.put<{ success: boolean }>(`/messages/${editingMsgId}`, {
                    text: text.trim(),
                });
                if (data.success) {
                    setMessages((prev) =>
                        prev.map((m) => (m._id === editingMsgId ? { ...m, text: text.trim() } : m))
                    );
                    sendWsEvent({
                        type: 'message_edited',
                        conversationId: id,
                        messageId: editingMsgId,
                        text: text.trim(),
                    });
                    setText('');
                    setEditingMsgId(null);
                }
            } catch (error: any) {
                console.error('[edit] Error:', error);
                Alert.alert('Error', 'Failed to edit message. Please try again.');
            } finally {
                setSending(false);
            }
            return;
        }

        try {
            const formData = new FormData();
            if (partnerId) {
                formData.append('receiverId', partnerId);
            }
            formData.append('conversationId', id);
            if (text.trim()) {
                formData.append('text', text.trim());
            }
            if (mediaUri) {
                formData.append('file', {
                    uri: mediaUri,
                    type: mediaMime,
                    name: mediaName,
                } as any);
            }
            if (replyingMsg) {
                formData.append('replyToId', replyingMsg._id);
            }

            const { data } = await api.post<{ success: boolean; message: Message }>('/messages/send', formData);
            if (data.success) {
                setMessages((prev) => [...prev, data.message]);
                const target = partnerId ? { receiverId: partnerId } : { conversationId: id };
                sendWsEvent({ type: 'message', ...target, payload: data.message });
                setText('');
                setMediaUri(null);
                setReplyingMsg(null);
            }
        } catch (error: any) {
            console.error('[send] Error:', error?.response?.status);
            Alert.alert('Error', error.response?.data?.message || 'Failed to send message. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const handleTyping = (val: string) => {
        setText(val);
        const target = partnerId ? { receiverId: partnerId } : { conversationId: id };
        if (!target.receiverId && !target.conversationId) return;
        sendWsEvent({ type: 'typing', ...target, isTyping: true });

        if (typingTimerRef.current) {
            clearTimeout(typingTimerRef.current);
        }
        typingTimerRef.current = setTimeout(() => {
            sendWsEvent({ type: 'typing', ...target, isTyping: false });
        }, 1500);
    };

    const typingEntries = useMemo(() => {
        return Object.entries(typingUsers).filter(([uid, isTyping]) => {
            if (!isTyping || uid === userId) return false;
            if (selectedConversation?.isGroup) {
                const memberIds =
                    selectedConversation.members?.map((m) => (typeof m === 'string' ? m : m._id)) || [];
                return memberIds.includes(uid);
            }
            return partnerId === uid;
        });
    }, [typingUsers, userId, selectedConversation, partnerId]);

    if (!selectedConversation) {
        return (
            <SafeAreaView style={styles.safe}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
                </TouchableOpacity>
                <View style={styles.emptyState}>
                    <Ionicons name="chatbubbles-outline" size={52} color={colors.outlineVariant} />
                </View>
                <Text style={styles.emptyText}>Conversation not found yet..</Text>
            </SafeAreaView>
        );
    }

    const isGroup = selectedConversation.isGroup;
    const headerName = isGroup ? selectedConversation.groupName || 'Group Chat' : partner?.name || 'User';
    const headerAvatar = isGroup ? selectedConversation.groupAvatar : partner?.avatar;
    const headerSub = isGroup
        ? `${selectedConversation.members?.length || 0} members`
        : partner?.isOnline
          ? 'Online'
          : partner?.lastSeen
            ? `Last seen ${formatTime(partner.lastSeen)}`
            : 'Offline';

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
                </TouchableOpacity>
                <Avatar name={headerName} src={headerAvatar} size={38} online={isGroup ? undefined : partner?.isOnline} />
                <View style={styles.headerInfo}>
                    <Text style={styles.headerName} numberOfLines={1}>
                        {headerName}
                        {!isGroup && partner?.handle && <Text style={styles.headerHandle}> @{partner?.handle}</Text>}
                    </Text>
                    <Text style={[styles.headerSub, !isGroup && partner?.isOnline && { color: colors.online }]}>
                        {headerSub}
                    </Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.backBtn}>
                        <Ionicons name="call-outline" size={20} color={colors.onSurfaceVariant} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.backBtn}>
                        <Ionicons name="videocam-outline" size={20} color={colors.onSurfaceVariant} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.backBtn} onPress={deleteChat}>
                        <Ionicons name="trash-outline" size={20} color={colors.onSurfaceVariant} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Main */}
            <KeyboardAvoidingView
                style={styles.kav}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* Messages */}
                {loading ? (
                    <View style={{ flex: 1, paddingTop: 20 }}>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <MessageSkeleton key={i} isMine={i % 3 === 0} />
                        ))}
                    </View>
                ) : (
                    <View style={{ flex: 1 }}>
                        <FlatList
                            ref={flatListRef}
                            data={flatData}
                            keyExtractor={keyExtractor}
                            renderItem={renderItem}
                            contentContainerStyle={styles.messageList}
                            windowSize={11}
                            maxToRenderPerBatch={15}
                            updateCellsBatchingPeriod={50}
                            removeClippedSubviews={true}
                            initialNumToRender={20}
                            onScroll={handleScroll}
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={onRefresh}
                                    tintColor={colors.primary}
                                    colors={[colors.primary]}
                                />
                            }
                        />
                        {/* Scroll to bottom FAB */}
                        {showScrollFab && (
                            <TouchableOpacity
                                onPress={scrollToBottom}
                                style={styles.scrollFab}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="chevron-down" size={22} color={colors.onSurface} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Typing indicator */}
                {typingEntries.length > 0 && (
                    <View style={styles.typingRow}>
                        {typingEntries.map(([uid]) => {
                            const u = users.find((x) => x._id === uid) || partner;
                            return (
                                <Text style={styles.typingText} key={uid}>
                                    {u?.name || 'Someone'} is typing...
                                </Text>
                            );
                        })}
                    </View>
                )}

                {/* Input bar */}
                <View style={styles.inputBar}>
                    {replyingMsg && (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: colors.surfaceLow,
                                borderLeftWidth: 4,
                                borderLeftColor: colors.primary,
                                paddingLeft: 12,
                                paddingRight: 8,
                                paddingVertical: 8,
                                marginHorizontal: 12,
                                marginBottom: 8,
                                borderRadius: 8,
                            }}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                                    Replying to{' '}
                                    {replyingMsg.sender === userId
                                        ? 'You'
                                        : isGroup
                                          ? users.find((u) => u._id === replyingMsg.sender)?.name || 'User'
                                          : partner?.name || 'User'}
                                </Text>
                                <Text style={{ fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 }} numberOfLines={1}>
                                    {replyingMsg.text || (replyingMsg.mediaType === 'image' ? 'Photo' : 'Video')}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setReplyingMsg(null)} style={{ padding: 4 }}>
                                <Ionicons name="close-circle" size={20} color={colors.outline} />
                            </TouchableOpacity>
                        </View>
                    )}

                    {editingMsgId && (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: colors.surfaceLow,
                                borderLeftWidth: 4,
                                borderLeftColor: colors.primary,
                                paddingLeft: 12,
                                paddingRight: 8,
                                paddingVertical: 8,
                                marginHorizontal: 12,
                                marginBottom: 8,
                                borderRadius: 8,
                            }}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                                    Editing message
                                </Text>
                                <Text style={{ fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 }} numberOfLines={1}>
                                    {messages.find((m) => m._id === editingMsgId)?.text || ''}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => { setEditingMsgId(null); setText(''); }} style={{ padding: 4 }}>
                                <Ionicons name="close-circle" size={20} color={colors.outline} />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.inputRow}>
                        {mediaUri ? (
                            <View style={{ position: 'relative', marginRight: 6, marginBottom: 2, alignSelf: 'flex-end' }}>
                                <Image source={{ uri: mediaUri }} style={{ width: 34, height: 34, borderRadius: 8, borderWidth: 1, borderColor: colors.primary }} contentFit="cover" />
                                <TouchableOpacity 
                                    style={{ 
                                        position: 'absolute', 
                                        top: -6, 
                                        right: -6, 
                                        backgroundColor: colors.error, 
                                        borderRadius: 8,
                                        width: 16,
                                        height: 16,
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }} 
                                    onPress={() => setMediaUri(null)}
                                >
                                    <Ionicons name="close" size={10} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.attachBtn} onPress={pickMedia}>
                                <Ionicons name="image-outline" size={22} color={colors.onSurfaceVariant} />
                            </TouchableOpacity>
                        )}

                        <TextInput
                            style={styles.textInput}
                            placeholder="Type a message..."
                            value={text}
                            onChangeText={handleTyping}
                            placeholderTextColor={colors.outlineVariant}
                            multiline
                            maxLength={2000}
                        />

                        <TouchableOpacity
                            disabled={sending || (!text.trim() && !mediaUri)}
                            activeOpacity={0.5}
                            onPress={send}
                            style={[!text.trim() && !mediaUri && styles.sendBtnDisabled]}
                        >
                            <LinearGradient colors={[colors.sentBubbleStart, colors.sentBubbleEnd]} style={[styles.sendBtn]}>
                                {sending ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Ionicons name="paper-plane" size={16} color="#fff" />
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* Emoji Reactions Overlay */}
            {reactingMsg && (
                <View style={StyleSheet.absoluteFill}>
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => setReactingMsg(null)}
                        style={[
                            StyleSheet.absoluteFill,
                            { backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 999 },
                        ]}
                    />
                    <View
                        style={{
                            position: 'absolute',
                            top: '45%',
                            alignSelf: 'center',
                            backgroundColor: colors.surfaceLowest,
                            borderRadius: 28,
                            flexDirection: 'row',
                            paddingHorizontal: 18,
                            paddingVertical: 12,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 6 },
                            shadowOpacity: 0.2,
                            shadowRadius: 12,
                            elevation: 8,
                            zIndex: 1000,
                            gap: 14,
                            borderWidth: 1,
                            borderColor: colors.inputBarBorder,
                        }}
                    >
                        {['❤️', '😂', '👍', '😮', '😢', '🙏'].map((emoji) => (
                            <TouchableOpacity key={emoji} onPress={() => handleReact(reactingMsg._id, emoji)} activeOpacity={0.6}>
                                <Text style={{ fontSize: 26 }}>{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}
