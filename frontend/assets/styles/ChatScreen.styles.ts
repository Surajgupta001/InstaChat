import { StyleSheet } from "react-native";
import { ThemeColors } from "../../constants/Colors";

export const getStyles = (colors: ThemeColors) => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.chatBg },
    kav: { flex: 1 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.inputBarBorder,
        backgroundColor: colors.inputBar,
        gap: 10,
    },
    backBtn: { padding: 4 },
    headerInfo: { flex: 1, minWidth: 0 },
    headerName: { fontSize: 16, fontWeight: "600", color: colors.onSurface, letterSpacing: 0.2 },
    headerHandle: { fontSize: 13, fontWeight: "500", color: colors.primary },
    headerSub: { fontSize: 12, color: colors.onSurfaceVariant, marginTop: 1 },
    headerActions: { flexDirection: "row", gap: 2 },
    headerBtn: { padding: 8, borderRadius: 10 },

    messageList: {
        paddingHorizontal: 10,
        paddingVertical: 8,
    },

    // Date separator
    dateSeparatorContainer: {
        alignItems: "center",
        marginVertical: 12,
    },
    dateSeparatorPill: {
        backgroundColor: "rgba(139,92,246,0.12)",
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 12,
    },
    dateSeparatorText: {
        fontSize: 11.5,
        fontWeight: "600",
        color: colors.primary,
        letterSpacing: 0.4,
    },

    typingRow: { paddingHorizontal: 16, paddingVertical: 4 },
    typingText: { fontSize: 11, color: colors.primary, fontStyle: "italic" },

    // Input bar — premium dark glassmorphism
    inputBar: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: colors.inputBar,
        borderTopWidth: 0.5,
        borderTopColor: colors.inputBarBorder,
    },
    mediaPreview: {
        marginBottom: 8,
        alignSelf: "flex-start",
        position: "relative",
    },
    mediaThumb: {
        width: 80,
        height: 80,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: colors.primary,
    },
    mediaRemove: {
        position: "absolute",
        top: -8,
        right: -8,
        backgroundColor: colors.error,
        borderRadius: 12,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 24,
        backgroundColor: colors.surfaceLow,
        borderWidth: 0.5,
        borderColor: colors.inputBarBorder,
    },
    attachBtn: {
        padding: 4,
        paddingBottom: 6,
        opacity: 0.5,
        marginBottom: 2,
    },
    textInput: {
        flex: 1,
        fontSize: 15,
        color: colors.onSurface,
        maxHeight: 120,
        paddingVertical: 4,
        letterSpacing: 0.1,
    },
    sendBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 2,
    },
    sendBtnDisabled: { opacity: 0.35 },

    // Scroll to bottom FAB
    scrollFab: {
        position: "absolute",
        bottom: 80,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primaryContainer,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
        zIndex: 50,
    },
    scrollFabBadge: {
        position: "absolute",
        top: -4,
        right: -4,
        backgroundColor: colors.error,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 4,
    },
    scrollFabBadgeText: {
        fontSize: 9,
        fontWeight: "700",
        color: "#FFF",
    },

    emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    emptyText: { fontSize: 15, color: colors.onSurfaceVariant },
});
