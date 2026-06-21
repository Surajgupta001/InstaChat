import { StyleSheet } from "react-native";
import { ThemeColors } from "../../constants/Colors";

export const getStyles = (colors: ThemeColors) => StyleSheet.create({
    row: {
        flexDirection: "row",
    },
    rowMe: { justifyContent: "flex-end" },
    rowThem: { justifyContent: "flex-start" },

    // Grouping: reduce vertical spacing for consecutive messages
    bubble: {
        maxWidth: "78%",
        overflow: "hidden",
    },
    bubbleGrouped: {
        marginTop: 2,
    },
    bubbleFirst: {
        marginTop: 10,
    },
    bubbleMe: {
        borderTopRightRadius: 22,
        borderTopLeftRadius: 22,
        borderBottomRightRadius: 6,
        borderBottomLeftRadius: 22,
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    bubbleMeGrouped: {
        borderTopRightRadius: 6,
        borderBottomRightRadius: 6,
    },
    bubbleThem: {
        borderTopRightRadius: 22,
        borderTopLeftRadius: 22,
        borderBottomLeftRadius: 6,
        borderBottomRightRadius: 22,
        backgroundColor: colors.receivedBubble,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    bubbleThemGrouped: {
        borderTopLeftRadius: 6,
        borderBottomLeftRadius: 6,
    },

    senderName: {
        fontSize: 11,
        fontWeight: "700",
        color: colors.primary,
        paddingHorizontal: 14,
        paddingTop: 8,
        letterSpacing: 0.2,
    },

    // Media
    mediaWrapper: {
        padding: 3,
        borderRadius: 20,
        overflow: "hidden",
    },
    mediaContainer: {
        position: "relative",
        borderRadius: 18,
        overflow: "hidden",
    },
    mediaImage: {
        width: 240,
        height: 200,
        borderRadius: 18,
    },
    mediaVideo: {
        width: 240,
        height: 170,
        borderRadius: 18,
    },
    mediaOverlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: "rgba(0,0,0,0.15)",
        borderRadius: 18,
    },

    // Text
    msgText: {
        fontSize: 15.5,
        lineHeight: 21,
        paddingHorizontal: 14,
        paddingVertical: 8,
        letterSpacing: 0.15,
    },
    msgTextMe: { color: "#FFFFFF" },
    msgTextThem: { color: colors.onSurface },

    // Footer (time + ticks)
    footer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 14,
        paddingBottom: 7,
    },
    footerRight: { justifyContent: "flex-end" },
    footerLeft: { justifyContent: "flex-start" },
    timeText: {
        fontSize: 10.5,
        fontWeight: "400",
        letterSpacing: 0.3,
    },
    timeMe: { color: "rgba(255,255,255,0.55)" },
    timeThem: { color: colors.onSurfaceVariant },

    // Reaction badge
    badge: {
        position: "absolute",
        bottom: -8,
        backgroundColor: colors.surfaceLowest,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
        elevation: 3,
        zIndex: 10,
        borderWidth: 1,
        borderColor: colors.surfaceDim,
    },
    badgeMe: { right: 14 },
    badgeThem: { left: 14 },
    badgeText: { fontSize: 12 },
    badgeCount: {
        fontSize: 10,
        fontWeight: "700",
        marginLeft: 2,
        color: colors.onSurfaceVariant,
    },

    // Reply preview (inside bubble)
    replyPreviewInside: {
        borderLeftWidth: 3,
        paddingLeft: 8,
        paddingVertical: 4,
        marginHorizontal: 12,
        marginTop: 8,
        borderRadius: 6,
    },
    replyPreviewInsideMe: {
        borderLeftColor: "rgba(255,255,255,0.6)",
        backgroundColor: "rgba(255,255,255,0.12)",
    },
    replyPreviewInsideThem: {
        borderLeftColor: colors.primary,
        backgroundColor: "rgba(124,58,237,0.08)",
    },
    replySenderInside: {
        fontSize: 11,
        fontWeight: "700",
    },
    replySenderInsideMe: { color: "#FFFFFF" },
    replySenderInsideThem: { color: colors.primary },
    replyTextInside: {
        fontSize: 11,
        marginTop: 2,
    },
    replyTextInsideMe: { color: "rgba(255,255,255,0.75)" },
    replyTextInsideThem: { color: colors.onSurfaceVariant },
});
