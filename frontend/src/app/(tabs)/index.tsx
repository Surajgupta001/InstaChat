import { View, Text, TextInput, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native'
import { useCallback, useEffect, useState } from 'react'
import { Conversation, UserStory } from '../../../types';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getStyles } from '@/assets/styles/MessagesScreen.styles';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeStyles } from '../../../context/ThemeContext';
import StoryBar from '../../../components/StoryBar';
import StoryViewer from '../../../components/StoryViewer';
import ConversationItem from '../../../components/ConversationItem';
import { ConversationSkeleton } from '../../../components/Skeleton';
import { api, useApp } from '../../../context/AppContext';

export default function MessagesScreen() {
    const { auth, setSelectedConversation, conversations, setConversations } = useApp();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'unread' | 'groups'>('all');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedStories, setSelectedStories] = useState<UserStory | null>(null);

    const router = useRouter();
    const { colors } = useTheme();
    const styles = useThemeStyles(getStyles);

    const fetchConversations = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get<{ success: boolean; conversations: Conversation[] }>('/messages/conversations');
            if (data.success) {
                setConversations(data.conversations);
            }
        } catch (err) {
            console.error('Failed to load conversations:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            const { data } = await api.get<{ success: boolean; conversations: Conversation[] }>('/messages/conversations');
            if (data.success) {
                setConversations(data.conversations);
            }
        } catch (err) {
            console.error('Failed to refresh conversations:', err);
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (!auth.loading) {
            fetchConversations();
        }
    }, [auth.loading]);

    const unreadConvosCount = conversations.filter(c => {
        const isLastMsgFromMe = c.lastMessage?.sender === auth.user?._id;
        const isUnread = !isLastMsgFromMe && c.lastMessage && !c.lastMessage.read;
        return (c.unreadCount ?? 0) > 0 || isUnread;
    }).length;

    const groupsCount = conversations.filter(c => c.isGroup).length;

    const lowerSearch = search.toLowerCase();
    const filtered = conversations.filter((c) => {
        const matchesSearch = search
            ? (c.isGroup
                  ? c.groupName?.toLowerCase().includes(lowerSearch)
                  : c.participant?.name.toLowerCase().includes(lowerSearch) ||
                    c.participant?.handle.toLowerCase().includes(lowerSearch))
            : true;

        if (!matchesSearch) return false;

        if (filter === 'unread') {
            const isLastMsgFromMe = c.lastMessage?.sender === auth.user?._id;
            const isUnread = !isLastMsgFromMe && c.lastMessage && !c.lastMessage.read;
            return (c.unreadCount ?? 0) > 0 || isUnread;
        }

        if (filter === 'groups') {
            return c.isGroup || false;
        }

        return true;
    });

    const openConvo = (c: Conversation) => {
        setSelectedConversation(c);
        router.push(`/chat/${c._id}`);
    };

    const renderChip = (id: 'all' | 'unread' | 'groups', label: string, count?: number) => {
        const active = filter === id;
        return (
            <TouchableOpacity
                key={id}
                onPress={() => setFilter(id)}
                activeOpacity={0.8}
                style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: active ? colors.primary : 'rgba(255, 255, 255, 0.05)',
                    borderWidth: 1,
                    borderColor: active ? colors.primary : 'rgba(255, 255, 255, 0.08)',
                    marginRight: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                <Text
                    style={{
                        color: active ? '#ffffff' : colors.onSurfaceVariant,
                        fontSize: 13,
                        fontWeight: '600',
                    }}
                >
                    {label}
                </Text>
                {count !== undefined && count > 0 && (
                    <View
                        style={{
                            marginLeft: 6,
                            backgroundColor: active ? '#ffffff' : colors.primary,
                            borderRadius: 10,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Text
                            style={{
                                color: active ? colors.primary : '#ffffff',
                                fontSize: 10,
                                fontWeight: 'bold',
                            }}
                        >
                            {count > 99 ? '99+' : count}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Conversations</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={{ marginRight: 14, padding: 4 }}
                        onPress={() => router.push('/chat/create-group')}
                    >
                        <Ionicons name="people-outline" size={24} color={colors.primary} />
                    </TouchableOpacity>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{conversations.length}</Text>
                    </View>
                </View>
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
                <Ionicons name="search" size={16} color={colors.outlineVariant} />
                <TextInput
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search conversations..."
                    placeholderTextColor={colors.outlineVariant}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={16} color={colors.outlineVariant} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filter Chips */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                }}
                style={{ flexGrow: 0 }}
            >
                {renderChip('all', 'All')}
                {renderChip('unread', 'Unread', unreadConvosCount)}
                {renderChip('groups', 'Groups', groupsCount)}
            </ScrollView>

            {/* Stories */}
            <StoryBar onViewStory={(us) => setSelectedStories(us)} />
            {selectedStories && (
                <StoryViewer userStory={selectedStories} onClose={() => setSelectedStories(null)} />
            )}

            {/* Conversations List */}
            {loading ? (
                <View>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <ConversationSkeleton key={i} />
                    ))}
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(c) => c._id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <ConversationItem
                            convo={item}
                            selected={false}
                            onPress={() => openConvo(item)}
                        />
                    )}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="chatbubbles-outline" size={44} color={colors.outlineVariant} />
                            <Text style={styles.emptyTitle}>No conversations yet</Text>
                            <Text style={styles.emptySubtitle}>Go to the Search tab to start chatting</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
