import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import Animated, {
  FadeInLeft,
} from "react-native-reanimated";

import {
  CheckCircle2,
  CircleAlert,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";

import {
  spacing,
  radius,
  fonts,
} from "@/constants/theme";

type Rule = {
  text: string;
  type: "success" | "warning" | "danger";
};

interface Props {
  rules?: Rule[];
}

const DEFAULT_RULES: Rule[] = [
  {
    text: "Audio must remain clearly audible for at least 5 seconds.",
    type: "warning",
  },
  {
    text: "Only original creator content is allowed.",
    type: "success",
  },
  {
    text: "Reel must stay public during the campaign period.",
    type: "warning",
  },
  {
    text: "Deleting your reel before verification forfeits rewards.",
    type: "danger",
  },
  {
    text: "Only one submission is allowed per campaign.",
    type: "success",
  },
  {
    text: "Artificial or bot views lead to permanent disqualification.",
    type: "danger",
  },
];

export function RulesCard({
  rules = DEFAULT_RULES,
}: Props) {
  const colors = useTheme();

  const styles = createStyles(colors);

  const [expanded, setExpanded] =
    useState(false);

  const getIcon = (type: Rule["type"]) => {
    switch (type) {
      case "success":
        return (
          <CheckCircle2
            size={20}
            color={colors.green}
          />
        );

      case "warning":
        return (
          <CircleAlert
            size={20}
            color={colors.amber}
          />
        );

      case "danger":
        return (
          <ShieldCheck
            size={20}
            color={colors.red}
          />
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Campaign Guidelines
      </Text>

      <Text style={styles.subtitle}>
        Follow these rules to ensure your
        submission is approved.
      </Text>

      {rules.map((rule, index) => (
        <Animated.View
          key={index}
          entering={FadeInLeft.delay(index * 80)}
          style={styles.ruleCard}
        >
          <View style={styles.iconContainer}>
            {getIcon(rule.type)}
          </View>

          <Text style={styles.ruleText}>
            {rule.text}
          </Text>
        </Animated.View>
      ))}

      <TouchableOpacity
        onPress={() =>
          setExpanded(!expanded)
        }
        style={styles.expandButton}
      >
        <Text style={styles.expandText}>
          {expanded
            ? "Hide Terms"
            : "View Campaign Terms"}
        </Text>

        {expanded ? (
          <ChevronUp
            size={18}
            color={colors.green}
          />
        ) : (
          <ChevronDown
            size={18}
            color={colors.green}
          />
        )}
      </TouchableOpacity>

      {expanded && (
        <Animated.View
          entering={FadeInLeft}
          style={styles.termsContainer}
        >
          <View style={styles.termsAccent} />

          <Text style={styles.termsText}>
            Your submission will be reviewed
            before rewards are released.
            Failure to follow campaign
            guidelines, deletion of content,
            or artificial engagement may
            result in rejection or permanent
            removal from the platform.
          </Text>
        </Animated.View>
      )}
    </View>
  );
}
const createStyles = (
  colors: ReturnType<typeof useTheme>
) =>
  StyleSheet.create({
    container: {
      marginTop: spacing.lg,
    },

    title: {
      fontFamily: fonts.display,
      fontSize: 20,
      color: colors.text,
    },

    subtitle: {
      marginTop: spacing.xs,
      marginBottom: spacing.lg,

      fontFamily: fonts.body,

      color: colors.textMuted,

      lineHeight: 20,
    },

    ruleCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },

    iconContainer: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
      marginRight: spacing.md,
    },

    ruleText: {
      flex: 1,
      color: colors.text,
      fontFamily: fonts.bodyMedium,
      fontSize: 14,
      lineHeight: 21,
    },

    expandButton: {
      marginTop: spacing.lg,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.md,
    },

    expandText: {
      color: colors.green,
      fontFamily: fonts.bodyBold,
      marginRight: spacing.xs,
      fontSize: 15,
    },
        termsContainer: {
      marginTop: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },

    termsAccent: {
      height: 4,
      backgroundColor: colors.green,
    },

    termsText: {
      padding: spacing.lg,
      color: colors.textMuted,
      fontFamily: fonts.body,
      fontSize: 14,
      lineHeight: 22,
    },
  });