import { StyleSheet } from "react-native";
import { ThemeColors } from "../../constants/Colors";

export const getStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 16,
    },
    list: {
        flexGrow: 0,
    },
    storyItem: { alignItems: "center", gap: 6 },
    addCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: colors.outlineVariant,
        alignItems: "center",
        justifyContent: "center",
    },
    storyRing: {
        padding: 2,
        borderRadius: 100,
        borderWidth: 2,
        borderColor: colors.primary,
    },
    label: {
        fontSize: 13,
        fontWeight: "500",
        color: colors.onSurface,
        width: 64,
        textAlign: "center",
    },
});

