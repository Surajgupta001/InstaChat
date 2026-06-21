import { StyleSheet } from "react-native";
import { ThemeColors } from "../../constants/Colors";

export const getStyles = (colors: ThemeColors) => StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
    },
    rowSelected: { backgroundColor: colors.surfaceHigh },
    info: { flex: 1, minWidth: 0 },
    topRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
    nameCol: { flex: 1, minWidth: 0 },
    name: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.onSurface,
    },
    handle: {
        fontSize: 12,
        fontWeight: "600",
        color: colors.primary,
        opacity: 0.6,
    },
    time: { fontSize: 12, color: colors.onSurfaceVariant, marginLeft: 8 },
    lastMsg: {
        fontSize: 12,
        color: colors.onSurfaceVariant,
        marginTop: 2,
    },
});
