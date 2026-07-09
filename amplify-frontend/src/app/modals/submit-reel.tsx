import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  ActivityIndicator,
  Clipboard,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, fonts } from '@/constants/theme';
import { useCampaignStore } from '@/store/campaignStore';
import { submitReel as submitReelApi } from "@/services/submissions";
import { useAuthStore } from '@/store/authStore';
import { PlatformBadge } from '@/components/ui/PlatformBadge';
import { Ionicons } from '@expo/vector-icons';

type Platform = 'instagram' | 'youtube' | null;

const SubmitReelModal: React.FC = () => {
  const router = useRouter();
  const { campaignId } = useLocalSearchParams<{ campaignId: string }>();
  const getCampaignById = useCampaignStore((state) => state.getCampaignById);
  //const submitReel = useCampaignStore((state) => state.submitReel);
  const getEnrolledByCampaignId = useCampaignStore(
    (state) => state.getEnrolledByCampaignId
  );

  const enrollment =
    campaignId
      ? getEnrolledByCampaignId(Number(campaignId))
      : undefined;

  const creator = useAuthStore((state) => state.creator);

  const instagramUsername = creator?.instagramUsername;

  const campaign = campaignId ? getCampaignById(Number(campaignId)) : null;

  const [url, setUrl] = useState('');
  const [isInstructionsExpanded, setIsInstructionsExpanded] = useState(false);
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [platform, setPlatform] = useState<Platform>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const instructionsHeight = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef<any>(null);


  // URL validation logic
  const validateUrl = (text: string): { isValid: boolean; platform: Platform; error: string | null } => {
    if (!text.trim()) {
      return { isValid: false, platform: null, error: null };
    }

    const instagramPattern = /instagram\.com\/reel\//i;
    const youtubePattern = /youtube\.com\/shorts\//i;

    if (instagramPattern.test(text)) {
      return { isValid: true, platform: 'instagram', error: null };
    }

    if (youtubePattern.test(text)) {
      return { isValid: true, platform: 'youtube', error: null };
    }

    return { isValid: false, platform: null, error: 'Please enter a valid Instagram Reel or YouTube Short URL' };
  };

  const handleUrlChange = (text: string) => {
    setUrl(text);
    const { isValid, platform: detectedPlatform, error } = validateUrl(text);
    setPlatform(isValid ? detectedPlatform : null);
    setValidationError(error);
  };

  const handlePaste = async () => {
    try {
      const clipboardContent = await Clipboard.getString();
      handleUrlChange(clipboardContent);
    } catch (error) {
      Alert.alert('Error', 'Failed to read clipboard');
    }
  };

  const toggleInstructions = () => {
    const targetValue = isInstructionsExpanded ? 0 : 120;
    Animated.timing(instructionsHeight, {
      toValue: targetValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsInstructionsExpanded(!isInstructionsExpanded);
  };

  const handleSubmit = async () => {
    if (!campaignId || !url || platform === null || isCheckboxChecked === false) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Submit reel
      if (!enrollment) {
        throw new Error("Enrollment not found");
      }

      await submitReelApi(
        enrollment.id,
        url,
        platform
      );

      await loadEnrollments();

      // Show success state
      setIsSuccess(true);
      Animated.spring(checkmarkScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();

      // Try to trigger confetti
      try {
        if (confettiRef.current) {
          confettiRef.current.start();
        }
      } catch (error) {
        // Confetti library not available, continue without it
      }

      // Auto-close after 2 seconds
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', 'Failed to submit reel. Please try again.');
    }
  };

  const loadEnrollments = useCampaignStore(
    (state) => state.loadEnrollments
  );

  const isSubmitDisabled = !url || platform === null || !isCheckboxChecked || isLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: spacing.md, flexDirection: 'row', alignItems: 'center' }}>
          {campaign?.albumArt ? (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.md,
                marginRight: spacing.sm,
                backgroundColor: colors.surface,
                overflow: 'hidden',
              }}
            >
              {/* Placeholder for campaign album art */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="disc" size={20} color={colors.textMuted} />
              </View>
            </View>
          ) : (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.md,
                marginRight: spacing.sm,
                backgroundColor: colors.surface,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="disc" size={20} color={colors.textMuted} />
            </View>
          )}
          <Text style={{ fontFamily: fonts.body, color: colors.text, fontWeight: '600' }}>
            {campaign?.trackName || 'Campaign'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {/* Instructions Card */}
        <TouchableOpacity
          onPress={toggleInstructions}
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.md,
            marginBottom: spacing.lg,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: fonts.body, color: colors.text, fontWeight: '600' }}>Instructions</Text>
            <Ionicons
              name={isInstructionsExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textMuted}
            />
          </View>

          <Animated.View
            style={{
              height: instructionsHeight,
              overflow: 'hidden',
              marginTop: spacing.sm,
            }}
          >
            <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, lineHeight: 20 }}>
              Post your reel using the DoorBeen audio, then paste the public URL below. Make sure your account is
              public.
            </Text>
          </Animated.View>
        </TouchableOpacity>

        {/* URL Input Field */}
        <View style={{ marginBottom: spacing.lg }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: validationError && url ? colors.red : colors.border,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            }}
          >
            <TextInput
              style={{
                flex: 1,
                color: colors.text,
                fontFamily: fonts.body,
                paddingVertical: spacing.sm,
              }}
              placeholder={
                instagramUsername
                  ? "Paste your Instagram Reel URL..."
                  : "Paste your Reel URL..."
              }
              placeholderTextColor={colors.textMuted}
              value={url}
              onChangeText={handleUrlChange}
              editable={!isLoading}
            />
            <TouchableOpacity onPress={handlePaste} disabled={isLoading} style={{ marginLeft: spacing.sm }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.blue, fontWeight: '600' }}>Paste</Text>
            </TouchableOpacity>
          </View>

          {/* Validation Message */}
          {url && (
            <View style={{ marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center' }}>
              {validationError ? (
                <>
                  <Ionicons name="alert-circle" size={16} color={colors.red} />
                  <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.red, marginLeft: spacing.xs }}>
                    {validationError}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={16} color={colors.green} />
                  <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.green, marginLeft: spacing.xs }}>
                    {platform === 'instagram' ? 'Instagram Reel detected' : 'YouTube Short detected'}
                  </Text>
                </>
              )}
            </View>
          )}
        </View>

        {/* Platform Badge */}
        {platform && <PlatformBadge platform={platform} />}

        {/* Instagram Account Confirmation */}
        <View
          style={{
            backgroundColor: instagramUsername ? colors.green + '15' : colors.amber + '15',
            borderRadius: radius.md,
            borderLeftWidth: 4,
            borderLeftColor: instagramUsername ? colors.green : colors.amber,
            padding: spacing.md,
            marginBottom: spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Ionicons
            name={instagramUsername ? 'checkmark-circle' : 'alert-circle'}
            size={20}
            color={instagramUsername ? colors.green : colors.amber}
            style={{ marginRight: spacing.sm }}
          />
          {instagramUsername ? (
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textMuted }}>Instagram account connected</Text>
              <Text style={{ fontFamily: fonts.body, color: colors.text, fontWeight: '600', marginTop: spacing.xs }}>
                @{instagramUsername}
              </Text>
            </View>
          ) : (
            <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.text, flex: 1 }}>
              Instagram not connected — some features may be limited
            </Text>
          )}
        </View>

        {/* Confirmation Checkbox */}
        <TouchableOpacity
          onPress={() => setIsCheckboxChecked(!isCheckboxChecked)}
          disabled={isLoading}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl }}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: radius.sm,
              borderWidth: 2,
              borderColor: isCheckboxChecked ? colors.blue : colors.border,
              backgroundColor: isCheckboxChecked ? colors.blue : 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: spacing.sm,
            }}
          >
            {isCheckboxChecked && <Ionicons name="checkmark" size={16} color={colors.bg} />}
          </View>
          <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.text, flex: 1, lineHeight: 20 }}>
            I confirm this reel uses the DoorBeen audio and will remain public for the campaign duration.
          </Text>
        </TouchableOpacity>

        {/* Success State */}
        {isSuccess && (
          <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
            <Animated.View
              style={{
                transform: [{ scale: checkmarkScale }],
                marginBottom: spacing.md,
              }}
            >
              <Ionicons name="checkmark-circle" size={64} color={colors.green} />
            </Animated.View>
            <Text style={{ fontFamily: fonts.body, color: colors.text, fontWeight: '600', textAlign: 'center' }}>
              Submitted! We'll verify within 24 hours.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Submit Button */}
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitDisabled}
          style={{
            backgroundColor: isSubmitDisabled ? colors.border : colors.blue,
            borderRadius: radius.full,
            paddingVertical: spacing.md,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 48,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.bg} size="small" />
          ) : (
            <Text style={{ fontFamily: fonts.body, color: colors.bg, fontWeight: '600' }}>Submit for Verification</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default SubmitReelModal;
