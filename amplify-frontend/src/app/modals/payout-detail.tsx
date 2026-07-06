import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Copy } from 'lucide-react-native';
import { format } from 'date-fns';
import { colors, spacing, radius, fonts } from '@/constants/theme';
import { useEarningsStore } from '@/store/earningsStore';
import { useCampaignStore } from '@/store/campaignStore';

export default function PayoutDetailModal() {
  const router = useRouter();
  const { transactionId } = useLocalSearchParams();
  const [copied, setCopied] = useState(false);

  const transactions = useEarningsStore((state) => state.transactions);
  const campaigns = useCampaignStore((state) => state.campaigns);

  const transaction = transactions.find((t) => t.id === transactionId);
  const campaign = transaction ? useCampaignStore((state) => state.getCampaignById(transaction.campaignId)) : null;

  if (!transaction) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.textMuted }}>Transaction not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return colors.green;
      case 'pending':
        return colors.amber;
      case 'rejected':
        return colors.red;
      default:
        return colors.textSub;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleCopyUPI = () => {
    if (transaction.upiRef) {
      Clipboard.setString(transaction.upiRef);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRaiseIssue = () => {
    Alert.alert(
      'Support',
      'Support ticket feature coming soon',
      [{ text: 'OK', onPress: () => {} }]
    );
  };

  // Using transaction date as submitted date since enrolledCampaign isn't available
  const submittedDate = new Date(transaction.date);

  const verifiedDate = new Date(submittedDate);
  verifiedDate.setDate(verifiedDate.getDate() + 1);

  const milestoneDate = new Date(transaction.date);
  const paidDate =
    transaction.status === 'paid' ? new Date(transaction.date) : null;

  const timelineSteps = [
    {
      label: 'Submitted',
      date: submittedDate,
      color: colors.blue,
      dotFilled: true,
    },
    {
      label: 'Verified',
      date: verifiedDate,
      color: colors.green,
      dotFilled: true,
    },
    {
      label: 'Milestone hit',
      date: milestoneDate,
      color: colors.gold,
      dotFilled: true,
    },
    {
      label: getStatusLabel(transaction.status),
      date:
        transaction.status === 'paid'
          ? paidDate
          : transaction.status === 'pending'
            ? new Date()
            : new Date(transaction.date),
      color: getStatusColor(transaction.status),
      dotFilled: transaction.status === 'paid',
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing.lg }}
      >
        {/* Header with close button */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            paddingTop: spacing.md,
            paddingBottom: spacing.lg,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: colors.text,
              flex: 1,
            }}
          >
            Payout Details
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Transaction Header */}
        <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.lg }}>
          <Text
            style={{
              fontSize: 12,
              color: colors.textMuted,
              marginBottom: spacing.sm,
            }}
          >
            {transaction.trackName}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              marginBottom: spacing.md,
              gap: spacing.sm,
            }}
          >
            <Text
              style={{
                fontSize: 32,
                fontWeight: '700',
                color: colors.text,
                fontFamily: fonts.display,
              }}
            >
              ₹{transaction.amount.toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Status Badge */}
          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: getStatusColor(transaction.status),
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: radius.sm,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: '600',
                color: colors.text,
              }}
            >
              {getStatusLabel(transaction.status)}
            </Text>
          </View>
        </View>

        {/* Milestone Breakdown */}
        <View
          style={{
            marginHorizontal: spacing.md,
            marginBottom: spacing.lg,
            backgroundColor: colors.surface,
            padding: spacing.md,
            borderRadius: radius.md,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: colors.textMuted,
              marginBottom: spacing.sm,
            }}
          >
            Milestone: {transaction.milestone.toLocaleString('en-IN')} views
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.text,
              fontWeight: '600',
            }}
          >
            Incremental payout: ₹{transaction.amount.toLocaleString('en-IN')}
          </Text>
        </View>

        {/* Timeline View */}
        <View style={{ marginHorizontal: spacing.md, marginBottom: spacing.lg }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: colors.text,
              marginBottom: spacing.md,
            }}
          >
            Payment Timeline
          </Text>

          {timelineSteps.map((step, index) => (
            <View key={index} style={{ marginBottom: spacing.md }}>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                {/* Timeline column */}
                <View style={{ alignItems: 'center' }}>
                  {/* Dot */}
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: step.color,
                      opacity: step.dotFilled ? 1 : 0.5,
                      marginBottom: spacing.sm,
                    }}
                  />

                  {/* Connecting line */}
                  {index < timelineSteps.length - 1 && (
                    <View
                      style={{
                        width: 1,
                        height: 60,
                        backgroundColor: colors.border,
                      }}
                    />
                  )}
                </View>

                {/* Text column */}
                <View style={{ flex: 1, paddingBottom: spacing.md }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: colors.text,
                      marginBottom: spacing.xs,
                    }}
                  >
                    {step.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      color: colors.textMuted,
                    }}
                  >
                    {step.date ? format(new Date(step.date), 'MMM d, yyyy') : ''}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* UPI Transaction Reference */}
        {transaction.upiRef && (
          <View
            style={{
              marginHorizontal: spacing.md,
              marginBottom: spacing.lg,
              backgroundColor: colors.surface,
              padding: spacing.md,
              borderRadius: radius.md,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 10,
                  color: colors.textMuted,
                  marginBottom: spacing.xs,
                }}
              >
                UPI Reference
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.text,
                  fontWeight: '600',
                  fontFamily: fonts.body,
                }}
              >
                {transaction.upiRef}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleCopyUPI}
              style={{ padding: spacing.sm }}
            >
              <Copy size={20} color={copied ? colors.green : colors.textSub} />
            </TouchableOpacity>
          </View>
        )}

        {/* Raise an Issue Link */}
        <View style={{ marginHorizontal: spacing.md }}>
          <TouchableOpacity onPress={handleRaiseIssue}>
            <Text
              style={{
                fontSize: 12,
                color: colors.red,
                fontWeight: '600',
                textDecorationLine: 'underline',
              }}
            >
              Raise an issue
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
