import { StyleSheet } from "react-native";
import { ThemeColors } from "../../constants/Colors";

export const getStyles = (colors: ThemeColors) => StyleSheet.create({
    root: { position: "relative" },
    circle: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
    initials: { color: "#fff", fontWeight: "700" },
    indicator: {
        position: "absolute",
        borderWidth: 2,
        borderColor: colors.surfaceLowest,
    },
});
