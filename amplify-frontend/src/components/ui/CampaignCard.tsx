/* eslint-disable react-hooks/immutability, react-hooks/purity */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useStyles } from '@/hooks/useStyles';
import { spacing, radius, fonts } from '@/constants/theme';
import type { Campaign } from '@/types';

interface CampaignCardProps {
  campaign: Campaign;
  isEnrolled: boolean;
  onPress: () => void;
}

export function CampaignCard({ campaign, isEnrolled, onPress }: CampaignCardProps) {
  const scale = useSharedValue(1);
  const styles = useStyles(getStyles);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
  };

  const timeRemaining = useMemo(() => {
    const diff = new Date(campaign.endsAt).getTime() - Date.now();
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `Ends in ${days}d ${hours}h`;
    return `Ends in ${hours}h`;
  }, [campaign.endsAt]);

  const payoutRange = useMemo(() => {
    if (campaign.milestones.length === 0) return '₹0';
    const min = campaign.milestones[0].incrementalPayout;
    const max = campaign.milestones[campaign.milestones.length - 1].cumulativePayout;
    return `₹${min.toLocaleString('en-IN')} – ₹${max.toLocaleString('en-IN')}`;
  }, [campaign.milestones]);

  const isFull = campaign.status === 'full';

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <View style={styles.container}>
          <View style={styles.artContainer}>
            <View style={styles.artPlaceholder}>
              <Text style={styles.artLetter}>{campaign.trackName[0]}</Text>
            </View>
            {isFull && <View style={styles.fullOverlay} />}
          </View>

          <View style={styles.info}>
            <View style={styles.titleRow}>
              <Text style={styles.trackName} numberOfLines={1}>{campaign.trackName}</Text>
              {isEnrolled && (
                <View style={styles.enrolledBadge}>
                  <Text style={styles.enrolledBadgeText}>Enrolled</Text>
                </View>
              )}
              {campaign.isTrending && !isEnrolled && (
                <View style={styles.trendingBadge}>
                  <Text style={styles.trendingBadgeText}>Trending</Text>
                </View>
              )}
              {campaign.isNew && !campaign.isTrending && !isEnrolled && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>New</Text>
                </View>
              )}
            </View>

            <Text style={styles.artistName} numberOfLines={1}>{campaign.artistName}</Text>

            <View style={styles.bottomRow}>
              <Text style={styles.payoutRange}>{payoutRange}</Text>
              <View style={styles.timeContainer}>
                <Text style={[styles.timeRemaining, isFull && styles.mutedText]}>{timeRemaining}</Text>
                {!isFull && !isEnrolled && (
                  <View style={styles.openDot}>
                    <View style={styles.openDotInner} />
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  container: {
    flexDirection: 'row',
    padding: spacing.md,
    alignItems: 'center',
  },
  artContainer: {
    position: 'relative',
    width: 64,
    height: 64,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  artPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.blueGlow,
  },
  artLetter: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.blue,
    opacity: 0.8,
  },
  fullOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,10,15,0.5)',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackName: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  artistName: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSub,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  payoutRange: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.blue,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timeRemaining: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textSub,
  },
  mutedText: {
    color: colors.textMuted,
  },
  openDot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  openDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  enrolledBadge: {
    backgroundColor: colors.blue,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  enrolledBadgeText: {
    color: colors.surface,
    fontSize: 9,
    fontFamily: fonts.bodyBold,
  },
  trendingBadge: {
    backgroundColor: colors.red,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  trendingBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: fonts.bodyBold,
  },
  newBadge: {
    backgroundColor: colors.green,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: fonts.bodyBold,
  },
});
