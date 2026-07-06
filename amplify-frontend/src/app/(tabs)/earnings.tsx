import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';

import { spacing, radius, fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useStyles } from '@/hooks/useStyles';
import { EarningsHero } from '@/components/ui/EarningsHero';
import { EarningsBarChart } from '@/components/charts/EarningsBarChart';
import { useEarningsStore } from '@/store/earningsStore';
import { useAuthStore } from '@/store/authStore';
import type { Transaction } from '@/types';

const { width: screenWidth } = Dimensions.get('window');

type ChartViewType = 'monthly' | 'campaign';

interface CampaignEarning {
  campaignId: string;
  campaignName: string;
  total: number;
  transactionCount: number;
}

export default function EarningsScreen() {
  const router = useRouter();
  const colors = useTheme();
  const styles = useStyles(getStyles);
  const earningsStore = useEarningsStore();
  const authStore = useAuthStore();

  const [chartView, setChartView] = useState<ChartViewType>('monthly');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showWithdrawalSuccess, setShowWithdrawalSuccess] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pendingAmount = earningsStore.pendingAmount;
  const paidOut = earningsStore.paidOut;
  const availableToWithdraw = 650;
  const inVerification = 400;
  const thisMonth = 1100;

  const canWithdraw = availableToWithdraw > 100;

  const campaignEarnings: CampaignEarning[] = useMemo(() => {
    const grouped: Record<string, CampaignEarning> = {};
    earningsStore.transactions.forEach((t) => {
      if (!grouped[t.campaignId]) {
        grouped[t.campaignId] = {
          campaignId: t.campaignId,
          campaignName: t.trackName,
          total: 0,
          transactionCount: 0,
        };
      }
      grouped[t.campaignId].total += t.amount;
      grouped[t.campaignId].transactionCount += 1;
    });
    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [earningsStore.transactions]);

  const handleWithdrawPress = () => setIsWithdrawing(true);

  const handleCancelWithdraw = () => {
    setIsWithdrawing(false);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    setHoldProgress(0);
  };

  const handleHoldStart = () => {
    setHoldProgress(0);
    let progress = 0;
    holdIntervalRef.current = setInterval(() => {
      progress += 2;
      setHoldProgress(progress);
      if (progress >= 100) {
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
        setIsWithdrawing(false);
        setHoldProgress(0);
        earningsStore.requestWithdrawal();
        setShowWithdrawalSuccess(true);
        setTimeout(() => setShowWithdrawalSuccess(false), 2000);
      }
    }, 40);
  };

  const handleHoldEnd = () => {
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    setHoldProgress(0);
  };

  const handleTransactionPress = (transactionId: string) => {
    router.push({
      pathname: '/modals/payout-detail' as const,
      params: { transactionId },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return colors.green;
      case 'pending': return colors.amber;
      case 'rejected': return colors.red;
      default: return colors.textMuted;
    }
  };

  const payoutCards = [
    { label: 'Available to withdraw', amount: availableToWithdraw, color: colors.green },
    { label: 'In verification', amount: inVerification, color: colors.amber },
    { label: 'This month', amount: thisMonth, color: colors.blue },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Earnings Hero */}
        <View style={styles.heroContainer}>
          <EarningsHero
            amount={earningsStore.totalEarned}
            label="Your total lifetime earnings"
            subLabel={`₹${pendingAmount.toLocaleString('en-IN')} pending · ₹${paidOut.toLocaleString('en-IN')} paid out`}
          />
        </View>

        {/* Payout Status Cards */}
        <View style={styles.payoutCardsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.payoutCardsScroll}
          >
            {payoutCards.map((card) => (
              <View
                key={card.label}
                style={[styles.payoutCard, { borderColor: card.color, shadowColor: card.color }]}
              >
                <Text style={styles.payoutCardLabel}>{card.label}</Text>
                <Text style={styles.payoutCardAmount}>
                  ₹{card.amount.toLocaleString('en-IN')}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Withdraw Button or Confirmation */}
        <View style={styles.withdrawContainer}>
          {!isWithdrawing ? (
            <Pressable
              onPress={handleWithdrawPress}
              disabled={!canWithdraw}
              style={[styles.withdrawButton, { backgroundColor: canWithdraw ? colors.blue : colors.surfaceElevated }]}
            >
              <Text style={[styles.withdrawButtonText, { color: canWithdraw ? colors.text : colors.textMuted }]}>
                Withdraw
              </Text>
            </Pressable>
          ) : (
            <View style={styles.withdrawalCard}>
              <Text style={styles.withdrawalLabel}>Withdraw to</Text>
              <Text style={styles.upiIdText}>
                {authStore.user?.upiId || 'UPI ID not set'}
              </Text>
              <Text style={styles.withdrawalAmount}>
                Amount: ₹{availableToWithdraw.toLocaleString('en-IN')}
              </Text>

              <Pressable
                onPressIn={handleHoldStart}
                onPressOut={handleHoldEnd}
                style={styles.holdButton}
              >
                <View style={styles.holdProgressRing}>
                  <View style={[styles.holdProgressFill, { width: `${holdProgress}%` }]} />
                </View>
                <Text style={styles.holdButtonText}>Hold to confirm</Text>
              </Pressable>

              <Pressable onPress={handleCancelWithdraw} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </View>
          )}

          {showWithdrawalSuccess && (
            <View style={styles.successCard}>
              <Text style={styles.successText}>Withdrawal requested!</Text>
            </View>
          )}
        </View>

        {/* Earnings Chart Toggle */}
        <View style={styles.chartToggleContainer}>
          <Pressable
            onPress={() => setChartView('monthly')}
            style={[styles.chartTogglePill, chartView === 'monthly' && styles.chartToggleActive]}
          >
            <Text style={[styles.chartToggleText, chartView === 'monthly' && styles.chartToggleTextActive]}>
              Monthly
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setChartView('campaign')}
            style={[styles.chartTogglePill, chartView === 'campaign' && styles.chartToggleActive]}
          >
            <Text style={[styles.chartToggleText, chartView === 'campaign' && styles.chartToggleTextActive]}>
              By Campaign
            </Text>
          </Pressable>
        </View>

        {/* Chart View */}
        {chartView === 'monthly' && (
          <View style={styles.chartContainer}>
            <EarningsBarChart data={earningsStore.monthlyData} />
          </View>
        )}

        {chartView === 'campaign' && (
          <View style={styles.campaignListContainer}>
            {campaignEarnings.length > 0 ? (
              campaignEarnings.map((c) => (
                <View key={c.campaignId} style={styles.campaignEarningRow}>
                  <View style={styles.campaignEarningInfo}>
                    <Text style={styles.campaignEarningName}>{c.campaignName}</Text>
                    <Text style={styles.campaignEarningCount}>
                      {c.transactionCount} transaction{c.transactionCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text style={styles.campaignEarningAmount}>
                    ₹{c.total.toLocaleString('en-IN')}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No campaign earnings yet</Text>
            )}
          </View>
        )}

        {/* Transaction History */}
        <Text style={styles.sectionHeader}>Transaction History</Text>

        <View style={styles.transactionListContainer}>
          {earningsStore.transactions.length > 0 ? (
            <FlashList
              data={earningsStore.transactions}
              renderItem={({ item }) => {
                const txn = item as Transaction;
                return (
                  <Pressable
                    onPress={() => handleTransactionPress(txn.id)}
                    style={styles.transactionRow}
                  >
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(txn.status) }]} />
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionName}>
                        {txn.trackName}
                        {txn.milestone > 0 && (
                          <Text style={styles.transactionMilestone}> · {txn.milestone.toLocaleString('en-IN')} views</Text>
                        )}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {format(new Date(txn.date), 'MMM d, yyyy')}
                      </Text>
                    </View>
                    <Text style={[styles.transactionAmount, { color: txn.status === 'paid' ? colors.green : colors.textMuted }]}>
                      +₹{txn.amount.toLocaleString('en-IN')}
                    </Text>
                  </Pressable>
                );
              }}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyText}>No transactions yet</Text>
          )}
        </View>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  payoutCardsContainer: {
    marginBottom: spacing.lg,
  },
  payoutCardsScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  payoutCard: {
    width: 140,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  payoutCardLabel: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.textSub,
    marginBottom: spacing.xs,
  },
  payoutCardAmount: {
    fontSize: 20,
    fontFamily: fonts.display,
    color: colors.text,
  },
  withdrawContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  withdrawButton: {
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  withdrawButtonText: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
  },
  withdrawalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  withdrawalLabel: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  upiIdText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.blue,
    marginBottom: spacing.md,
  },
  withdrawalAmount: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.text,
    marginBottom: spacing.md,
  },
  holdButton: {
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.blue,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  holdProgressRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: colors.blueDim,
    width: '100%',
  },
  holdProgressFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  holdButtonText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.blue,
  },
  successCard: {
    backgroundColor: colors.green,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  successText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.bg,
    textAlign: 'center',
  },
  chartToggleContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chartTogglePill: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartToggleActive: {
    backgroundColor: colors.blue,
  },
  chartToggleText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textSub,
  },
  chartToggleTextActive: {
    color: colors.text,
  },
  chartContainer: {
    marginBottom: spacing.lg,
  },
  campaignListContainer: {
    marginBottom: spacing.lg,
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  campaignEarningRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  campaignEarningInfo: {
    flex: 1,
  },
  campaignEarningName: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.text,
    marginBottom: 2,
  },
  campaignEarningCount: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  campaignEarningAmount: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.green,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textMuted,
    textAlign: 'center',
    padding: spacing.lg,
  },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    fontSize: 18,
    fontFamily: fonts.display,
    color: colors.text,
  },
  transactionListContainer: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.text,
    marginBottom: 2,
  },
  transactionMilestone: {
    color: colors.textMuted,
  },
  transactionDate: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  transactionAmount: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
});
