import { View, Text } from 'react-native'
import React, { memo, useMemo } from 'react'
import { Image } from 'expo-image'
import { getStyles } from '@/assets/styles/Avatar.styles';
import { useTheme, useThemeStyles } from '../context/ThemeContext';

const PALETTE: string[] = [
    "#4652b0",
    "#933880",
    "#3946a4",
    "#6750A4",
    "#7965AF",
    "#5E60CE",
    "#7B2CBF",
    "#4361EE",
    "#3A0CA3",
];

interface AvatarProps {
    name: string;
    size?: number;
    online?: boolean;
    src?: string;
}

const Avatar = memo(function Avatar({ name, size = 40, online, src }: AvatarProps) {
    const { colors } = useTheme();
    const styles = useThemeStyles(getStyles);

    const color = useMemo(
        () => PALETTE[Math.abs(name.charCodeAt(0) - 'A'.charCodeAt(0)) % PALETTE.length],
        [name]
    );

    const initials = useMemo(
        () => name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
        [name]
    );

    const indicatorSize = Math.round(size / 4);

    return (
        <View style={[styles.root, { width: size, height: size }]}>
            <View
                style={[
                    styles.circle,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: src ? 'transparent' : color,
                    },
                ]}
            >
                {src ? (
                    <Image
                        source={{ uri: src }}
                        style={{ width: size, height: size, borderRadius: size / 2 }}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="memory-disk"
                    />
                ) : (
                    <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
                )}
            </View>

            {online !== undefined && (
                <View
                    style={[
                        styles.indicator,
                        {
                            width: indicatorSize,
                            height: indicatorSize,
                            borderRadius: indicatorSize / 2,
                            backgroundColor: online ? colors.online : colors.outlineVariant,
                            bottom: 0,
                            right: 0,
                        },
                    ]}
                />
            )}
        </View>
    );
});

export default Avatar;
