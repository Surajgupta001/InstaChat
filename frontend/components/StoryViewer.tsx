import { View, Text, Animated, Modal, TouchableOpacity } from 'react-native'
import { useEffect, useRef, useState } from 'react'
import { UserStory } from '../types';
import { styles } from '@/assets/styles/StoryViewer.styles';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video'
import Avatar from './Avatar';

const STORY_DURATION = 5000; // 5 seconds per story

interface StoryViewerProps {
    userStory: UserStory;
    onClose: () => void;
}

export default function StoryViewer({ userStory, onClose }: StoryViewerProps) {

    const [currentIndex, setCurrentIndex] = useState(0);
    const progressAnimations = useRef(new Animated.Value(0)).current;

    const AnimatedRef = useRef<Animated.CompositeAnimation>(null);

    const story = userStory.stories[currentIndex];

    const startProgess = () => {
        progressAnimations.setValue(0);
        AnimatedRef.current = Animated.timing(progressAnimations, {
            toValue: 1,
            duration: STORY_DURATION,
            useNativeDriver: false,
        });
        AnimatedRef.current.start(({ finished }) => {
            if (finished) {
                goToNextStory();
            }
        })
    };

    useEffect(() => {
        startProgess();
        return () => {
            AnimatedRef.current?.stop();
        };
    }, [currentIndex]);

    const goToNextStory = () => {
        AnimatedRef.current?.stop();
        if (currentIndex < userStory.stories.length - 1) {
            setCurrentIndex((i) => i + 1);
        } else {
            onClose();
        }
    };

    const goToPreviousStory = () => {
        AnimatedRef.current?.stop();
        if (currentIndex > 0) {
            setCurrentIndex((i) => i - 1);
        } else {
            onClose();
        }
    };

    return (
        <Modal
            visible
            animationType='fade'
            statusBarTranslucent
        >
            <View style={styles.container}>

                {/* Progress Bar */}
                <View style={styles.progressRow}>
                    {userStory.stories.map((_, idx) => (
                        <View key={idx} style={styles.progressTrack}>
                            <Animated.View
                                style={[styles.progressFill,
                                idx < currentIndex
                                    ? { width: '100%' }
                                    : idx === currentIndex
                                        ? {
                                            width: progressAnimations.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0%', '100%']
                                            })
                                        }
                                        : { width: '0%' }
                                ]}
                            />
                        </View>
                    ))}
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.userRow}>
                        <Avatar
                            name={userStory.user.name}
                            src={userStory.user.avatar}
                            size={38}
                        />
                        <View>
                            <Text style={styles.userName}>{userStory.user.name}</Text>
                            <Text style={styles.userHandle}>@{userStory.user.handle}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.closeBtn}
                    >
                        <Ionicons
                            name='close'
                            size={26}
                            color='rgba(255,255,255,0.85)'
                        />
                    </TouchableOpacity>
                </View>

                {/* Media */}
                {story.mediaType === 'video' ? (
                    <StoryVideoPlayer uri={story.mediaUrl} style={styles.media} />
                ) : (
                    <Image
                        source={{ uri: story.mediaUrl }}
                        style={styles.media}
                        resizeMode='contain'
                    />
                )}

                {/* Tap Zones */}
                <View style={styles.tapZones}>
                    <TouchableOpacity style={styles.tapHalf} onPress={goToPreviousStory} />
                    <TouchableOpacity style={styles.tapHalf} onPress={goToNextStory} />
                </View>
            </View>
        </Modal>
    );
}


function StoryVideoPlayer({ uri, style }: { uri: string, style: any }) {
    const player = useVideoPlayer({ uri }, (p) => {
        p.loop = false;
        p.play();
    })

    return <VideoView style={style} player={player} />
};