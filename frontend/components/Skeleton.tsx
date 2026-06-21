import React, { memo, useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: any;
}

export const Skeleton = memo(function Skeleton({
    width = '100%',
    height = 16,
    borderRadius = 8,
    style,
}: SkeletonProps) {
    const { colors } = useTheme();
    const shimmer = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmer, {
                    toValue: 0,
                    duration: 1000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [shimmer]);

    const translateX = shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [-200, 200],
    });

    return (
        <View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    overflow: 'hidden',
                    backgroundColor: colors.surfaceHigh,
                },
                style,
            ]}
        >
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    { transform: [{ translateX }] },
                ]}
            >
                <LinearGradient
                    colors={[
                        'transparent',
                        colors.surfaceHighest + '80',
                        'transparent',
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
});

// Pre-built skeleton layouts
export const ConversationSkeleton = memo(function ConversationSkeleton() {
    const { colors } = useTheme();
    return (
        <View style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Skeleton width={48} height={48} borderRadius={24} />
            <View style={{ flex: 1, gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Skeleton width="40%" height={16} />
                    <Skeleton width={40} height={12} />
                </View>
                <Skeleton width="70%" height={14} />
            </View>
        </View>
    );
});

export const MessageSkeleton = memo(function MessageSkeleton({ isMine = false }: { isMine?: boolean }) {
    const { colors } = useTheme();
    return (
        <View style={{ padding: 8, alignItems: isMine ? 'flex-end' : 'flex-start' }}>
            <Skeleton
                width={Math.random() * 120 + 100}
                height={40}
                borderRadius={16}
            />
        </View>
    );
});

export const SearchUserSkeleton = memo(function SearchUserSkeleton() {
    return (
        <View style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Skeleton width={44} height={44} borderRadius={22} />
            <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="50%" height={16} />
                <Skeleton width="35%" height={12} />
            </View>
        </View>
    );
});
