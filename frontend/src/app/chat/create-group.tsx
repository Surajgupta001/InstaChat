import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, FlatList, Alert, StyleSheet } from 'react-native'
import { useEffect, useState } from 'react'
import type { User as IUser } from '../../../types';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeColors } from '../../../constants/Colors';
import { useTheme, useThemeStyles } from '../../../context/ThemeContext';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import Avatar from '../../../components/Avatar';
import { api, useApp } from '../../../context/AppContext';

export default function CreateGroup() {
    const [groupName, setGroupName] = useState('');
    const [users, setUsers] = useState<IUser[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    const router = useRouter();
    const { auth, createGroup, setSelectedConversation } = useApp();
    const { colors } = useTheme();
    const styles = useThemeStyles(getStyles);

    useEffect(() => {
        const fetchUsers = async () => {
            if (auth.loading) return;
            setLoading(true);
            try {
                const { data } = await api.get<{ success: boolean; users: IUser[] }>('/users');
                if (data.success) {
                    // Filter out the current user (the creator is added automatically on the backend)
                    const otherUsers = data.users.filter((u) => u._id !== auth.user?._id);
                    setUsers(otherUsers);
                }
            } catch (error) {
                console.error('Error fetching users for group:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [auth.loading]);

    const toggleUserSelect = (userId: string) => {
        setSelectedUserIds((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    const handleCreate = async () => {
        if (!groupName.trim()) {
            Alert.alert('Required', 'Please enter a group name');
            return;
        }

        if (selectedUserIds.length === 0) {
            Alert.alert('Required', 'Please select at least one member');
            return;
        }

        setCreating(true);
        try {
            const group = await createGroup(groupName.trim(), selectedUserIds);
            if (group) {
                setSelectedConversation(group);
                // Go back to messages and open the new chat
                router.dismissAll();
                router.push('/(tabs)');
                setTimeout(() => {
                    router.push(`/chat/${group._id}`);
                }, 100);
            } else {
                Alert.alert('Error', 'Failed to create group');
            }
        } catch (error) {
            console.error('Group creation failed:', error);
            Alert.alert('Error', 'Failed to create group');
        } finally {
            setCreating(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
                </TouchableOpacity>
                <Text style={styles.title}>New Group</Text>
                <TouchableOpacity 
                    onPress={handleCreate} 
                    disabled={creating || !groupName.trim() || selectedUserIds.length === 0}
                    style={[
                        styles.createBtn, 
                        (!groupName.trim() || selectedUserIds.length === 0) && { opacity: 0.5 }
                    ]}
                >
                    {creating ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <Text style={styles.createBtnText}>Create</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Group Name input */}
            <View style={styles.inputWrapper}>
                <View style={styles.inputContainer}>
                    <Ionicons name="people" size={20} color={colors.outlineVariant} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Enter Group Name..."
                        value={groupName}
                        onChangeText={setGroupName}
                        placeholderTextColor={colors.outlineVariant}
                        maxLength={50}
                    />
                </View>
            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Select Members ({selectedUserIds.length})</Text>
            </View>

            {/* User List */}
            {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(u) => u._id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item: u }) => {
                        const isSelected = selectedUserIds.includes(u._id);
                        return (
                            <TouchableOpacity
                                style={styles.userRow}
                                onPress={() => toggleUserSelect(u._id)}
                                activeOpacity={0.7}
                            >
                                <Avatar
                                    name={u.name}
                                    src={u.avatar}
                                    size={44}
                                    online={u.isOnline}
                                />
                                <View style={styles.userInfo}>
                                    <Text style={styles.userName}>{u.name}</Text>
                                    <Text style={styles.userHandle}>@{u.handle}</Text>
                                </View>
                                <View style={[
                                    styles.checkbox,
                                    isSelected && styles.checkboxSelected
                                ]}>
                                    {isSelected && (
                                        <Ionicons name="checkmark" size={14} color="#fff" />
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={
                        <Text style={styles.empty}>No other users available</Text>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 56,
        borderBottomWidth: 1,
        borderBottomColor: colors.surfaceHigh,
    },
    backBtn: {
        padding: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.onSurface,
    },
    createBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    createBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.primary,
    },
    inputWrapper: {
        padding: 16,
        backgroundColor: colors.surfaceLowest,
        borderBottomWidth: 1,
        borderBottomColor: colors.surfaceHigh,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceLow,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: colors.onSurface,
    },
    sectionHeader: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.surface,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.onSurfaceVariant,
    },
    list: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceLowest,
        padding: 12,
        borderRadius: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
        elevation: 1,
    },
    userInfo: {
        flex: 1,
        marginLeft: 12,
    },
    userName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.onSurface,
    },
    userHandle: {
        fontSize: 12,
        color: colors.onSurfaceVariant,
        marginTop: 2,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: colors.outlineVariant,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    empty: {
        textAlign: 'center',
        color: colors.onSurfaceVariant,
        marginTop: 40,
        fontSize: 14,
    },
});
