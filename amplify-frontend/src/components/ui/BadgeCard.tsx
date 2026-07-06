import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStyles } from '@/hooks/useStyles';
import { spacing, radius, fonts } from '@/constants/theme';
import type { AchievementBadge } from '@/types';

interface BadgeCardProps {
  badge: AchievementBadge;
}

export function BadgeCard({ badge }: BadgeCardProps) {
  const isLocked = !badge.unlocked;
  const styles = useStyles(getStyles);

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {badge.icon && (
          <View style={styles.placeholderArtwork}>
            <Text style={styles.iconText}>{badge.icon}</Text>
            {isLocked && <View style={styles.blurOverlay} />}
          </View>
        )}
        {!badge.icon && (
          <View style={styles.placeholderArtwork}>
            {isLocked && <View style={styles.blurOverlay} />}
          </View>
        )}

        {isLocked && (
          <View style={styles.lockIcon}>
            <Text style={styles.lockText}>🔒</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name}>{badge.name}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {badge.description}
        </Text>

        {isLocked && badge.progress !== undefined && badge.progressHint !== undefined && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(badge.progress * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {badge.progress} / {`${badge.progressHint}`}
            </Text>
          </View>
        )}

        {!isLocked && (
          <View style={styles.unlockedBadge}>
            <Text style={styles.unlockedText}>Unlocked</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    width: 140,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  placeholderArtwork: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.blueGlow,
  },
  iconText: {
    fontSize: 32,
    lineHeight: 40,
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,10,15,0.4)',
  },
  lockIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -16,
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(10,10,15,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockText: {
    fontSize: 18,
  },
  content: {
    padding: spacing.md,
  },
  name: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSub,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.blue,
    borderRadius: radius.full,
  },
  progressText: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textSub,
  },
  unlockedBadge: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.greenGlow,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  unlockedText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.green,
  },
});
