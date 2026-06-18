import { View, Text, TextInput, ActivityIndicator, FlatList } from 'react-native'
import { useEffect, useState } from 'react'
import { Conversation, UserStory } from '../../../types';
import { useRouter } from 'expo-router';
import { dummyConversationData } from '@/assets/assets';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '@/assets/styles/MessagesScreen.styles';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import StoryBar from '../../../components/StoryBar';
import StoryViewer from '../../../components/StoryViewer';
import ConversationItem from '../../../components/ConversationItem';

export default function MessagesScreen() {

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedStories, setSelectedStories] = useState<UserStory | null>(null);

    const router = useRouter();

    const fetchConversations = async () => {
        setLoading(true);
        setTimeout(() => {
            setConversations(dummyConversationData as any);
            setLoading(false);
        }, 1000);
    };

    useEffect(() => {
        fetchConversations();
    }, []);

    const lowerSearch = search.toLowerCase();
    const filtered = search ? conversations.filter(
        (c) => c.participant?.name.toLowerCase().includes(lowerSearch) || c.participant?.handle.toLowerCase().includes(lowerSearch)
    ) : conversations;

    const openConvo = (c: Conversation) => {
        router.push(`/chat/${c._id}`)
    };

    return (
        <SafeAreaView
            style={styles.safe}
            edges={['top']}
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Conversation</Text>
                <View style={styles.headerRight}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{conversations.length}</Text>
                    </View>
                </View>
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
                <Ionicons name='search' size={16} color={Colors.outlineVariant} />
                <TextInput
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                    placeholder='Search Conversation...'
                    placeholderTextColor={Colors.outlineVariant}
                />
                {search.length > 0 && (
                    <Ionicons
                        name='close-circle'
                        size={16}
                        color={Colors.outlineVariant}
                        onPress={() => setSearch('')}
                    />
                )}
            </View>

            {/* Stories */}
            <StoryBar onViewStory={(us) => setSelectedStories(us)} />
            {selectedStories && (
                <StoryViewer
                    userStory={selectedStories}
                    onClose={() => setSelectedStories(null)}
                />
            )}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Conversations List */}
            {loading ? (
                <ActivityIndicator
                    style={{ marginTop: 40 }}
                    color={Colors.primary}
                />
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
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons
                                name="chatbubbles-outline"
                                size={44}
                                color={Colors.outlineVariant}
                            />
                            <Text style={styles.emptyTitle}>No conversations yet</Text>
                            <Text style={styles.emptySubtitle}>Go to the Search Chatting</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    )
}