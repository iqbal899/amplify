import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_700Bold,
} from '@expo-google-fonts/figtree';
import {
  Syne_600SemiBold,
  Syne_700Bold,
} from '@expo-google-fonts/syne';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/store/themeStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const { themeMode } = useThemeStore();
  const systemScheme = useColorScheme();

  const isDark = themeMode === 'system'
    ? systemScheme === 'dark'
    : themeMode === 'dark';

  const [fontsLoaded, fontError] = useFonts({
    Syne_700Bold,
    Syne_600SemiBold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding/welcome" />
        <Stack.Screen name="onboarding/connect-instagram" />
        <Stack.Screen name="onboarding/kyc" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modals/campaign-detail"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="modals/submit-reel"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="modals/audio-player"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="modals/payout-detail"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen name="+not-found" />
        <Stack.Screen
          name="modals/edit-profile"
          options={{
            presentation: "modal",
            headerShown: false,
          }}
        />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </GestureHandlerRootView>
  );
}
