import React, { memo, useCallback, useMemo, useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { Swipeable } from "react-native-gesture-handler";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Message } from "../types";
import { useTheme, useThemeStyles } from "../context/ThemeContext";
import { getStyles } from "../assets/styles/Bubble.styles";

interface Props {
    message: Message;
    isMe: boolean;
    showSender?: boolean;
    isGrouped?: boolean;
    onReply?: (msg: Message) => void;
    onReact?: (msg: Message, emoji: string) => void;
    onLongPress?: (msg: Message) => void;
}

const REACTION_OPTIONS = ["❤️", "😂", "😮", "😢", "🙏", "👍"];

const Bubble: React.FC<Props> = ({ message, isMe, showSender, isGrouped = false, onReply, onReact, onLongPress }) => {
    const { colors } = useTheme();
    const S = useThemeStyles(getStyles);
    const swipeRef = useRef<Swipeable>(null);

    const isMedia = !!(message.mediaUrl);

    const renderRightActions = useCallback(() => (
        <Pressable
            style={{ justifyContent: "center", paddingLeft: 8 }}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                swipeRef.current?.close();
                onReply?.(message);
            }}
        >
            <Ionicons name="arrow-undo" size={18} color={colors.primary} />
        </Pressable>
    ), [colors.primary, message, onReply]);

    const timeStr = useMemo(() => {
        if (!message.createdAt) return "";
        const d = new Date(message.createdAt);
        return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    }, [message.createdAt]);

    return (
        <Swipeable ref={swipeRef} renderRightActions={renderRightActions} overshootRight={false}>
            <Animated.View
                entering={isMe ? FadeInUp.duration(200) : FadeInDown.duration(200)}
                style={[S.row, isMe ? S.rowMe : S.rowThem, { paddingHorizontal: 6 }]}
            >
                <Pressable
                    onLongPress={() => {
                        onLongPress?.(message);
                    }}
                    delayLongPress={500}
                    style={[
                        S.bubble,
                        isMe ? S.bubbleMe : S.bubbleThem,
                        isGrouped ? (isMe ? S.bubbleMeGrouped : S.bubbleThemGrouped) : S.bubbleFirst,
                    ]}
                >
                    {isMe ? (
                        <LinearGradient
                            colors={[colors.sentBubbleStart, colors.sentBubbleEnd]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFill}
                        />
                    ) : null}

                    {showSender && !isMe && message.sender && (
                        <Text style={S.senderName}>You</Text>
                    )}

                    {message.replyTo && (
                        <View
                            style={[
                                S.replyPreviewInside,
                                isMe ? S.replyPreviewInsideMe : S.replyPreviewInsideThem,
                            ]}
                        >
                            <Text
                                style={[
                                    S.replySenderInside,
                                    isMe ? S.replySenderInsideMe : S.replySenderInsideThem,
                                ]}
                            >
                                {message.replyTo.sender === message.sender ? "You" : "Message"}
                            </Text>
                            <Text
                                style={[
                                    S.replyTextInside,
                                    isMe ? S.replyTextInsideMe : S.replyTextInsideThem,
                                ]}
                                numberOfLines={2}
                            >
                                {message.replyTo.text || (message.replyTo.mediaType === "image" ? "Photo" : "Video")}
                            </Text>
                        </View>
                    )}

                    {isMedia && (
                        <View style={S.mediaWrapper}>
                            <View style={S.mediaContainer}>
                                {message.mediaType === "image" && (
                                    <Image
                                        source={{ uri: message.mediaUrl }}
                                        style={S.mediaImage}
                                        contentFit="cover"
                                        transition={300}
                                        cachePolicy="memory-disk"
                                    />
                                )}
                                {message.mediaType === "video" && (
                                    <VideoPlayer uri={message.mediaUrl!} style={S.mediaVideo} />
                                )}
                                <View style={S.mediaOverlay} />
                            </View>
                        </View>
                    )}

                    {message.text && !isMedia ? (
                        <Text style={[S.msgText, isMe ? S.msgTextMe : S.msgTextThem]}>
                            {message.text}
                        </Text>
                    ) : message.text && isMedia ? (
                        <Text
                            style={[S.msgText, isMe ? S.msgTextMe : S.msgTextThem, { paddingTop: 2 }]}
                        >
                            {message.text}
                        </Text>
                    ) : null}

                    <View style={[S.footer, isMe ? S.footerRight : S.footerLeft]}>
                        <Text style={[S.timeText, isMe ? S.timeMe : S.timeThem]}>
                            {timeStr}
                        </Text>
                        {isMe && (
                            <Ionicons
                                name={message.read ? "checkmark-done" : "checkmark"}
                                size={14}
                                color={message.read ? colors.primary : "rgba(255,255,255,0.5)"}
                            />
                        )}
                    </View>

                    {message.reactions && message.reactions.length > 0 && (
                        <View style={[S.badge, isMe ? S.badgeMe : S.badgeThem]}>
                            {message.reactions.map((r) => (
                                <Text key={r.emoji} style={S.badgeText}>{r.emoji}</Text>
                            ))}
                            {message.reactions.length > 1 && (
                                <Text style={S.badgeCount}>{message.reactions.length}</Text>
                            )}
                        </View>
                    )}
                </Pressable>
            </Animated.View>
        </Swipeable>
    );
};

export default memo(Bubble);

// Internal video player component
const VideoPlayer = memo(({ uri, style }: { uri: string; style: any }) => {
    const player = useVideoPlayer(uri, (p) => {
        p.loop = false;
    });

    return (
        <VideoView
            player={player}
            style={style}
            contentFit="contain"
        />
    );
});
