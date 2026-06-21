import { Tabs } from 'expo-router'
import { useTheme } from '../../../context/ThemeContext'
import { Ionicons } from '@expo/vector-icons'

export default function TabLayout() {
    const { colors } = useTheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.onSurfaceVariant,
                tabBarStyle: {
                    backgroundColor: colors.surfaceLowest,
                    borderTopColor: colors.surfaceHigh,
                    borderTopWidth: 1,
                    height: 80,
                    paddingBottom: 12,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 14,
                    fontWeight: '600',
                }
            }}
        >
            <Tabs.Screen
                name='index'
                options={{
                    title: 'Messages',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
                            size={24}
                            color={color}
                        />
                    )
                }}
            />
            <Tabs.Screen
                name='search'
                options={{
                    title: 'Search',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'search' : 'search-outline'}
                            size={24}
                            color={color}
                        />
                    )
                }}
            />
            <Tabs.Screen
                name='profile'
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'person' : 'person-outline'}
                            size={24}
                            color={color}
                        />
                    )
                }}
            />
        </Tabs>
    )
}