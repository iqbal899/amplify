/* eslint-disable react-hooks/purity */
import React, { useMemo, useState } from 'react';
import { useEffect } from "react";

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Bell, Play, Pause, Sun, Moon } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { fonts, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { useCampaignStore } from '@/store/campaignStore';
import { useAudioStore } from '@/store/audioStore';
import { useThemeStore } from '@/store/themeStore';
import { useTheme } from '@/hooks/use-theme';
import { useStyles } from '@/hooks/useStyles';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { CampaignCard } from '@/components/ui/CampaignCard';
import type { Campaign } from '@/types';

const FILTER_OPTIONS = [
  'All',
  'New',
  'Trending',
  'Ending Soon',
  'Hindi',
  'Assamese',
  'Instrumental',
  'Pop',
  'Hip-Hop',
  'Naga Folk',
  'Mizo',
];

export default function DiscoverScreen() {
  const router = useRouter();
  const { creator } = useAuthStore();
  const { themeMode, setThemeMode } = useThemeStore();
  const colors = useTheme();
  const styles = useStyles(getStyles);
  const { campaigns, enrolled, loadCampaigns } = useCampaignStore();
  const { currentTrack, isPlaying } = useAudioStore();
  const { playTrack, pauseTrack, resumeTrack } = useAudioPlayback();
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    loadCampaigns();
  }, []);

  const userName = creator?.name || 'Creator';

  const featuredCampaign = useMemo(() => {
    if (!campaigns.length) return undefined;

    return campaigns[0];
  }, [campaigns]);

  const isEnrolledIn = (campaignId: number) => {
    return enrolled.some((e) => e.campaignId === campaignId);
  };

  const filteredCampaigns = useMemo(() => {
    if (activeFilter === 'All') return campaigns;

    return campaigns.filter((campaign) => {
      if (activeFilter === 'New') return campaign.isNew;
      if (activeFilter === 'Trending') return campaign.isTrending;
      if (activeFilter === 'Ending Soon') {
        const end = new Date(campaign.endsAt).getTime();
        const now = Date.now();
        const hours = (end - now) / (1000 * 60 * 60);
        return hours <= 48 && hours > 0;
      }
      if (activeFilter === 'Hindi') return campaign.language === 'Hindi';
      if (activeFilter === 'Assamese') return campaign.language === 'Assamese';
      return campaign.genre.toLowerCase().includes(activeFilter.toLowerCase());
    });
  }, [campaigns, activeFilter]);

  const handlePlayFeatured = () => {
    if (!featuredCampaign) return;
    if (currentTrack?.id === featuredCampaign.id) {
      if (isPlaying) pauseTrack();
      else resumeTrack();
    } else {
      playTrack({
        id: featuredCampaign.id,
        trackName: featuredCampaign.trackName,
        artistName: featuredCampaign.artistName,
        albumArt: featuredCampaign.albumArt,
        previewUrl: featuredCampaign.previewUrl,
        spotifyTrackId: featuredCampaign.spotifyTrackId,
      });
    }
  };

  const handleViewCampaign = () => {
  if (!featuredCampaign) return;

  router.push({
    pathname: "/modals/campaign-detail",
    params: {
      id: featuredCampaign.id.toString(),
    },
  });
};

  const handleCampaignPress = (campaignId: number | string) => {
  router.push({
    pathname: "/modals/campaign-detail",
    params: {
      id: campaignId.toString(),
    },
  });
};

  const handleEnrolledPress = () => {
    router.navigate('/(tabs)/my-campaigns');
  };

  const toggleTheme = () => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };

  const filledPercentage = featuredCampaign
    ? (featuredCampaign.spotsFilled / featuredCampaign.spotsTotal) * 100
    : 0;

  const isFeaturedPlaying =
    featuredCampaign && currentTrack?.id === featuredCampaign.id && isPlaying;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logoText}>Amplify</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
              {themeMode === 'light' ? (
                <Moon size={22} color={colors.text} />
              ) : (
                <Sun size={22} color={colors.text} />
              )}
            </TouchableOpacity>
            <TouchableOpacity>
              <Bell size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting */}
        <Text style={styles.greeting}>
          What are you creating today, {userName}?
        </Text>

        {/* Featured Campaign Banner */}
        {featuredCampaign && (
          <View style={styles.featuredCard}>
            <View style={styles.featuredGradient}>
              {/* Badge and Pool */}
              <View style={styles.featuredTop}>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: featuredCampaign.isTrending ? colors.blue : colors.gold },
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {featuredCampaign.isTrending ? 'Trending' : 'New'}
                  </Text>
                </View>
                <Text style={styles.poolText}>
                  ₹{featuredCampaign.pool.toLocaleString('en-IN')} pool
                </Text>
              </View>

              {/* Campaign Info */}
              <View style={styles.featuredInfo}>
                <View style={styles.featuredTextContainer}>
                  <Text style={styles.featuredArtist}>{featuredCampaign.artistName}</Text>
                  <Text style={styles.featuredTrack} numberOfLines={2}>
                    {featuredCampaign.trackName}
                  </Text>

                  {/* Progress Bar */}
                  <View style={styles.progressBarBg}>
                    <View
                      style={[styles.progressBarFill, { width: `${filledPercentage}%` }]}
                    />
                  </View>

                  <Text style={styles.spotsText}>
                    {featuredCampaign.spotsFilled} / {featuredCampaign.spotsTotal} spots filled
                  </Text>
                </View>

                {/* Play Button */}
                <TouchableOpacity onPress={handlePlayFeatured} style={styles.playButton}>
                  {isFeaturedPlaying ? (
                    <Pause size={20} color={colors.surface} fill={colors.surface} />
                  ) : (
                    <Play size={20} color={colors.surface} fill={colors.surface} />
                  )}
                </TouchableOpacity>
              </View>

              {/* View Campaign CTA */}
              <TouchableOpacity onPress={handleViewCampaign}>
                <Text style={styles.viewCampaignText}>View Campaign →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Filters Row */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filtersRow}>
              {FILTER_OPTIONS.map((filter) => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={[
                    styles.filterChip,
                    activeFilter === filter && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      activeFilter === filter && styles.filterTextActive,
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Active Campaign Banner */}
        {enrolled.length > 0 && (
          <TouchableOpacity onPress={handleEnrolledPress} style={styles.enrolledBanner}>
            <Text style={styles.enrolledBannerText}>
              You&apos;re enrolled in {enrolled.length} campaign{enrolled.length !== 1 ? 's' : ''} →
            </Text>
          </TouchableOpacity>
        )}

        {/* Campaign Cards List */}
        <View style={styles.listContainer}>
          <FlashList
            data={filteredCampaigns}
            renderItem={({ item }: { item: Campaign }) => (
              <CampaignCard
                campaign={item}
                isEnrolled={isEnrolledIn(item.id)}
                onPress={() => handleCampaignPress(item.id)}
              />
            )}
            scrollEnabled={false}
          />
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
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 28,
    fontFamily: fonts.display,
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  themeToggle: {
    padding: spacing.xs,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.surface,
  },
  greeting: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textSub,
  },
  featuredCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  featuredGradient: {
    height: 200,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    justifyContent: 'space-between',
    backgroundColor: colors.blueGlow,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
  },
  featuredTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  poolText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.gold,
  },
  featuredInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  featuredTextContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  featuredArtist: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textSub,
    marginBottom: spacing.xs,
  },
  featuredTrack: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  progressBarBg: {
    height: 2,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.blue,
  },
  spotsText: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.textSub,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewCampaignText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.blue,
    marginTop: spacing.sm,
  },
  filtersContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  filterChip: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },
  filterText: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textSub,
  },
  filterTextActive: {
    color: colors.surface,
    fontWeight: '600',
  },
  enrolledBanner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.blueGlow,
    borderWidth: 1,
    borderColor: colors.borderActive,
  },
  enrolledBannerText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.blue,
  },
  listContainer: {
    paddingHorizontal: spacing.md,
  },
});
