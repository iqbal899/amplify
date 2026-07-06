import { colors, spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export default function SplashScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [tagline, setTagline] = useState('');
  const [navigated, setNavigated] = useState(false);

  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  useEffect(() => {
    logoScale.value = withTiming(1, { duration: 600 });
    logoOpacity.value = withTiming(1, { duration: 600 });
  }, []);

  // Typewriter effect
  useEffect(() => {
    const fullText = 'Get paid to vibe.';
    let i = 0;
    const interval = setInterval(() => {
      if (i < fullText.length) {
        setTagline(fullText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 60);
    return () => clearInterval(interval);
  }, []);

  // Navigate after minimum splash time
  useEffect(() => {
    const timer = setTimeout(() => {
      if (navigated) return;
      setNavigated(true);
      if (isAuthenticated) {
        router.replace('/(tabs)/discover');
      } else {
        router.replace('/onboarding/welcome');
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, [isAuthenticated, navigated]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Text style={styles.logoText}>Amplify</Text>
        <Text style={styles.logoSubtext}>by DoorBeen</Text>
      </Animated.View>
      <Text style={styles.tagline}>{tagline}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoText: {
    fontFamily: 'Syne_700Bold',
    fontSize: 48,
    color: colors.text,
    letterSpacing: -1,
  },
  logoSubtext: {
    fontFamily: 'Figtree_400Regular',
    fontSize: 14,
    color: colors.textSub,
    marginTop: spacing.xs,
  },
  tagline: {
    fontFamily: 'Figtree_500Medium',
    fontSize: 18,
    color: colors.textSub,
    marginTop: spacing.md,
  },
});
