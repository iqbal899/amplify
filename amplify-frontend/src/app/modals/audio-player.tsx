import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Play, Pause } from 'lucide-react-native';
import { spacing, radius, fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useStyles } from '@/hooks/useStyles';
import { useCampaignStore } from '@/store/campaignStore';
import { useAudioStore } from '@/store/audioStore';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { useSpotifyPreview } from '@/hooks/useSpotifyPreview';
import { AudioWaveform } from '@/components/ui/AudioWaveform';
import type { Track } from '@/types';

export default function AudioPlayer() {
  const router = useRouter();
  const colors = useTheme();
  const styles = useStyles(getStyles);
  const { campaignId } = useLocalSearchParams<{ campaignId: string }>();
  const { getCampaignById, getEnrolledByCampaignId, enrollInCampaign } =
    useCampaignStore();
  const { currentTrack, isPlaying, progress, duration } = useAudioStore();
  const { playTrack, pauseTrack, resumeTrack } = useAudioPlayback();
  const { openInSpotify } = useSpotifyPreview();
  const [isEnrolling, setIsEnrolling] = useState(false);

  const campaign = useMemo(
    () => getCampaignById(campaignId || ''),
    [campaignId, getCampaignById]
  );

  const isEnrolled = useMemo(
    () => getEnrolledByCampaignId(campaignId || ''),
    [campaignId, getEnrolledByCampaignId]
  );

  useEffect(() => {
    if (!campaign) return;

    if (!currentTrack || currentTrack.id !== campaign.id) {
      const track: Track = {
        id: campaign.id,
        trackName: campaign.trackName,
        artistName: campaign.artistName,
        albumArt: campaign.albumArt,
        previewUrl: campaign.previewUrl,
        spotifyTrackId: campaign.spotifyTrackId,
      };
      playTrack(track);
    } else if (!isPlaying) {
      resumeTrack();
    }
  }, [campaign, currentTrack, isPlaying, playTrack, resumeTrack]);

  if (!campaign) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>Campaign not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const trackInitial = campaign.trackName.charAt(0).toUpperCase();
  const progressPercent = Math.max(0, Math.min(1, progress)) * 100;

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseTrack();
    } else if (currentTrack) {
      resumeTrack();
    } else {
      const track: Track = {
        id: campaign.id,
        trackName: campaign.trackName,
        artistName: campaign.artistName,
        albumArt: campaign.albumArt,
        previewUrl: campaign.previewUrl,
        spotifyTrackId: campaign.spotifyTrackId,
      };
      playTrack(track);
    }
  };

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      enrollInCampaign(campaignId || '');
      router.push({
        pathname: '/modals/campaign-detail',
        params: { id: campaignId },
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleSpotifyOpen = () => {
    openInSpotify(campaign.spotifyTrackId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Close Button */}
        <View style={styles.header}>
          <View />
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Album Art Background with Solid Color */}
        <View style={styles.albumArtBackground}>
          {/* Center Album Art Card */}
          <View style={styles.albumArtCard}>
            <View style={styles.albumArtGradient}>
              <Text style={styles.albumArtInitial}>{trackInitial}</Text>
            </View>
          </View>
        </View>

        {/* Track Info */}
        <View style={styles.trackInfoContainer}>
          <Text style={styles.trackName} numberOfLines={2}>
            {campaign.trackName}
          </Text>
          <Text style={styles.artistName} numberOfLines={1}>
            {campaign.artistName}
          </Text>
        </View>

        {/* Animated Waveform */}
        <View style={styles.waveformContainer}>
          <AudioWaveform isPlaying={isPlaying} barCount={8} />
        </View>

        {/* Play/Pause Button */}
        <TouchableOpacity
          onPress={handlePlayPause}
          style={styles.playButton}
          activeOpacity={0.8}
        >
          {isPlaying ? (
            <Pause size={28} color={colors.bg} fill={colors.bg} />
          ) : (
            <Play size={28} color={colors.bg} fill={colors.bg} />
          )}
        </TouchableOpacity>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: progressPercent as any },
              ]}
            />
          </View>
          <Text style={styles.previewLabel}>30s preview</Text>
        </View>

        {/* Action Buttons Container */}
        <View style={styles.buttonsContainer}>
          {/* Open in Spotify Button */}
          <TouchableOpacity
            onPress={handleSpotifyOpen}
            style={styles.spotifyButton}
            activeOpacity={0.7}
          >
            <Text style={styles.spotifyButtonText}>Open in Spotify</Text>
          </TouchableOpacity>

          {/* Enroll Button - Only if not enrolled */}
          {!isEnrolled && (
            <TouchableOpacity
              onPress={handleEnroll}
              disabled={isEnrolling}
              style={[styles.enrollButton, isEnrolling && styles.enrollButtonDisabled]}
              activeOpacity={0.8}
            >
              <Text style={styles.enrollButtonText}>
                {isEnrolling ? 'Enrolling...' : 'Enroll in Campaign'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  closeButton: {
    padding: spacing.sm,
  },
  albumArtBackground: {
    height: 320,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    overflow: 'hidden',
    backgroundColor: colors.blueGlow,
    borderWidth: 1,
    borderColor: colors.border,
  },
  albumArtCard: {
    width: 200,
    height: 200,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  albumArtGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.blue,
  },
  albumArtInitial: {
    fontSize: 64,
    fontFamily: fonts.display,
    color: colors.surface,
    fontWeight: '700',
  },
  trackInfoContainer: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  trackName: {
    fontSize: 20,
    fontFamily: fonts.display,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  artistName: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textSub,
    textAlign: 'center',
  },
  waveformContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    minHeight: 40,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.blue,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  progressContainer: {
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: 4,
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.blue,
  },
  previewLabel: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  buttonsContainer: {
    gap: spacing.md,
  },
  spotifyButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spotifyButtonText: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.blue,
    fontWeight: '500',
  },
  enrollButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enrollButtonDisabled: {
    opacity: 0.6,
  },
  enrollButtonText: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.bg,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
});
