import React, { useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronRight, Clock3 } from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";
import { spacing, radius, fonts } from "@/constants/theme";
import { useCampaignStore } from "@/store/campaignStore";

export default function CampaignHistory() {
    const router = useRouter();
    const colors = useTheme();

    const {
        campaigns,
        enrolled,
        loadCampaigns,
        loadEnrollments,
    } = useCampaignStore();

    useEffect(() => {
        loadCampaigns();
        loadEnrollments();
    }, [loadCampaigns, loadEnrollments]);

    const history = enrolled
        .map((enrollment) => {
            const campaign = campaigns.find(
                (c) => c.id === enrollment.campaignId
            );
            if (!campaign) return null;
            return { campaign, enrollment };
        })
        .filter(
            (
                item
            ): item is {
                campaign: typeof campaigns[number];
                enrollment: typeof enrolled[number];
            } =>
                item !== null &&
                new Date(item.campaign.endsAt) < new Date()
        );

    if (history.length === 0) {
        return (
            <SafeAreaView
                style={{
                    flex: 1,
                    backgroundColor: colors.bg,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <Clock3 size={54} color={colors.textMuted} />

                <Text
                    style={{
                        marginTop: spacing.md,
                        fontFamily: fonts.display,
                        fontSize: 22,
                        color: colors.text,
                    }}
                >
                    No History Yet
                </Text>

                <Text
                    style={{
                        marginTop: spacing.sm,
                        color: colors.textMuted,
                        textAlign: "center",
                        paddingHorizontal: spacing.xl,
                    }}
                >
                    Campaigns you've completed will appear here.
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
            <FlatList
                data={history}
                keyExtractor={(item) => item.campaign.id.toString()}
                contentContainerStyle={{ padding: spacing.lg }}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => router.push({
                            pathname: "/modals/campaign-detail",
                            params: {
                                campaignId: item.campaign.id.toString(),
                            },
                        })}
                        style={{
                            backgroundColor: colors.surface,
                            borderRadius: radius.xl,
                            padding: spacing.lg,
                            marginBottom: spacing.md,
                            flexDirection: "row",
                            alignItems: "center",
                        }}
                    >
                        <View
                            style={{
                                width: 58,
                                height: 58,
                                borderRadius: radius.lg,
                                backgroundColor: colors.greenGlow,
                                justifyContent: "center",
                                alignItems: "center",
                                marginRight: spacing.md,
                            }}
                        >
                            <Text style={{ fontSize: 24 }}>🎵</Text>
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text
                                style={{
                                    fontFamily: fonts.displayMedium,
                                    color: colors.text,
                                    fontSize: 16,
                                }}
                            >
                                {item.campaign.trackName}
                            </Text>

                            <Text
                                style={{
                                    color: colors.textMuted,
                                    marginTop: 2,
                                }}
                            >
                                {item.campaign.artistName}
                            </Text>

                            <Text
                                style={{
                                    color: colors.green,
                                    marginTop: 8,
                                    fontSize: 12,
                                }}
                            >
                                Ended {new Date(item.campaign.endsAt).toLocaleDateString()}
                            </Text>
                        </View>

                        <ChevronRight size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                )}
            />
    </SafeAreaView >
  );
}