import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { spacing, radius, fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useCampaignStore } from "@/store/campaignStore";

export default function SubmissionDetailModal() {
  const router = useRouter();
  const colors = useTheme();

  const { campaignId } = useLocalSearchParams<{
    campaignId: string;
  }>();

  const campaign = useCampaignStore((s) =>
    s.getCampaignById(Number(campaignId))
  );

  const submission = useCampaignStore((s) =>
    s.getSubmissionByCampaignId(Number(campaignId))
  );

  if (!campaign || !submission) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.bg,
        }}
      >
        <Text style={{ color: colors.text }}>
          Submission not found
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.bg,
      }}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: spacing.lg,
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons
              name="close"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>

          <Text
            style={{
              fontFamily: fonts.displayMedium,
              fontSize: 18,
              color: colors.text,
            }}
          >
            Submission
          </Text>

          <View style={{ width: 24 }} />
        </View>

        {/* Content */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            padding: spacing.lg,
            marginHorizontal: spacing.lg,
            marginBottom: spacing.xl,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.displayMedium,
              fontSize: 20,
              color: colors.text,
            }}
          >
            {campaign.trackName}
          </Text>

          <Text
            style={{
              color: colors.textMuted,
              marginTop: spacing.xs,
            }}
          >
            {campaign.artistName}
          </Text>

          {/* Reel URL */}
          <Text
            style={{
              marginTop: spacing.xl,
              color: colors.textMuted,
            }}
          >
            Reel URL
          </Text>

          <TouchableOpacity
            onPress={() =>
              Linking.openURL(submission.reelUrl)
            }
          >
            <Text
              style={{
                color: colors.blue,
                marginTop: spacing.sm,
              }}
            >
              {submission.reelUrl}
            </Text>
          </TouchableOpacity>

          {/* Platform */}
          <Text
            style={{
              marginTop: spacing.lg,
              color: colors.textMuted,
            }}
          >
            Platform
          </Text>

          <Text
            style={{
              color: colors.text,
              marginTop: spacing.sm,
            }}
          >
            {submission.platform}
          </Text>

          {/* Views */}
          <Text
            style={{
              marginTop: spacing.lg,
              color: colors.textMuted,
            }}
          >
            Current Views
          </Text>

          <Text
            style={{
              color: colors.text,
              marginTop: spacing.sm,
            }}
          >
            {submission.currentViews}
          </Text>

          {/* Verification */}
          <Text
            style={{
              marginTop: spacing.lg,
              color: colors.textMuted,
            }}
          >
            Verification
          </Text>

          <View
            style={{
              marginTop: spacing.sm,
              alignSelf: "flex-start",
              backgroundColor: colors.amber,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              borderRadius: radius.full,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontFamily: fonts.displayMedium,
              }}
            >
              {submission.verificationStatus}
            </Text>
          </View>

          {/* Submitted On */}
          <Text
            style={{
              marginTop: spacing.lg,
              color: colors.textMuted,
            }}
          >
            Submitted On
          </Text>

          <Text
            style={{
              color: colors.text,
              marginTop: spacing.sm,
            }}
          >
            {new Date(
              submission.submittedAt
            ).toLocaleString()}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}