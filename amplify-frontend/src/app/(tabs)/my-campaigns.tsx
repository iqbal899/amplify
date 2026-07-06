import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Music } from 'lucide-react-native';
import { spacing, radius, fonts } from '@/constants/theme';
import { CampaignCardFull } from '@/components/ui/CampaignCardFull';
import { useCampaignStore } from '@/store/campaignStore';
import { useTheme } from '@/hooks/use-theme';

type FilterTab = 'active' | 'pending' | 'completed' | 'all';

export default function MyCampaignsScreen() {
  const router = useRouter();
  const colors = useTheme();
  const styles = getStyles(colors);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('active');

  const {
    enrolled,
    completed,
    getCampaignById,
  } = useCampaignStore();

  // Get current timestamp
  const now = new Date();

  // Filter campaigns based on active tab
  const filteredCampaigns = useMemo(() => {
    const allEnrolled = enrolled.map((enrolledItem) => ({
      type: 'enrolled' as const,
      campaign: getCampaignById(enrolledItem.campaignId),
      enrolled: enrolledItem,
    })).filter((item) => item.campaign !== undefined);

    const allCompleted = completed.map((completedItem) => ({
      type: 'completed' as const,
      completed: completedItem,
    }));

    switch (activeFilter) {
      case 'active':
        return allEnrolled.filter((item) => {
          const campaign = item.campaign!;
          const endDate = new Date(campaign.endsAt);
          return (
            item.enrolled.verificationStatus === 'verified' &&
            endDate > now
          );
        });

      case 'pending':
        return allEnrolled.filter(
          (item) => item.enrolled.verificationStatus === 'pending'
        );

      case 'completed':
        return allCompleted;

      case 'all':
        return [...allEnrolled, ...allCompleted];

      default:
        return [];
    }
  }, [activeFilter, enrolled, completed, getCampaignById, now]);

  const handleCampaignPress = (campaignId: string) => {
    router.push(`/modals/campaign-detail?id=${campaignId}`);
  };

  const handleDiscoverPress = () => {
    router.push('/(tabs)/discover');
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Music
        size={64}
        color={colors.textMuted}
        style={styles.emptyIcon}
      />
      <Text style={[{ fontFamily: fonts.display, fontSize: 18, fontWeight: '700' }, styles.emptyTitle]}>
        No active campaigns yet
      </Text>
      <Text
        style={[{ fontFamily: fonts.body, fontSize: 14 }, styles.emptyDescription]}
      >
        Browse audio tracks and start earning
      </Text>
      <TouchableOpacity
        style={styles.ctaButton}
        onPress={handleDiscoverPress}
      >
        <Text style={[{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text }, styles.ctaButtonText]}>
          Discover Campaigns
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCampaignItem = ({ item }: { item: typeof filteredCampaigns[0] }) => {
    if (item.type === 'enrolled' && item.campaign) {
      return (
        <Pressable
          onPress={() => handleCampaignPress(item.campaign!.id)}
          style={styles.cardWrapper}
        >
          <CampaignCardFull
            campaign={item.campaign}
            enrolled={item.enrolled}
            onPress={() => handleCampaignPress(item.campaign!.id)}
          />
        </Pressable>
      );
    }

    if (item.type === 'completed' && item.completed) {
      return (
        <View style={styles.completedCardWrapper}>
          <View style={styles.completedCard}>
            <View style={styles.completedCardContent}>
              <Text style={[{ fontFamily: fonts.display, fontSize: 16, fontWeight: '700' }, styles.completedTrackName]}>
                {item.completed.trackName}
              </Text>
              <Text style={[{ fontFamily: fonts.body, fontSize: 12 }, styles.completedArtistName]}>
                {item.completed.artistName}
              </Text>
              <View style={styles.completedStatsRow}>
                <View style={styles.completedStat}>
                  <Text style={[{ fontFamily: fonts.body, fontSize: 12 }, styles.completedStatLabel]}>
                    Total Earned
                  </Text>
                  <Text style={[{ fontFamily: fonts.display, fontSize: 16, fontWeight: '700' }, styles.completedStatValue]}>
                    ₹{item.completed.totalEarned.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.completedDivider} />
                <View style={styles.completedStat}>
                  <Text style={[{ fontFamily: fonts.body, fontSize: 12 }, styles.completedStatLabel]}>
                    Completed
                  </Text>
                  <Text style={[{ fontFamily: fonts.body, fontSize: 12 }, styles.completedStatValue]}>
                    {new Date(item.completed.completedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      );
    }

    return null;
  };

  const filterOptions: { label: string; value: FilterTab }[] = [
    { label: 'Active', value: 'active' },
    { label: 'Pending Verification', value: 'pending' },
    { label: 'Completed', value: 'completed' },
    { label: 'All', value: 'all' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={[{ fontFamily: fonts.display, fontSize: 24, fontWeight: '700' }, styles.title]}>My Campaigns</Text>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
          scrollEventThrottle={16}
        >
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => setActiveFilter(option.value)}
              style={[
                styles.filterPill,
                activeFilter === option.value
                  ? styles.filterPillActive
                  : styles.filterPillInactive,
              ]}
            >
              <Text
                style={[
                  { fontFamily: fonts.bodyBold, fontSize: 12 },
                  activeFilter === option.value
                    ? styles.filterPillTextActive
                    : styles.filterPillTextInactive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Campaign List */}
      {filteredCampaigns.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderEmptyState()}
        </ScrollView>
      ) : (
        <FlashList
          data={filteredCampaigns}
          renderItem={renderCampaignItem}
          keyExtractor={(item, index) => {
            if (item.type === 'enrolled') {
              return `enrolled-${item.enrolled.campaignId}`;
            }
            return `completed-${item.completed.campaignId}`;
          }}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => ({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  } as ViewStyle,

  headerContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
  } as ViewStyle,

  title: {
    color: colors.text,
    marginBottom: 0,
  } as TextStyle,

  filterContainer: {
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
    paddingVertical: spacing.md,
  } as ViewStyle,

  filterScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  } as ViewStyle,

  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,

  filterPillActive: {
    backgroundColor: colors.blue,
  } as ViewStyle,

  filterPillInactive: {
    backgroundColor: colors.surfaceElevated,
  } as ViewStyle,

  filterPillTextActive: {
    color: colors.text,
  } as TextStyle,

  filterPillTextInactive: {
    color: colors.textMuted,
  } as TextStyle,

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  } as ViewStyle,

  cardWrapper: {
    width: '100%',
    marginVertical: 0,
  } as ViewStyle,

  completedCardWrapper: {
    width: '100%',
    marginVertical: 0,
  } as ViewStyle,

  completedCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  } as ViewStyle,

  completedCardContent: {
    gap: spacing.md,
  } as ViewStyle,

  completedTrackName: {
    color: colors.text,
  } as TextStyle,

  completedArtistName: {
    color: colors.textMuted,
  } as TextStyle,

  completedStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  } as ViewStyle,

  completedStat: {
    flex: 1,
    gap: spacing.xs,
  } as ViewStyle,

  completedStatLabel: {
    color: colors.textMuted,
  } as TextStyle,

  completedStatValue: {
    color: colors.text,
  } as TextStyle,

  completedDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.text,
    opacity: 0.1,
    marginHorizontal: spacing.md,
  } as ViewStyle,

  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  } as ViewStyle,

  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  } as ViewStyle,

  emptyIcon: {
    marginBottom: spacing.md,
  } as ViewStyle,

  emptyTitle: {
    color: colors.textMuted,
    textAlign: 'center',
  } as TextStyle,

  emptyDescription: {
    color: colors.textMuted,
    textAlign: 'center',
  } as TextStyle,

  ctaButton: {
    backgroundColor: colors.blue,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  } as ViewStyle,

  ctaButtonText: {
    textAlign: 'center',
  } as TextStyle,
});
