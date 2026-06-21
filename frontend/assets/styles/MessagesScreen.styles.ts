import { StyleSheet } from "react-native";
import { ThemeColors } from "../../constants/Colors";

export const getStyles = (colors: ThemeColors) => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 16,
    },
    title: { fontSize: 22, fontWeight: "500", color: colors.onSurface, letterSpacing: -0.5 },
    headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
    iconBtn: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: colors.surfaceLow,
    },
    badge: {
        minWidth: 26,
        height: 26,
        borderRadius: 14,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 8,
    },
    badgeText: { color: colors.onPrimary, fontSize: 12, fontWeight: "600" },
    searchRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginHorizontal: 16,
        marginBottom: 4,
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 50,
        backgroundColor: colors.surfaceHigh,
    },
    searchInput: { flex: 1, fontSize: 16, color: colors.onSurface },
    divider: { height: 1, backgroundColor: colors.surfaceHigh, marginTop: 4 },
    listContent: { paddingHorizontal: 8, paddingBottom: 20, paddingTop: 6 },
    empty: { alignItems: "center", paddingTop: 60, gap: 8 },
    emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.onSurface },
    emptySubtitle: { fontSize: 13, color: colors.onSurfaceVariant },
});
