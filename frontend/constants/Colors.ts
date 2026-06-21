export const LightColors = {
    // Primary purple
    primary: "#7C3AED",
    primaryDim: "#6D28D9",
    primaryDeep: "#5B21B6",
    primaryContainer: "#A78BFA",
    onPrimary: "#FFFFFF",
    onPrimaryContainer: "#3B0764",

    // Surface
    surface: "#F8F7FF",
    surfaceLow: "#F1EFFC",
    surfaceHigh: "#E8E5F5",
    surfaceHighest: "#DDD9EE",
    surfaceLowest: "#FFFFFF",
    surfaceDim: "#C4BFD6",

    // Text
    onSurface: "#1A1625",
    onSurfaceVariant: "#6B6580",
    outline: "#908BA0",
    outlineVariant: "#B8B3C8",

    // Accent / Status
    tertiary: "#EC4899",
    error: "#EF4444",
    online: "#22C55E",

    // Chat-specific
    chatBg: "#F5F3FF",
    sentBubbleStart: "#7C3AED",
    sentBubbleEnd: "#4F46E5",
    receivedBubble: "#FFFFFF",
    inputBar: "#F1EFFC",
    inputBarBorder: "#E0DCF0",
};

export const DarkColors = {
    // Primary purple
    primary: "#A78BFA",
    primaryDim: "#8B5CF6",
    primaryDeep: "#7C3AED",
    primaryContainer: "rgba(139, 92, 246, 0.1)",
    onPrimary: "#050816",
    onPrimaryContainer: "#E0D4FF",

    // Surface
    surface: "#0B0F19",
    surfaceLow: "#111827",
    surfaceHigh: "#1A2035",
    surfaceHighest: "#243049",
    surfaceLowest: "#050816",
    surfaceDim: "#374151",

    // Text
    onSurface: "#FFFFFF",
    onSurfaceVariant: "#A1A1AA",
    outline: "#6B7280",
    outlineVariant: "#4B5563",

    // Accent / Status
    tertiary: "#F472B6",
    error: "#F87171",
    online: "#4ADE80",

    // Chat-specific
    chatBg: "#050816",
    sentBubbleStart: "#8B5CF6",
    sentBubbleEnd: "#6366F1",
    receivedBubble: "#111827",
    inputBar: "#111827",
    inputBarBorder: "rgba(255, 255, 255, 0.08)",
};

export type ThemeColors = typeof LightColors;

// Fallback for non-refactored files
export const Colors = LightColors;
