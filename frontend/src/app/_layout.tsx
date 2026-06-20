import { useEffect } from 'react';
import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ClerkLoaded, ClerkProvider, useAuth } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { ActivityIndicator, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { AppProvider } from '../../context/AppContext';

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

if (!publishableKey) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}

// Authentication guard to check if the user is signed in
function AuthGuard() {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();

  const router = useRouter();

  useEffect(() => {
    SplashScreen.hideAsync();
    const inAuth = segments[0] === '(auth)';

    if (!isSignedIn && !inAuth) {
      return router.replace('/(auth)');
    } else if (isSignedIn && inAuth) {
      return router.replace('/(tabs)');
    }
  }, [isSignedIn, isLoaded, segments]);

  if (!isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Colors.surface
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return null;
};

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AppProvider>
            <AuthGuard />
            <Stack screenOptions={{
              headerShown: false
            }}>
              <Stack.Screen name='(auth)' />
              <Stack.Screen name='(tabs)' />
              <Stack.Screen name='chat/[id]' options={{ animation: 'slide_from_right' }} />
            </Stack>
            <StatusBar style='dark' />
          </AppProvider>
        </GestureHandlerRootView>
      </ClerkLoaded>
    </ClerkProvider>
  )
}
