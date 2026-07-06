import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { colors, spacing, radius, fonts } from '@/constants/theme';
import { useInstagramAuth } from '@/hooks/useInstagramAuth';

const AnimatedView = Animated.createAnimatedComponent(View);

export default function ConnectInstagramScreen() {
  const router = useRouter();
  const { connectInstagram } = useInstagramAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const checkmarkScale = useSharedValue(0);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const result = await connectInstagram();
      if (result !== null && result !== undefined && result !== false) {
        setIsConnected(true);
        checkmarkScale.value = withTiming(1, { duration: 400 });
        setTimeout(() => {
          router.push('/onboarding/kyc');
        }, 1000);
      }
    } catch (error) {
      console.error('Instagram connection failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/onboarding/kyc');
  };

  const checkmarkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
  }));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {!isConnected ? (
        <>
          {/* Instagram Logo Placeholder */}
          <View style={styles.logoSection}>
            <View
              style={[
                styles.igLogoCircle,
                { backgroundColor: colors.blue },
              ]}
            >
              <Text style={[styles.igLogo, { fontFamily: fonts.display }]}>
                IG
              </Text>
            </View>
          </View>

          {/* Explanation Card */}
          <View
            style={[
              styles.explanationCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                styles.explanationTitle,
                { fontFamily: fonts.displayMedium },
              ]}
            >
              Connect your Instagram
            </Text>
            <Text style={[styles.explanationText, { color: colors.textMuted }]}>
              Connect your Instagram to verify your reels belong to your account.
            </Text>
          </View>

          {/* Why We Need This Section */}
          <View style={styles.expandableSection}>
            <TouchableOpacity
              style={[
                styles.expandableHeader,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setIsExpanded(!isExpanded)}
            >
              <Text
                style={[
                  styles.expandableTitle,
                  { fontFamily: fonts.displayMedium, color: colors.text },
                ]}
              >
                Why we need this
              </Text>
              <Text
                style={[
                  styles.expandIcon,
                  {
                    transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
                  },
                ]}
              >
                ▼
              </Text>
            </TouchableOpacity>

            {isExpanded && (
              <View
                style={[
                  styles.expandableContent,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.expandableText,
                    { color: colors.textMuted },
                  ]}
                >
                  We verify your submitted reels belong to your account. We never
                  post on your behalf.
                </Text>
              </View>
            )}
          </View>

          {/* Connect Button */}
          <TouchableOpacity
            style={[
              styles.connectButton,
              {
                backgroundColor: colors.blue,
                opacity: isLoading ? 0.7 : 1,
              },
            ]}
            onPress={handleConnect}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={[styles.connectButtonText, { fontFamily: fonts.displayMedium }]}>
                Connect Instagram
              </Text>
            )}
          </TouchableOpacity>

          {/* Skip Link */}
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: colors.textMuted }]}>
              Skip for now
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        /* Success State */
        <View style={styles.successContainer}>
          <AnimatedView
            style={[
              styles.checkmarkContainer,
              checkmarkAnimatedStyle,
            ]}
          >
            <Text style={styles.checkmark}>✓</Text>
          </AnimatedView>
          <Text
            style={[
              styles.successTitle,
              { fontFamily: fonts.displayMedium },
            ]}
          >
            Instagram connected!
          </Text>
          <Text style={[styles.successText, { color: colors.textMuted }]}>
            Your account is verified
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    justifyContent: 'center',
    minHeight: '100%',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  igLogoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  igLogo: {
    fontSize: 48,
    color: '#fff',
  },
  explanationCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  explanationTitle: {
    fontSize: 18,
    marginBottom: spacing.md,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  expandableSection: {
    marginBottom: spacing.xl,
  },
  expandableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  expandableTitle: {
    fontSize: 16,
  },
  expandIcon: {
    fontSize: 14,
    color: 'gray',
  },
  expandableContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  expandableText: {
    fontSize: 14,
    lineHeight: 20,
  },
  connectButton: {
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  connectButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  skipText: {
    fontSize: 14,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  checkmarkContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 48,
    color: '#fff',
    fontWeight: '700',
  },
  successTitle: {
    fontSize: 20,
    textAlign: 'center',
  },
  successText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
