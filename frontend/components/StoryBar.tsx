import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native'
import { useEffect, useState } from 'react'
import { getStyles } from '@/assets/styles/StoriesBar.styles';
import { UserStory } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeStyles } from '../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import Avatar from './Avatar';
import { api, useApp } from '../context/AppContext';

interface storiesBarProps {
    onViewStory: (us: UserStory) => void;
};

export default function StoryBar({ onViewStory }: storiesBarProps) {

    const [uploading, setUploading] = useState(false);
    const { auth, userStories, fetchStories } = useApp();
    const { colors } = useTheme();
    const styles = useThemeStyles(getStyles);

    useEffect(() => {
        if (!auth.loading) {
            fetchStories();
        }
    }, [auth.loading, fetchStories]);

    const pickAndUpload = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission to access media library is required!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            quality: 1,
        })

        if (result.canceled || !result.assets || result.assets.length === 0) {
            return;
        }

        const asset = result.assets[0];
        const formData = new FormData();

        formData.append('file', {
            uri: asset.uri,
            type: asset.mimeType || 'image/jpeg',
            name: asset.fileName || 'story.jpg',
        } as any);

        setUploading(true);

        try {
            const { data } = await api.post('/stories', formData);
            if (data.success) {
                fetchStories();
            }
        } catch (error) {
            Alert.alert('Failed to upload story', 'Please try again later.');
            console.error('Error uploading story:', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.list}
            contentContainerStyle={styles.container}
            data={[{ _addStory: true }, ...userStories] as any[]}
            keyExtractor={(item, i) => (item._addStory ? 'add' : item.user._id || String(i))}
            renderItem={({ item }) => {
                if (item._addStory) {
                    return (
                        <TouchableOpacity
                            style={styles.storyItem}
                            disabled={uploading}
                            onPress={pickAndUpload}
                        >
                            <View style={styles.addCircle}>
                                <Ionicons
                                    name={uploading ? 'hourglass' : 'add'}
                                    size={24}
                                    color={colors.onSurfaceVariant}
                                />
                            </View>
                            <Text style={styles.label}>Your Story</Text>
                        </TouchableOpacity>
                    )
                }

                const us = item as UserStory;
                const isSeen = us.stories.every(s => s.viewers?.includes(auth.user?._id || ''));
                const ringColor = isSeen ? '#ffffff' : colors.primary;

                return (
                    <TouchableOpacity
                        style={styles.storyItem}
                        onPress={() => onViewStory(us)}
                    >
                        <View style={[styles.storyRing, { borderColor: ringColor }]}>
                            <Avatar
                                name={us.user.name}
                                src={us.user.avatar}
                                size={60}
                            />
                        </View>
                        <Text style={styles.label} numberOfLines={1}>
                            {us.user.name.split(' ')[0]}
                        </Text>
                    </TouchableOpacity>
                )
            }}
        />
    );
}
