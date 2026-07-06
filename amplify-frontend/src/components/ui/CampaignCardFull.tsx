/* eslint-disable react-hooks/immutability, react-hooks/purity */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useStyles } from '@/hooks/useStyles';
import { spacing, radius, fonts } from '@/constants/theme';
import type { Campaign, EnrolledCampaign } from '@/types';

interface CampaignCardFullProps {
  campaign: Campaign;
  enrolled: EnrolledCampaign;
  onPress: () => void;
}

export function CampaignCardFull({ campaign, enrolled, onPress }: CampaignCardFullProps) {
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

  const daysRemaining = useMemo(() => {
    const diff = new Date(campaign.endsAt).getTime() - Date.now();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [campaign.endsAt]);

  const nextMilestone = useMemo(() => {
    const completed = campaign.milestones.filter(m => m.views <= enrolled.currentViews);
    if (completed.length === 0) return campaign.milestones[0];
    return campaign.milestones[completed.length];
  }, [campaign.milestones, enrolled.currentViews]);

  const progressPercent = useMemo(() => {
    if (!nextMilestone) return 100;
    const prevViews = nextMilestone === campaign.milestones[0] ? 0 : campaign.milestones[campaign.milestones.indexOf(nextMilestone) - 1].views;
    const progress = enrolled.currentViews - prevViews;
    const target = nextMilestone.views - prevViews;
    return Math.min((progress / target) * 100, 100);
  }, [enrolled.currentViews, nextMilestone, campaign.milestones]);

  const earnedAmount = useMemo(() => {
    const completed = campaign.milestones.filter(m => m.views <= enrolled.currentViews);
    if (completed.length === 0) return 0;
    return completed[completed.length - 1].cumulativePayout;
  }, [campaign.milestones, enrolled.currentViews]);

  const potentialAmount = campaign.milestones[campaign.milestones.length - 1]?.cumulativePayout || 0;

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <View style={styles.container}>
          <View style={styles.artContainer}>
            <View style={styles.artImage}>
              <Text style={styles.artLetter}>{campaign.trackName[0]}</Text>
            </View>
          </View>

          <View style={styles.content}>
            <View>
              <Text style={styles.trackName} numberOfLines={1}>{campaign.trackName}</Text>
              <Text style={styles.artistName} numberOfLines={1}>{campaign.artistName}</Text>

              <View style={styles.urlContainer}>
                <Text style={styles.urlLabel}>Submitted:</Text>
                <Text style={styles.url} numberOfLines={1}>{enrolled.submittedUrl}</Text>
              </View>

              <View style={styles.statusContainer}>
                <View style={styles.statusIndicator}>
                  {enrolled.verificationStatus === 'pending' && (
                    <Animated.View style={[styles.pulsingDot, { opacity: 0.6 }]} />
                  )}
                  {enrolled.verificationStatus === 'verified' && (
                    <View style={[styles.statusDot, styles.verifiedDot]} />
                  )}
                  {enrolled.verificationStatus === 'rejected' && (
                    <View style={[styles.statusDot, styles.rejectedDot]} />
                  )}
                </View>
                <Text style={styles.statusText}>{enrolled.verificationStatus}</Text>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                </View>
              </View>

              <View style={styles.statsRow}>
                <View>
                  <Text style={styles.statsLabel}>Current views</Text>
                  <Text style={styles.statsValue}>{enrolled.currentViews.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.nextMilestoneInfo}>
                  <Text style={styles.statsLabel}>Next milestone</Text>
                  <Text style={styles.statsValue}>{nextMilestone?.views.toLocaleString('en-IN') || '-'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.footer}>
              <View>
                <Text style={[styles.daysRemaining, daysRemaining < 3 && styles.daysWarning]}>
                  {daysRemaining > 0 ? `${daysRemaining}d left` : 'Ended'}
                </Text>
              </View>
              <View style={styles.earningsInfo}>
                <Text style={styles.earningsLabel}>Earned</Text>
                <Text style={styles.earningsValue}>₹{earnedAmount.toLocaleString('en-IN')}</Text>
                <Text style={styles.earningsSubtext}>of ₹{potentialAmount.toLocaleString('en-IN')}</Text>
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
    marginBottom: spacing.md,
  },
  container: {
    flexDirection: 'row',
    padding: spacing.md,
  },
  artContainer: {
    marginRight: spacing.md,
  },
  artImage: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
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
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  trackName: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.text,
  },
  artistName: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSub,
    marginTop: 2,
  },
  urlContainer: {
    marginTop: spacing.sm,
  },
  urlLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textSub,
  },
  url: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.blue,
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  statusIndicator: {
    marginRight: spacing.xs,
    height: 8,
    width: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.blue,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  verifiedDot: {
    backgroundColor: colors.green,
  },
  rejectedDot: {
    backgroundColor: colors.red,
  },
  statusText: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textSub,
    textTransform: 'capitalize',
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.blue,
    borderRadius: radius.full,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  nextMilestoneInfo: {
    alignItems: 'flex-end',
  },
  statsLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textSub,
  },
  statsValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.text,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.sm,
  },
  daysRemaining: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textSub,
  },
  daysWarning: {
    color: colors.red,
    fontFamily: fonts.bodyBold,
  },
  earningsInfo: {
    alignItems: 'flex-end',
  },
  earningsLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textSub,
  },
  earningsValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.text,
    marginTop: 2,
  },
  earningsSubtext: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },
});
