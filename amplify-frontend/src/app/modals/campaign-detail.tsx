/* eslint-disable react-hooks/preserve-manual-memoization */
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Play, Pause } from 'lucide-react-native';
import { spacing, radius, fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { getCampaignById } from "@/services/campaigns";

import { useAudioStore } from '@/store/audioStore';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { AudioWaveform } from '@/components/ui/AudioWaveform';
import { MilestoneTable } from '@/components/ui/MilestoneTable';
import { RulesCard } from '@/components/ui/RulesCard';
import { PlatformBadge } from '@/components/ui/PlatformBadge';
import type { Campaign, Track } from '@/types';
import { enrollCampaign } from '@/services/enrollments';

import { useCampaignStore } from "@/store/campaignStore";

export default function CampaignDetail() {
  const router = useRouter();
  const colors = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { currentTrack, isPlaying } = useAudioStore();
  const { playTrack, pauseTrack } = useAudioPlayback();
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [showEnrollmentSuccess, setShowEnrollmentSuccess] = useState(false);

  const loadCampaigns = useCampaignStore((s) => s.loadCampaigns);
  const loadEnrollments = useCampaignStore((s) => s.loadEnrollments);

  const [campaign, setCampaign] = useState<Campaign | null>(null);

  const getEnrolledByCampaignId = useCampaignStore(
    (s) => s.getEnrolledByCampaignId
  );

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function loadCampaign() {
      if (!id) return;

      try {
        const data = await getCampaignById(Number(id));
        setCampaign(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }


    loadCampaign();
  }, [id]);

  useEffect(() => {
    async function init() {
      await loadEnrollments();
    }

    init();
  }, []);

  // const [isEnrolled, setIsEnrolled] = useState(false);
  const enrolledCampaign =
    campaign
      ? getEnrolledByCampaignId(Number(campaign.id))
      : undefined;

  const isEnrolled = !!enrolledCampaign;

  const isCampaignFull = useMemo(
    () => campaign?.spotsFilled === campaign?.spotsTotal,
    [campaign?.spotsFilled, campaign?.spotsTotal]
  );

  const averageEarned = useMemo(() => {
    if (!campaign?.milestones || campaign.milestones.length === 0) return 0;
    const sum = campaign.milestones.reduce((acc, m) => acc + (m.incrementalPayout || 0), 0);
    return Math.round(sum / campaign.milestones.length);
  }, [campaign?.milestones]);

  const daysLeft = useMemo(() => {
    if (!campaign?.endsAt) return 0;
    const endDate = new Date(campaign.endsAt);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, [campaign?.endsAt]);

  const track: Track | null = useMemo(() => {
    if (!campaign) return null;
    return {
      id: campaign.id,
      trackName: campaign.trackName,
      artistName: campaign.artistName,
      albumArt: campaign.albumArt,
      previewUrl: campaign.previewUrl,
      spotifyTrackId: campaign.spotifyTrackId,
    };
  }, [campaign]);

  const isCurrentTrackPlaying = currentTrack?.id === campaign?.id && isPlaying;

  const handlePlayPause = () => {
    if (!track) return;

    if (isCurrentTrackPlaying) {
      pauseTrack();
    } else {
      playTrack(track);
    }
  };

  const handleEnroll = async () => {
    if (!campaign?.id) return;

    setEnrollmentLoading(true);

    try {
      await enrollCampaign(Number(campaign.id));

      // setIsEnrolled(true);
      setShowEnrollmentSuccess(true);

      await loadCampaigns();
      await loadEnrollments();

      // setTimeout(() => {
      //   router.back();
      // }, 1200);
    } catch (err: any) {
      Alert.alert(
        'Enrollment Failed',
        err.response?.data?.message ?? 'Something went wrong.'
      );
    } finally {
      setEnrollmentLoading(false);
    }
  };

  const handleSubmitReel = () => {
    router.push({
      pathname: '/modals/submit-reel',
      params: { campaignId: campaign?.id },
    });
  };
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text>Loading...</Text>
      </View>
    );
  }
  if (!campaign) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.textMuted }}>Campaign not found</Text>
      </View>
    );
  }

  const trackNameInitial = campaign.trackName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xl * 2 }}
      >
        {/* Close Button */}
        <View
          style={{
            paddingHorizontal: spacing.md,
            paddingTop: spacing.md,
            paddingBottom: spacing.lg,
            flexDirection: 'row',
            justifyContent: 'flex-start',
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View
          style={{
            paddingVertical: spacing.xl,
            paddingHorizontal: spacing.md,
            alignItems: 'center',
            backgroundColor: colors.bg,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          {/* Album Art Placeholder */}
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: radius.lg,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing.lg,
              backgroundColor: colors.blueGlow,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 48,
                fontWeight: '700',
                color: colors.blue,
              }}
            >
              {trackNameInitial}
            </Text>
          </View>

          {/* Play/Pause Button */}
          <TouchableOpacity
            onPress={handlePlayPause}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.blue,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing.lg,
            }}
          >
            {isCurrentTrackPlaying ? (
              <Pause size={24} color={colors.text} fill={colors.text} />
            ) : (
              <Play size={24} color={colors.text} fill={colors.text} />
            )}
          </TouchableOpacity>

          {/* Audio Waveform */}
          <View style={{ width: '100%', marginBottom: spacing.lg }}>
            <AudioWaveform isPlaying={isCurrentTrackPlaying} />
          </View>

          {/* Track Info */}
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 24,
              fontWeight: '700',
              color: colors.text,
              marginBottom: spacing.xs,
              textAlign: 'center',
            }}
          >
            {campaign.trackName}
          </Text>
          <Text
            style={{
              fontFamily: fonts.body,
              color: colors.textMuted,
              marginBottom: spacing.md,
              textAlign: 'center',
            }}
          >
            {campaign.artistName}
          </Text>

          {/* Genre Tag */}
          <View
            style={{
              backgroundColor: colors.surfaceElevated,
              paddingVertical: spacing.xs,
              paddingHorizontal: spacing.md,
              borderRadius: radius.full,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: 12,
                color: colors.textMuted,
              }}
            >
              {campaign.genre}
            </Text>
          </View>
        </View>

        {/* Campaign Stats Row */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.lg,
            gap: spacing.sm,
          }}
        >
          {/* Pool Stat */}
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              padding: spacing.md,
              borderWidth: 1,
              borderColor: colors.surfaceElevated,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: 11,
                color: colors.textMuted,
                marginBottom: spacing.xs,
              }}
            >
              Pool
            </Text>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 16,
                fontWeight: '700',
                color: colors.text,
              }}
            >
              ₹{campaign.pool.toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Creators Stat */}
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              padding: spacing.md,
              borderWidth: 1,
              borderColor: colors.surfaceElevated,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: 11,
                color: colors.textMuted,
                marginBottom: spacing.xs,
              }}
            >
              Creators
            </Text>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 16,
                fontWeight: '700',
                color: colors.text,
              }}
            >
              {campaign.spotsFilled}/{campaign.spotsTotal}
            </Text>
          </View>

          {/* Average Earned Stat */}
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              padding: spacing.md,
              borderWidth: 1,
              borderColor: colors.surfaceElevated,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: 11,
                color: colors.textMuted,
                marginBottom: spacing.xs,
              }}
            >
              Avg earned
            </Text>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 16,
                fontWeight: '700',
                color: colors.text,
              }}
            >
              ₹{averageEarned.toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Days Left Stat */}
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              padding: spacing.md,
              borderWidth: 1,
              borderColor: colors.surfaceElevated,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: 11,
                color: colors.textMuted,
                marginBottom: spacing.xs,
              }}
            >
              Days left
            </Text>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 16,
                fontWeight: '700',
                color: colors.text,
              }}
            >
              {daysLeft}
            </Text>
          </View>
        </View>

        {/* Milestone Payout Table */}
        <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.lg }}>
          <MilestoneTable milestones={campaign.milestones} />
        </View>

        {/* Rules Section */}
        <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.lg }}>
          <RulesCard />
        </View>

        {/* Platform Badges */}
        <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.lg }}>
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: 12,
              color: colors.textMuted,
              marginBottom: spacing.md,
            }}
          >
            Accepted on:
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <PlatformBadge platform="instagram" />
            <PlatformBadge platform="youtube" />
          </View>
        </View>
      </ScrollView>

      {/* Sticky CTA Button */}
      <View
        style={{
          backgroundColor: colors.bg,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.surfaceElevated,
        }}
      >
        {showEnrollmentSuccess && (
          <View
            style={{
              backgroundColor: colors.blue,
              paddingVertical: spacing.sm,
              borderRadius: radius.md,
              alignItems: 'center',
              marginBottom: spacing.md,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.body,
                color: colors.text,
                fontSize: 12,
              }}
            >
              Successfully enrolled!
            </Text>
          </View>
        )}

        {isCampaignFull ? (
          <TouchableOpacity
            disabled
            style={{
              borderWidth: 1.5,
              borderColor: colors.surfaceElevated,
              paddingVertical: spacing.md,
              borderRadius: radius.full,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 14,
                fontWeight: "700",
                color: colors.textMuted,
              }}
            >
              Join Waitlist
            </Text>
          </TouchableOpacity>
        ) : isEnrolled ? (
          <TouchableOpacity
            onPress={handleSubmitReel}
            style={{
              backgroundColor: colors.blue,
              paddingVertical: spacing.md,
              borderRadius: radius.full,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 14,
                fontWeight: "700",
                color: colors.text,
              }}
            >
              Submit My Reel →
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleEnroll}
            disabled={enrollmentLoading}
            style={{
              backgroundColor: colors.blue,
              paddingVertical: spacing.md,
              borderRadius: radius.full,
              alignItems: "center",
              opacity: enrollmentLoading ? 0.6 : 1,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 14,
                fontWeight: "700",
                color: colors.text,
              }}
            >
              {enrollmentLoading
                ? "Enrolling..."
                : "Enroll & Get Audio Link"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

