import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";

import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import { BadgeCheck } from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";

import {
  spacing,
  radius,
  fonts,
} from "@/constants/theme";

interface PlatformBadgeProps {
  platform: "instagram" | "youtube";
}

export function PlatformBadge({
  platform,
}: PlatformBadgeProps) {
  const colors = useTheme();

  const styles = createStyles(colors);

  const isInstagram =
    platform === "instagram";

  return (
    <View style={styles.badge}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isInstagram
              ? colors.blueGlow
              : colors.red + "15",
          },
        ]}
      >
        {isInstagram ? (
          <MaterialCommunityIcons
            name="instagram"
            size={18}
            color={colors.blue}
          />
        ) : (
          <MaterialCommunityIcons
            name="youtube"
            size={18}
            color="#FF0000"
          />
        )}
      </View>

      <Text
        style={[
          styles.label,
          {
            color: isInstagram
              ? colors.blue
              : colors.cyan,
          },
        ]}
      >
        {isInstagram
          ? "Instagram"
          : "YouTube"}
      </Text>

      <BadgeCheck
        size={16}
        color={colors.green}
      />
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof useTheme>
) =>
  StyleSheet.create({
    badge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.full,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginRight: spacing.sm,
    },

    iconContainer: {
      width: 30,
      height: 30,
      borderRadius: 15,
      justifyContent: "center",
      alignItems: "center",
      marginRight: spacing.sm,
    },

    label: {
      fontFamily: fonts.bodyBold,
      fontSize: 13,
      marginRight: spacing.xs,
    },
  });