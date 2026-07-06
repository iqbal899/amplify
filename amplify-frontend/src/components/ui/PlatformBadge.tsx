import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, fonts } from '@/constants/theme';

interface PlatformBadgeProps {
  platform: 'instagram' | 'youtube';
}

export function PlatformBadge({ platform }: PlatformBadgeProps) {
  const isInstagram = platform === 'instagram';
  const bgColor = isInstagram ? colors.blueGlow : colors.cyanGlow;
  const textColor = isInstagram ? colors.blue : colors.cyan;
  const label = isInstagram ? 'Instagram' : 'YouTube';
  const icon = isInstagram ? '📷' : '▶️';

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  icon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
});
