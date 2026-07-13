import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Music4,
  ShieldCheck,
  Globe,
  BadgeIndianRupee,
  TriangleAlert,
  CircleHelp,
} from "lucide-react-native";

import { spacing, radius, fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const rules = [
  {
    title: "Original Content",
    description:
      "Upload only original videos created by you. Reused or copied content may be rejected.",
    icon: ShieldCheck,
    color: "#10B981",
  },
  {
    title: "Audio Usage",
    description:
      "The campaign audio must remain clearly audible for at least 5 continuous seconds.",
    icon: Music4,
    color: "#3B82F6",
  },
  {
    title: "Public Visibility",
    description:
      "Keep your reel public until the campaign ends and verification is complete.",
    icon: Globe,
    color: "#F59E0B",
  },
  {
    title: "Artificial Engagement",
    description:
      "Bots, fake followers, purchased likes or views will permanently disqualify submissions.",
    icon: TriangleAlert,
    color: "#EF4444",
  },
  {
    title: "Rewards & Verification",
    description:
      "Rewards are processed only after manual verification of campaign requirements.",
    icon: BadgeIndianRupee,
    color: "#059669",
  },
  {
    title: "Support",
    description:
      "Need help? Reach out to the DoorBeen team for assistance regarding campaigns.",
    icon: CircleHelp,
    color: "#6366F1",
  },
];

export default function TermsAndRules() {
  const router = useRouter();
  const colors = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={{
            padding: spacing.lg,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={26} color={colors.text} />
          </TouchableOpacity>

          <Text
            style={{
              marginLeft: spacing.md,
              fontSize: 24,
              fontFamily: fonts.display,
              color: colors.text,
            }}
          >
            Terms & Rules
          </Text>
        </View>

        <Text
          style={{
            paddingHorizontal: spacing.lg,
            marginBottom: spacing.xl,
            color: colors.textMuted,
            fontFamily: fonts.body,
            lineHeight: 22,
          }}
        >
          Please read these guidelines carefully before joining or submitting to
          any campaign.
        </Text>

        {rules.map((item, index) => {
          const Icon = item.icon;

          return (
            <View
              key={index}
              style={{
                backgroundColor: colors.surface,
                marginHorizontal: spacing.lg,
                marginBottom: spacing.md,
                borderRadius: radius.xl,
                padding: spacing.lg,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: `${item.color}15`,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: spacing.md,
                  }}
                >
                  <Icon size={22} color={item.color} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: fonts.displayMedium,
                      fontSize: 17,
                      color: colors.text,
                    }}
                  >
                    {item.title}
                  </Text>

                  <Text
                    style={{
                      marginTop: 6,
                      lineHeight: 21,
                      fontFamily: fonts.body,
                      color: colors.textMuted,
                    }}
                  >
                    {item.description}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        <View
          style={{
            padding: spacing.xl,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              textAlign: "center",
              color: colors.textMuted,
              fontFamily: fonts.body,
            }}
          >
            DoorBeen reserves the right to reject submissions that violate these
            guidelines.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}