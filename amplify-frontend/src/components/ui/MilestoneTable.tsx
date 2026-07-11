import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";

import Animated, {
  FadeInDown,
} from "react-native-reanimated";

import {
  Eye,
  Clock3,
  Wallet,
  TrendingUp,
  ArrowRight,
  Target,
} from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";

import {
  spacing,
  radius,
  fonts,
} from "@/constants/theme";

import type { Milestone } from "@/types";

interface Props {
  milestones: Milestone[];
}

export function MilestoneTable({
  milestones,
}: Props) {
  const colors = useTheme();

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        Milestone Rewards
      </Text>

      <Text style={styles.subtitle}>
        Complete each milestone to unlock
        higher rewards and maximize your
        campaign earnings.
      </Text>

      {milestones.map((milestone, index) => (
        <Animated.View
          key={index}
          entering={FadeInDown.delay(index * 120)}
          style={styles.timelineContainer}
        >
          <View style={styles.timeline}>
            <View style={styles.dot}>
              <Target
                size={16}
                color={colors.blue}
              />
            </View>

            {index !== milestones.length - 1 && (
              <View style={styles.line} />
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.topAccent} />

            <View style={styles.content}>
              <View style={styles.header}>
                <View style={styles.badge}>
                  <Text
                    style={styles.badgeText}
                  >
                    Milestone {index + 1}
                  </Text>
                </View>

                <TrendingUp
                  size={18}
                  color={colors.blue}
                />
              </View>

              <View style={styles.metricsRow}>
                <MetricCard
                  styles={styles}
                  icon={
                    <Eye
                      size={18}
                      color={colors.blue}
                    />
                  }
                  label="Target Views"
                  value={milestone.views.toLocaleString()}
                />

                <MetricCard
                  styles={styles}
                  icon={
                    <Clock3
                      size={18}
                      color={colors.amber}
                    />
                  }
                  label="Live For"
                  value={`${milestone.minDaysLive} Days`}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.rewardCard}>
                <View
                  style={styles.rewardGlow}
                />

                <View>
                  <Text
                    style={
                      styles.rewardLabel
                    }
                  >
                    Reward Increase
                  </Text>

                  <View
                    style={
                      styles.rewardRow
                    }
                  >
                    <Wallet
                      size={18}
                      color={colors.green}
                    />

                    <Text
                      style={
                        styles.rewardIncrement
                      }
                    >
                      +₹
                      {milestone.incrementalPayout.toLocaleString()}
                    </Text>
                  </View>
                </View>

                <ArrowRight
                  size={18}
                  color={colors.textMuted}
                />

                <View
                  style={
                    styles.totalContainer
                  }
                >
                  <Text
                    style={
                      styles.rewardLabel
                    }
                  >
                    Total Earned
                  </Text>

                  <Text
                    style={
                      styles.totalReward
                    }
                  >
                    ₹
                    {milestone.cumulativePayout.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}
function MetricCard({
  icon,
  label,
  value,
  styles,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.metricCard}>
      {icon}

      <Text style={styles.metricLabel}>
        {label}
      </Text>

      <Text style={styles.metricValue}>
        {value}
      </Text>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      marginTop: spacing.md,
    },

    heading: {
      fontFamily: fonts.display,
      fontSize: 22,
      color: colors.text,
    },

    subtitle: {
      marginTop: spacing.xs,
      marginBottom: spacing.xl,

      fontFamily: fonts.body,

      fontSize: 14,

      color: colors.textMuted,

      lineHeight: 21,
    },

    timelineContainer: {
      flexDirection: "row",

      marginBottom: spacing.xl,
    },

    timeline: {
      width: 46,

      alignItems: "center",
    },

    dot: {
      width: 42,
      height: 42,

      borderRadius: 21,

      backgroundColor: colors.surfaceElevated,

      borderWidth: 2,

      borderColor: colors.blue,

      justifyContent: "center",

      alignItems: "center",
    },

    line: {
      width: 2,

      flex: 1,

      minHeight: 160,

      marginTop: spacing.sm,

      backgroundColor: colors.border,
    },

    card: {
      flex: 1,

      marginLeft: spacing.md,

      backgroundColor: colors.surfaceElevated,

      borderRadius: radius.xl,

      borderWidth: 1,

      borderColor: colors.border,

      overflow: "hidden",
    },

    topAccent: {
      height: 4,

      backgroundColor: colors.blue,
    },

    content: {
      padding: spacing.lg,
    },

    header: {
      flexDirection: "row",

      justifyContent: "space-between",

      alignItems: "center",

      marginBottom: spacing.lg,
    },

    badge: {
      backgroundColor: colors.surfaceElevated,

      borderWidth: 1,

      borderColor: colors.border,

      paddingHorizontal: spacing.md,

      paddingVertical: 6,

      borderRadius: radius.full,
    },

    badgeText: {
      color: colors.blue,

      fontFamily: fonts.bodyBold,

      fontSize: 12,
    },

    metricsRow: {
      flexDirection: "row",

      gap: spacing.md,
    },

    metricCard: {
      flex: 1,

      backgroundColor: colors.bg,

      borderRadius: radius.lg,

      borderWidth: 1,

      borderColor: colors.border,

      alignItems: "center",

      paddingVertical: spacing.lg,
    },

    metricLabel: {
      marginTop: spacing.sm,

      color: colors.textMuted,

      fontFamily: fonts.body,

      fontSize: 12,

      textAlign: "center",
    },

    metricValue: {
      marginTop: spacing.xs,

      color: colors.text,

      fontFamily: fonts.displayMedium,

      fontSize: 18,
    },
    divider: {
      height: 1,

      backgroundColor: colors.border,

      marginVertical: spacing.lg,
    },

    rewardCard: {
      position: "relative",

      overflow: "hidden",

      backgroundColor: colors.bg,

      borderWidth: 1,

      borderColor: colors.border,

      borderRadius: radius.lg,

      padding: spacing.lg,

      flexDirection: "row",

      justifyContent: "space-between",

      alignItems: "center",
    },

    rewardGlow: {
      position: "absolute",

      top: 0,
      left: 0,
      right: 0,
      bottom: 0,

      backgroundColor: colors.greenGlow,

      opacity: 0.45,
    },

    rewardLabel: {
      color: colors.textMuted,

      fontFamily: fonts.body,

      fontSize: 12,

      marginBottom: spacing.xs,
    },

    rewardRow: {
      flexDirection: "row",

      alignItems: "center",
    },

    rewardIncrement: {
      marginLeft: spacing.xs,

      color: colors.green,

      fontFamily: fonts.display,

      fontSize: 22,
    },

    totalContainer: {
      alignItems: "flex-end",
    },

    totalReward: {
      color: colors.green,

      fontFamily: fonts.display,

      fontSize: 24,
    },
  });