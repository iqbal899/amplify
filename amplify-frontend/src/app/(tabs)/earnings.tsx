import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';

import { spacing, radius, fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useStyles } from '@/hooks/useStyles';

import { EarningsHero } from '@/components/ui/EarningsHero';
import { EarningsBarChart } from '@/components/charts/EarningsBarChart';

import { useEarningsStore } from '@/store/earningsStore';
import { getPayouts } from "@/services/payouts";
import type { Transaction } from '@/types';

type ChartViewType = "monthly" | "campaign";

interface CampaignReward {
  campaignId: number;
  campaignName: string;
  total: number;
  transactionCount: number;
}

export default function EarningsScreen() {
  const router = useRouter();

  const colors = useTheme();
  const styles = useStyles(getStyles);

  const earningsStore = useEarningsStore();

  const [chartView, setChartView] =
    useState<ChartViewType>("monthly");

  const pendingAmount = earningsStore.awaitingPayment;

  const paidAmount = earningsStore.paidRewards;

  const activeRewards = earningsStore.activeRewards;

  const setRewards =
    useEarningsStore(
      (state) => state.setRewards
    );

  useEffect(() => {
    async function loadRewards() {
      try {
        const transactions: Transaction[] =
          await getPayouts();

        const paidRewards =
          transactions
            .filter(
              (t) =>
                t.status === "paid"
            )
            .reduce(
              (sum, t) =>
                sum + t.amount,
              0
            );

        const awaitingPayment =
          transactions
            .filter(
              (t) =>
                t.status ===
                "pending"
            )
            .reduce(
              (sum, t) =>
                sum + t.amount,
              0
            );

        setRewards({
          totalRewards:
            paidRewards +
            awaitingPayment,

          paidRewards,

          awaitingPayment,

          // Backend does not yet expose "in-flight, not-yet-verified"
          // rewards separately, so this stays 0 until that exists.
          activeRewards: 0,

          transactions,

          // Backend does not yet return pre-aggregated monthly totals.
          // The monthly chart is hidden below until this is available.
          monthlyData: [],
        });
      } catch (error) {
        console.error(error);
      }
    }

    loadRewards();
  }, [setRewards]);

  const campaignRewards: CampaignReward[] =
    useMemo(() => {
      const grouped: Record<
        number,
        CampaignReward
      > = {};

      earningsStore.transactions.forEach(
        (transaction) => {
          if (!grouped[transaction.campaignId]) {
            grouped[transaction.campaignId] = {
              campaignId:
                transaction.campaignId,

              campaignName:
                transaction.trackName,

              total: 0,

              transactionCount: 0,
            };
          }

          grouped[
            transaction.campaignId
          ].total += transaction.amount;

          grouped[
            transaction.campaignId
          ].transactionCount += 1;
        }
      );

      return Object.values(grouped).sort(
        (a, b) => b.total - a.total
      );
    }, [earningsStore.transactions]);

  const payoutCards = [
    {
      label: "Rewards Paid",
      amount: paidAmount,
      color: colors.green,
    },

    {
      label: "Awaiting Payment",
      amount: pendingAmount,
      color: colors.gold,
    },

    {
      label: "Active Campaign Rewards",
      amount: activeRewards,
      color: colors.blue,
    },
  ];

  const getStatusColor = (
    status: string
  ) => {
    switch (status) {
      case "paid":
        return colors.green;

      case "pending":
        return colors.gold;

      case "failed":
        return colors.red;

      default:
        return colors.textMuted;
    }
  };

  const hasMonthlyData =
    earningsStore.monthlyData.length > 0;

  const handleTransactionPress = (
    transactionId: string
  ) => {
    router.push({
      pathname:
        "/modals/payout-detail" as const,

      params: {
        transactionId,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero */}
        <View style={styles.heroContainer}>
          <EarningsHero
            amount={earningsStore.totalRewards}
            label="Total Rewards"
            subLabel={`₹${pendingAmount.toLocaleString(
              "en-IN"
            )} Awaiting Payment • ₹${paidAmount.toLocaleString(
              "en-IN"
            )} Paid`}
          />
        </View>

        {/* Summary Cards */}
        <View style={styles.payoutCardsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={
              styles.payoutCardsScroll
            }
          >
            {payoutCards.map((card) => (
              <View
                key={card.label}
                style={[
                  styles.payoutCard,
                  {
                    borderColor: card.color,
                    shadowColor: card.color,
                  },
                ]}
              >
                <Text
                  style={styles.payoutCardLabel}
                >
                  {card.label}
                </Text>

                <Text
                  style={styles.payoutCardAmount}
                >
                  ₹
                  {card.amount.toLocaleString(
                    "en-IN"
                  )}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Reward Information */}
        <View style={styles.rewardInfoCard}>
          <View
            style={styles.rewardInfoHeader}
          >
            <View
              style={styles.rewardInfoDot}
            />

            <Text
              style={
                styles.rewardInfoTitle
              }
            >
              Reward Information
            </Text>
          </View>

          <Text
            style={styles.rewardInfoText}
          >
            After your submission has
            been verified by the
            Amplify team and the
            campaign has concluded, the
            reward will be processed
            manually.
            {"\n\n"}
            Once paid, it will appear
            below in your Reward
            History.
          </Text>
        </View>

        {/* Chart Toggle */}
        <View
          style={
            styles.chartToggleContainer
          }
        >
          <Pressable
            onPress={() =>
              setChartView("monthly")
            }
            style={[
              styles.chartTogglePill,
              chartView === "monthly" &&
                styles.chartToggleActive,
            ]}
          >
            <Text
              style={[
                styles.chartToggleText,
                chartView ===
                  "monthly" &&
                  styles.chartToggleTextActive,
              ]}
            >
              Rewards by Month
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              setChartView("campaign")
            }
            style={[
              styles.chartTogglePill,
              chartView ===
                "campaign" &&
                styles.chartToggleActive,
            ]}
          >
            <Text
              style={[
                styles.chartToggleText,
                chartView ===
                  "campaign" &&
                  styles.chartToggleTextActive,
              ]}
            >
              Rewards by Campaign
            </Text>
          </Pressable>
        </View>

        {/* Charts */}
        {chartView === "monthly" && (
          <View
            style={styles.chartContainer}
          >
            {hasMonthlyData ? (
              <EarningsBarChart
                data={
                  earningsStore.monthlyData
                }
              />
            ) : (
              <Text style={styles.emptyText}>
                Monthly breakdown isn't
                available yet
              </Text>
            )}
          </View>
        )}

        {chartView === "campaign" && (
          <View
            style={
              styles.campaignListContainer
            }
          >
            {campaignRewards.length >
            0 ? (
              campaignRewards.map(
                (campaign) => (
                  <View
                    key={
                      campaign.campaignId
                    }
                    style={
                      styles.campaignEarningRow
                    }
                  >
                    <View
                      style={
                        styles.campaignEarningInfo
                      }
                    >
                      <Text
                        style={
                          styles.campaignEarningName
                        }
                      >
                        {
                          campaign.campaignName
                        }
                      </Text>

                      <Text
                        style={
                          styles.campaignEarningCount
                        }
                      >
                        {
                          campaign.transactionCount
                        }{" "}
                        reward
                        {campaign.transactionCount >
                        1
                          ? "s"
                          : ""}
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.campaignEarningAmount
                      }
                    >
                      ₹
                      {campaign.total.toLocaleString(
                        "en-IN"
                      )}
                    </Text>
                  </View>
                )
              )
            ) : (
              <Text
                style={styles.emptyText}
              >
                No rewards yet
              </Text>
            )}
          </View>
        )}

        {/* Reward History */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Reward History
          </Text>

          <Text style={styles.sectionSubtitle}>
            Rewards you've already received
          </Text>
        </View>

        {earningsStore.transactions.length > 0 ? (
          <View style={styles.rewardListContainer}>
            {earningsStore.transactions.map((item) => (
              <Pressable
                key={item.id}
                onPress={() =>
                  handleTransactionPress(item.id)
                }
                style={styles.rewardCard}
              >
                <View style={styles.rewardTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={styles.rewardCampaign}
                    >
                      {item.trackName}
                    </Text>

                    <Text
                      style={styles.rewardArtist}
                    >
                      {item.artistName}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.rewardBadge,
                      {
                        backgroundColor:
                          getStatusColor(
                            item.status
                          ) + "20",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rewardBadgeText,
                        {
                          color:
                            getStatusColor(
                              item.status
                            ),
                        },
                      ]}
                    >
                      {item.status
                        .replace("_", " ")
                        .toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.rewardBottomRow}>
                  <View>
                    <Text
                      style={styles.rewardAmountLabel}
                    >
                      Reward Paid
                    </Text>

                    <Text
                      style={styles.rewardAmount}
                    >
                      ₹
                      {item.amount.toLocaleString(
                        "en-IN"
                      )}
                    </Text>
                  </View>

                  <View
                    style={{
                      alignItems: "flex-end",
                    }}
                  >
                    <Text
                      style={styles.rewardDateLabel}
                    >
                      Paid On
                    </Text>

                    <Text
                      style={styles.rewardDate}
                    >
                      {format(
                        new Date(item.date),
                        "dd MMM yyyy"
                      )}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>
              🎁
            </Text>

            <Text style={styles.emptyTitle}>
              No Rewards Yet
            </Text>

            <Text style={styles.emptyDescription}>
              Once your campaigns are
              completed and rewards are
              processed by the DoorBeen
              team, they'll appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  scrollContent: {
    paddingBottom: spacing.xxl,
  },

  heroContainer: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },

  payoutCardsContainer: {
    marginTop: spacing.lg,
  },

  payoutCardsScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },

  payoutCard: {
    width: 165,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 4,
  },

  payoutCardLabel: {
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
    fontSize: 13,
  },

  payoutCardAmount: {
    marginTop: spacing.sm,
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.text,
  },

  rewardInfoCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.greenGlow,
  },

  rewardInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  rewardInfoDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.green,
    marginRight: spacing.sm,
  },

  rewardInfoTitle: {
    fontFamily: fonts.displayMedium,
    fontSize: 18,
    color: colors.text,
  },

  rewardInfoText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 23,
  },

  chartToggleContainer: {
    flexDirection: "row",
    alignSelf: "center",
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    padding: 4,
  },

  chartTogglePill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },

  chartToggleActive: {
    backgroundColor: colors.green,
  },

  chartToggleText: {
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
  },

  chartToggleTextActive: {
    color: "#fff",
  },

  chartContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },

  campaignListContainer: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },

  campaignEarningRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },

  campaignEarningInfo: {
    flex: 1,
  },

  campaignEarningName: {
    fontFamily: fonts.bodyBold,
    color: colors.text,
    fontSize: 15,
  },

  campaignEarningCount: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    marginTop: 2,
  },

  campaignEarningAmount: {
    fontFamily: fonts.displayMedium,
    color: colors.green,
    fontSize: 17,
  },

  sectionHeaderRow: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },

  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.text,
  },

  sectionSubtitle: {
    marginTop: spacing.xs,
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 13,
  },

  rewardListContainer: {
    // wraps the mapped reward cards (replaces FlashList,
    // which shouldn't be nested inside a ScrollView for a
    // short, non-virtualized list like this one)
  },

  rewardCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },

  rewardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  rewardCampaign: {
    fontFamily: fonts.displayMedium,
    fontSize: 16,
    color: colors.text,
  },

  rewardArtist: {
    marginTop: 4,
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 13,
  },

  rewardBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },

  rewardBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
  },

  rewardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  rewardAmountLabel: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 12,
  },

  rewardAmount: {
    marginTop: 4,
    fontFamily: fonts.display,
    color: colors.green,
    fontSize: 26,
  },

  rewardDateLabel: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 12,
  },

  rewardDate: {
    marginTop: 4,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: spacing.xl,
  },

  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },

  emptyTitle: {
    fontFamily: fonts.display,
    color: colors.text,
    fontSize: 20,
  },

  emptyDescription: {
    marginTop: spacing.sm,
    textAlign: "center",
    fontFamily: fonts.body,
    color: colors.textMuted,
    lineHeight: 22,
  },

  emptyText: {
    textAlign: "center",
    color: colors.textMuted,
    marginVertical: spacing.lg,
    fontFamily: fonts.body,
  },
});