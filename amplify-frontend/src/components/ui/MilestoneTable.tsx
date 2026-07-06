import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, radius, fonts } from '@/constants/theme';
import type { Milestone } from '@/types';

interface MilestoneTableProps {
  milestones: Milestone[];
}

export function MilestoneTable({ milestones }: MilestoneTableProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.viewsColumn]}>Views</Text>
        <Text style={[styles.headerCell, styles.durationColumn]}>Min. Duration</Text>
        <Text style={[styles.headerCell, styles.earningsColumn]}>You Earn</Text>
        <Text style={[styles.headerCell, styles.totalColumn]}>Total</Text>
      </View>

      {milestones.map((milestone, index) => (
        <MilestoneRow
          key={`${milestone.views}-${index}`}
          milestone={milestone}
          index={index}
          isAlt={index % 2 === 1}
        />
      ))}
    </View>
  );
}

interface MilestoneRowProps {
  milestone: Milestone;
  index: number;
  isAlt: boolean;
}

function MilestoneRow({ milestone, index, isAlt }: MilestoneRowProps) {
  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      index * 50,
      withTiming(0, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      })
    );
    opacity.value = withDelay(
      index * 50,
      withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [index, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const minDuration = milestone.minDaysLive ? `${milestone.minDaysLive}d` : '-';

  return (
    <Animated.View
      style={[
        styles.row,
        isAlt && styles.rowAlt,
        animatedStyle,
      ]}
    >
      <Text style={[styles.cell, styles.viewsColumn]}>
        {milestone.views.toLocaleString('en-IN')}
      </Text>
      <Text style={[styles.cell, styles.durationColumn]}>
        {minDuration}
      </Text>
      <Text style={[styles.cell, styles.earningsColumn]}>
        ₹{milestone.incrementalPayout.toLocaleString('en-IN')}
      </Text>
      <Text style={[styles.cell, styles.totalColumn]}>
        ₹{milestone.cumulativePayout.toLocaleString('en-IN')}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCell: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.textSub,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowAlt: {
    backgroundColor: colors.surfaceElevated,
  },
  cell: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.text,
  },
  viewsColumn: {
    flex: 1.2,
  },
  durationColumn: {
    flex: 1.2,
  },
  earningsColumn: {
    flex: 1,
  },
  totalColumn: {
    flex: 1,
  },
});
