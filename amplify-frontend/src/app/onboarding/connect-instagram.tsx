import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { spacing, radius, fonts } from '@/constants/theme';
import { useInstagramAuth } from '@/hooks/useInstagramAuth';

export default function ConnectInstagramScreen() {
  const router = useRouter();
  const colors = useTheme();

  const { connect, disconnect, connection, isLoading, error, isReady } =
    useInstagramAuth();

  const isConnected = connection?.connected ?? false;
  const isExpired = connection?.expired ?? false;

  const handleContinue = () => {
    router.push('/onboarding/kyc');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.iconCircle, { backgroundColor: colors.blueGlow }]}>
          <Ionicons name="logo-instagram" size={44} color={colors.blue} />
        </View>

        <Text
          style={[
            styles.headline,
            { color: colors.text, fontFamily: fonts.display },
          ]}
        >
          Connect Instagram
        </Text>

        <Text style={[styles.subhead, { color: colors.textMuted }]}>
          We read the view count on the reels you submit, so your milestones and
          payouts update automatically. We can&apos;t post, message, or see
          anything else.
        </Text>

        {/* Account type is a hard requirement — insights are unavailable on
            personal accounts, so surface it before they hit the error. */}
        <View
          style={[
            styles.notice,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.textMuted}
          />
          <Text style={[styles.noticeText, { color: colors.textMuted }]}>
            Your account must be a Professional (Business or Creator) account.
            It&apos;s free to switch in Instagram → Settings → Account type.
          </Text>
        </View>

        {isConnected && (
          <View
            style={[
              styles.statusCard,
              { backgroundColor: colors.blueGlow, borderColor: colors.blue },
            ]}
          >
            <Ionicons name="checkmark-circle" size={22} color={colors.blue} />
            <View style={styles.statusTextWrap}>
              <Text style={[styles.statusTitle, { color: colors.text }]}>
                Connected as @{connection?.username}
              </Text>
              {connection?.accountType ? (
                <Text style={[styles.statusMeta, { color: colors.textMuted }]}>
                  {connection.accountType.replace('_', ' ').toLowerCase()} account
                </Text>
              ) : null}
            </View>
          </View>
        )}

        {isExpired && (
          <View
            style={[
              styles.statusCard,
              { backgroundColor: colors.goldGlow, borderColor: colors.gold },
            ]}
          >
            <Ionicons name="alert-circle" size={22} color={colors.gold} />
            <View style={styles.statusTextWrap}>
              <Text style={[styles.statusTitle, { color: colors.text }]}>
                Connection expired
              </Text>
              <Text style={[styles.statusMeta, { color: colors.textMuted }]}>
                Reconnect so we can keep tracking your views.
              </Text>
            </View>
          </View>
        )}

        {error ? (
          <View
            style={[
              styles.statusCard,
              { backgroundColor: colors.surface, borderColor: colors.red },
            ]}
          >
            <Ionicons name="close-circle" size={22} color={colors.red} />
            <Text style={[styles.errorText, { color: colors.text }]}>
              {error}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {isConnected ? (
          <>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.blue }]}
              onPress={handleContinue}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.textButton}
              onPress={disconnect}
              disabled={isLoading}
            >
              <Text style={[styles.textButtonLabel, { color: colors.textMuted }]}>
                Disconnect
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: colors.blue,
                  opacity: isLoading || !isReady ? 0.6 : 1,
                },
              ]}
              onPress={connect}
              disabled={isLoading || !isReady}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isExpired ? 'Reconnect Instagram' : 'Connect Instagram'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Skippable: they can browse campaigns, but enrolling needs a
                connection since there'd be no way to verify views. */}
            <TouchableOpacity style={styles.textButton} onPress={handleContinue}>
              <Text style={[styles.textButtonLabel, { color: colors.textMuted }]}>
                I&apos;ll do this later
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl * 1.5,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  headline: {
    fontSize: 30,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subhead: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  notice: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    width: '100%',
    marginBottom: spacing.md,
  },
  statusTextWrap: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  statusMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  primaryButton: {
    height: 54,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  textButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textButtonLabel: {
    fontSize: 15,
  },
});
