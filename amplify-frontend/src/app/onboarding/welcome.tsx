import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Svg, Rect } from 'react-native-svg';
import { colors, spacing, radius, fonts } from '@/constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Animated equalizer bar
const AnimatedRect = Animated.createAnimatedComponent(Rect);

function EqualizerBars() {
  const bars = Array.from({ length: 8 }, (_, i) => {
    const heightValue = useSharedValue(20);

    React.useEffect(() => {
      const animate = () => {
        const randomHeight = 10 + Math.random() * 60;
        heightValue.value = withTiming(randomHeight, { duration: 300 });
      };

      const interval = setInterval(animate, 300);
      animate();
      return () => clearInterval(interval);
    }, [heightValue]);

    return heightValue;
  });

  return (
    <Svg width={240} height={120} viewBox="0 0 240 120">
      {bars.map((height, i) => {
        return (
          <Rect
            key={i}
            x={i * 28 + 8}
            y={60}
            width={20}
            height={60}
            fill={colors.blue}
            rx={4}
          />
        );
      })}
    </Svg>
  );
}

// Slide 1: Welcome with equalizer
function WelcomeSlide() {
  return (
    <View style={[styles.slide, { backgroundColor: colors.surface }]}>
      <View style={styles.slideContent}>
        <View style={styles.equalizerContainer}>
          <EqualizerBars />
        </View>
        <Text style={[styles.headline, { fontFamily: fonts.display, color: colors.text }]}>
          Your sound. Your content. Your payday.
        </Text>
      </View>
    </View>
  );
}

// Slide 2: How it works
function HowItWorksSlide() {
  const steps = [
    { title: 'Pick an audio from a live campaign', description: 'Browse trending sounds' },
    { title: 'Make a Reel or Short using that audio', description: 'Create your content' },
    { title: 'Submit your link and earn per milestone', description: 'Get paid instantly' },
  ];

  return (
    <View style={[styles.slide, { backgroundColor: colors.surface }]}>
      <ScrollView
        contentContainerStyle={styles.slideContent}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.slideTitle, { fontFamily: fonts.display }]}>
          How it works
        </Text>
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <View key={index} style={styles.step}>
              <View style={[styles.stepNumberCircle, { backgroundColor: colors.blue }]}>
                <Text style={[styles.stepNumber, { color: colors.bg }]}>
                  {index + 1}
                </Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { fontFamily: fonts.displayMedium }]}>
                  {step.title}
                </Text>
                <Text style={[styles.stepDescription, { color: colors.textMuted }]}>
                  {step.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// Slide 3: Join creators
function JoinCreatorsSlide() {
  const avatars = [
    { initials: 'SR', color: '#FF6B6B' },
    { initials: 'AK', color: '#4ECDC4' },
    { initials: 'MJ', color: '#FFE66D' },
    { initials: 'NP', color: '#95E1D3' },
    { initials: 'VK', color: '#C7CEEA' },
    { initials: 'PR', color: '#FF8B94' },
  ];

  return (
    <View style={[styles.slide, { backgroundColor: colors.surface }]}>
      <View style={styles.slideContent}>
        <Text style={[styles.slideTitle, { fontFamily: fonts.display }]}>
          Join 500+ creators already earning
        </Text>
        <View style={styles.avatarsContainer}>
          {avatars.map((avatar, i) => (
            <View
              key={i}
              style={[
                styles.avatar,
                {
                  backgroundColor: avatar.color,
                  marginLeft: i > 0 ? -20 : 0,
                  zIndex: avatars.length - i,
                },
              ]}
            >
              <Text style={styles.avatarInitials}>{avatar.initials}</Text>
            </View>
          ))}
        </View>
        <View style={styles.statsContainer}>
          <Text style={[styles.statsAmount, { fontFamily: fonts.display }]}>
            ₹4,50,000+
          </Text>
          <Text style={[styles.statsLabel, { color: colors.textMuted }]}>
            paid out
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const scrollX = useSharedValue(0);
  const [currentSlide, setCurrentSlide] = useState(0);

  const scrollViewRef = useRef<ScrollView>(null);

  const handleContinue = () => {
    router.push("/onboarding/login");
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    scrollX.value = offsetX;
    const slide = Math.round(offsetX / screenWidth);
    setCurrentSlide(slide);
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((event) => {
      const threshold = 50;
      if (event.translationX < -threshold && currentSlide < 2) {
        scrollViewRef.current?.scrollTo({
          x: screenWidth * (currentSlide + 1),
          animated: true,
        });
        setCurrentSlide(currentSlide + 1);
      } else if (event.translationX > threshold && currentSlide > 0) {
        scrollViewRef.current?.scrollTo({
          x: screenWidth * (currentSlide - 1),
          animated: true,
        });
        setCurrentSlide(currentSlide - 1);
      }
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
        >
          <WelcomeSlide />
          <HowItWorksSlide />
          <JoinCreatorsSlide />
        </ScrollView>

        {/* Dot indicators */}
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((i) => {
            const isActive = currentSlide === i;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isActive ? colors.blue : colors.border,
                    width: isActive ? 24 : 8,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Continue button */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: colors.blue }]}
            onPress={handleContinue}
          >
            <Text style={[styles.continueText, { fontFamily: fonts.displayMedium }]}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  equalizerContainer: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  headline: {
    fontSize: 42,
    lineHeight: 50,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  slideTitle: {
    fontSize: 36,
    lineHeight: 44,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  stepsContainer: {
    width: '100%',
    gap: spacing.lg,
  },
  step: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  stepNumberCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
    gap: spacing.xs,
  },
  stepTitle: {
    fontSize: 16,
  },
  stepDescription: {
    fontSize: 14,
  },
  avatarsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    height: 70,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  statsContainer: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  statsAmount: {
    fontSize: 32,
  },
  statsLabel: {
    fontSize: 14,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  ctaContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  continueButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    fontSize: 16,
    color: '#fff',
  },
});
