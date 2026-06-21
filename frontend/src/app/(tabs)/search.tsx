import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, RefreshControl } from 'react-native'
import { useCallback, useEffect, useState } from 'react'
import type { Conversation, User as IUser } from '../../../types';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getStyles } from '@/assets/styles/SearchScreen.styles';
import { useTheme, useThemeStyles } from '../../../context/ThemeContext';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import Avatar from '../../../components/Avatar';
import { SearchUserSkeleton } from '../../../components/Skeleton';
import * as Haptics from 'expo-haptics';
import { api, useApp } from '../../../context/AppContext';

export default function search() {
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState<IUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const router = useRouter();
    const { auth, setConversations, setSelectedConversation } = useApp();
    const { colors } = useTheme();
    const styles = useThemeStyles(getStyles);

    const fetchUsers = useCallback(async () => {
        if (auth.loading) return;
        setLoading(true);
        try {
            const endpoint = search ? `/users/search?query=${search}` : '/users';
            const { data } = await api.get<{ success: boolean; users: IUser[] }>(endpoint);
            if (data.success) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    }, [search, auth.loading]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            const endpoint = search ? `/users/search?query=${search}` : '/users';
            const { data } = await api.get<{ success: boolean; users: IUser[] }>(endpoint);
            if (data.success) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Error refreshing users:', error);
        } finally {
            setRefreshing(false);
        }
    }, [search]);

    useEffect(() => {
        if (auth.loading) return;
        const timer = setTimeout(fetchUsers, 300);
        return () => clearTimeout(timer);
    }, [search, auth.loading]);

    const startChat = async (user: IUser) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const { data } = await api.get<{ success: boolean; conversation: Conversation }>(
                `/messages/conversations/with/${user._id}`
            );

            if (data.success) {
                setSelectedConversation(data.conversation);
                setConversations((prev) =>
                    prev.some((c) => c._id === data.conversation._id) ? prev : [data.conversation, ...prev]
                );
                router.push(`/chat/${data.conversation._id}`);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to start conversation');
        }
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Search</Text>
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
                <Ionicons name="search" size={16} color={colors.outlineVariant} />
                <TextInput
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search by name, email or handle..."
                    placeholderTextColor={colors.outlineVariant}
                    autoCapitalize="none"
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={16} color={colors.outlineVariant} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Results */}
            {loading ? (
                <View>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <SearchUserSkeleton key={i} />
                    ))}
                </View>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(u) => u._id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item: u }) => (
                        <TouchableOpacity
                            style={styles.userRow}
                            onPress={() => startChat(u)}
                            activeOpacity={0.7}
                        >
                            <Avatar name={u.name} src={u.avatar} size={44} online={u.isOnline} />
                            <View style={styles.userInfo}>
                                <View style={styles.nameRow}>
                                    <Text style={styles.userName}>{u.name}</Text>
                                    <Text style={styles.userHandle}>@{u.handle}</Text>
                                </View>
                                <Text style={styles.userEmail} numberOfLines={1}>
                                    {u.email}
                                </Text>
                            </View>
                        </TouchableOpacity>
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
                        <Text style={styles.empty}>
                            {search ? 'No users found' : 'Search for people to chat with'}
                        </Text>
                    }
                />
            )}
        </SafeAreaView>
    );
}
