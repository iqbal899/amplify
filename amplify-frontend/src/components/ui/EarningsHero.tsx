import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useStyles } from '@/hooks/useStyles';
import { spacing, fonts } from '@/constants/theme';

interface EarningsHeroProps {
  amount: number;
  label?: string;
  subLabel?: string;
}

export function EarningsHero({ amount, label = 'Total Earnings', subLabel }: EarningsHeroProps) {
  const progress = useSharedValue(0);
  const rotation = useSharedValue(0);
  const styles = useStyles(getStyles);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: 1500,
      easing: Easing.out(Easing.cubic),
    });

    rotation.value = withTiming(360, {
      duration: 3000,
      easing: Easing.linear,
    });
  }, [amount, progress, rotation]);

  const displayAmount = interpolate(
    progress.value,
    [0, 1],
    [0, amount],
    Extrapolate.CLAMP
  );

  const animatedNumberStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const animatedCoinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
    opacity: progress.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.background} />

      <View style={styles.content}>
        <View style={styles.amountContainer}>
          <Animated.View style={[styles.coinIcon, animatedCoinStyle]}>
            <Text style={styles.coin}>₹</Text>
          </Animated.View>
          <Animated.Text style={[styles.amount, animatedNumberStyle]}>
            {displayAmount.toLocaleString('en-IN', {
              maximumFractionDigits: 0,
            })}
          </Animated.Text>
        </View>

        <Text style={styles.label}>{label}</Text>
        {subLabel && <Text style={styles.subLabel}>{subLabel}</Text>}
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.goldGlow,
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  coinIcon: {
    marginRight: spacing.sm,
  },
  coin: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: colors.gold,
  },
  amount: {
    fontFamily: fonts.display,
    fontSize: 42,
    color: colors.text,
    fontWeight: '700',
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSub,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  subLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
