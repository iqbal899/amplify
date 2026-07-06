import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, radius, fonts } from '@/constants/theme';

interface Rule {
  icon: string;
  text: string;
  highlight?: boolean;
}

interface RulesCardProps {
  rules?: Rule[];
  expanded?: boolean;
}

const DEFAULT_RULES: Rule[] = [
  { icon: '⚠️', text: 'Audio must be primary/audible for 5+ continuous seconds' },
  { icon: '✅', text: 'Original content only (no slideshows)' },
  { icon: '🕐', text: 'Content must remain public for minimum duration' },
  { icon: '❌', text: 'Deletion before window closes forfeits payout', highlight: true },
  { icon: '✅', text: 'One submission per audio per creator' },
  { icon: '❌', text: 'No bot/artificial views — permanent disqualification' },
];

export function RulesCard({ rules = DEFAULT_RULES, expanded: initialExpanded = false }: RulesCardProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rules & Requirements</Text>

      <View style={styles.rulesList}>
        {rules.map((rule, index) => (
          <RuleItem key={index} rule={rule} index={index} />
        ))}
      </View>

      <Pressable onPress={() => setIsExpanded(!isExpanded)}>
        <View style={styles.expandButton}>
          <Text style={styles.expandButtonText}>
            {isExpanded ? 'Hide' : 'Read'} the full terms
          </Text>
        </View>
      </Pressable>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.termsText}>
            By submitting content, you agree to comply with all terms and conditions. Your content will be reviewed for compliance before payment is released. Violation of any rule may result in permanent disqualification from future campaigns.
          </Text>
        </View>
      )}
    </View>
  );
}

interface RuleItemProps {
  rule: Rule;
  index: number;
}

function RuleItem({ rule, index }: RuleItemProps) {
  const translateX = useSharedValue(-20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(
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
  }, [index, translateX, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.ruleItem,
        rule.highlight && styles.ruleItemHighlight,
        animatedStyle,
      ]}
    >
      <Text style={styles.ruleIcon}>{rule.icon}</Text>
      <Text style={[styles.ruleText, rule.highlight && styles.ruleTextHighlight]}>
        {rule.text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  rulesList: {
    marginBottom: spacing.md,
  },
  ruleItem: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  ruleItemHighlight: {
    backgroundColor: colors.amber,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    paddingLeft: spacing.sm - 2,
    opacity: 0.1,
  },
  ruleIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  ruleText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  ruleTextHighlight: {
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  expandButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  expandButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.blue,
  },
  expandedContent: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  termsText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSub,
    lineHeight: 18,
  },
});
