import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, fonts } from '@/constants/theme';

interface StatPillProps {
  label: string;
  value: string;
  color?: string;
}

export function StatPill({ label, value, color = colors.blue }: StatPillProps) {
  return (
    <View style={[styles.container, { borderColor: color }]}>
      <View style={[styles.accent, { backgroundColor: color }]} />
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  accent: {
    width: 3,
    height: 40,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textSub,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  value: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text,
  },
});
