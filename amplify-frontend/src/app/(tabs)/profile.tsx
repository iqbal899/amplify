import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  CreditCard,
  History,
  FileText,
  HelpCircle,
  LogOut,
  Check,
  ChevronRight,
} from 'lucide-react-native';
import { spacing, radius, fonts } from '@/constants/theme';
import { BadgeCard } from '@/components/ui/BadgeCard';
import { useAuthStore } from '@/store/authStore';
import { useEarningsStore } from '@/store/earningsStore';
import { useCampaignStore } from '@/store/campaignStore';
import { useThemeStore } from '@/store/themeStore';
import { useTheme } from '@/hooks/use-theme';
import { useRouter } from 'expo-router';
import type { AchievementBadge } from '@/types';

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useTheme();
  const { themeMode, setThemeMode } = useThemeStore();
  const { user, instagramUsername, logout } = useAuthStore();
  const { totalEarned } = useEarningsStore();
  const { completed } = useCampaignStore();

  const badges: AchievementBadge[] = [
    {
      id: '1',
      name: 'First Reel',
      description: 'Submitted your first reel',
      icon: '🎬',
      unlocked: true,
    },
    {
      id: '2',
      name: '₹1,000 Club',
      description: 'Earned over ₹1,000 total',
      icon: '💰',
      unlocked: true,
    },
    {
      id: '3',
      name: 'Viral Creator',
      description: '1L+ views on a reel',
      icon: '🔥',
      unlocked: false,
      progress: 0.23,
      progressHint: '23K / 1L views',
    },
    {
      id: '4',
      name: '5 Campaign Streak',
      description: 'Completed 5 campaigns',
      icon: '⚡',
      unlocked: false,
      progress: 0.4,
      progressHint: '2 / 5 campaigns',
    },
    {
      id: '5',
      name: 'NE Creator',
      description: 'Northeast India creator badge',
      icon: '🏔️',
      unlocked: true,
    },
  ];

  const avgPerCampaign = useMemo(() => {
    const campaignsCount = Math.max(1, completed.length);
    return Math.round(totalEarned / campaignsCount);
  }, [totalEarned, completed.length]);

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  const handleSettingPress = (setting: string) => {
    if (setting === 'logout') {
      handleLogout();
    } else {
      Alert.alert('Coming Soon', `${setting} feature coming soon`);
    }
  };

  const handleUPIEdit = () => {
    Alert.alert('Edit UPI', 'UPI editing functionality coming soon');
  };

  const handleYouTubeConnect = () => {
    Alert.alert('Coming Soon', 'YouTube integration coming soon');
  };

  // Helper function to mask UPI ID
  const maskUPIId = (upiId: string) => {
    if (!upiId) return '';
    const [username, domain] = upiId.split('@');
    if (!domain) return upiId;
    const masked = username.substring(0, 4) + '****@' + domain;
    return masked;
  };

  const settingsItems = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'payout', label: 'Payout preferences', icon: CreditCard },
    { id: 'history', label: 'Campaign history', icon: History },
    { id: 'terms', label: 'Terms & Rules', icon: FileText },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
    { id: 'logout', label: 'Log out', icon: LogOut, isRed: true },
  ];

  const displayName = user?.name || 'Creator';
  const hasKYC = user?.isKYCComplete || false;
  const upiId = user?.upiId || '';
  const hasUPI = !!upiId;
  const instagramConnected = !!instagramUsername;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      >
        {/* Header Section */}
        <View style={{ padding: spacing.lg, alignItems: 'center' }}>
          {/* Avatar Circle */}
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.blue,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: '700',
                color: colors.bg,
                fontFamily: fonts.display,
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>

          {/* Display Name and Handle */}
          <View style={{ alignItems: 'center', marginBottom: spacing.sm }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: '700',
                fontFamily: fonts.display,
                color: colors.text,
                marginBottom: spacing.xs,
              }}
            >
              {displayName}
            </Text>
            {instagramConnected && (
              <Text style={{ fontSize: 14, color: colors.textMuted }}>
                @{instagramUsername}
              </Text>
            )}
          </View>

          {/* Verified Creator Badge */}
          {hasKYC && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.blue + '15',
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: radius.full,
                marginBottom: spacing.md,
              }}
            >
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: colors.blue,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: spacing.xs,
                }}
              >
                <Check size={12} color={colors.bg} strokeWidth={3} />
              </View>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: colors.blue,
                }}
              >
                Verified Creator
              </Text>
            </View>
          )}

          {/* Stats Row */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              width: '100%',
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              paddingVertical: spacing.lg,
              paddingHorizontal: spacing.md,
            }}
          >
            {/* Total Earned */}
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: colors.blue,
                  marginBottom: spacing.xs,
                }}
              >
                ₹{totalEarned.toLocaleString()}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textMuted,
                  fontWeight: '500',
                }}
              >
                Total Earned
              </Text>
            </View>

            {/* Campaigns Completed */}
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: colors.blue,
                  marginBottom: spacing.xs,
                }}
              >
                {completed.length}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textMuted,
                  fontWeight: '500',
                }}
              >
                Campaigns
              </Text>
            </View>

            {/* Average Per Campaign */}
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: colors.blue,
                  marginBottom: spacing.xs,
                }}
              >
                ₹{avgPerCampaign.toLocaleString()}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textMuted,
                  fontWeight: '500',
                }}
              >
                Avg/Campaign
              </Text>
            </View>
          </View>
        </View>

        {/* UPI/Bank Section */}
        {hasUPI && (
          <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                padding: spacing.lg,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textMuted,
                    marginBottom: spacing.xs,
                    fontWeight: '500',
                  }}
                >
                  UPI ID
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: spacing.sm,
                  }}
                >
                  {maskUPIId(upiId)}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: colors.green,
                      marginRight: spacing.xs,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.green,
                      fontWeight: '600',
                    }}
                  >
                    Verified ✓
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleUPIEdit}>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.blue,
                    fontWeight: '600',
                  }}
                >
                  Edit
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Connected Accounts */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: colors.text,
              marginBottom: spacing.md,
            }}
          >
            Connected Accounts
          </Text>

          {/* Instagram */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              padding: spacing.lg,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.text,
              }}
            >
              Instagram
            </Text>
            {instagramConnected ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Check size={18} color={colors.green} strokeWidth={2.5} />
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.green,
                    marginLeft: spacing.xs,
                    fontWeight: '600',
                  }}
                >
                  @{instagramUsername}
                </Text>
              </View>
            ) : (
              <TouchableOpacity>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.blue,
                    fontWeight: '600',
                  }}
                >
                  Connect
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* YouTube */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              padding: spacing.lg,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.text,
              }}
            >
              YouTube
            </Text>
            <TouchableOpacity
              onPress={handleYouTubeConnect}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderWidth: 1,
                borderColor: colors.blue,
                borderRadius: radius.md,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: colors.blue,
                  fontWeight: '600',
                }}
              >
                Connect
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Achievement Badges */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: colors.text,
              marginBottom: spacing.md,
              paddingHorizontal: spacing.lg,
            }}
          >
            Achievement Badges
          </Text>
          <FlatList
            data={badges}
            renderItem={({ item }) => <BadgeCard badge={item} />}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: spacing.lg,
              gap: spacing.md,
            }}
            scrollEventThrottle={16}
          />
        </View>

        {/* Theme Settings Selector */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: colors.text,
              marginBottom: spacing.md,
            }}
          >
            App Theme
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              padding: spacing.xs,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {(['light', 'dark', 'system'] as const).map((mode) => {
              const isSelected = themeMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setThemeMode(mode)}
                  style={{
                    flex: 1,
                    paddingVertical: spacing.sm,
                    alignItems: 'center',
                    backgroundColor: isSelected ? colors.blue : 'transparent',
                    borderRadius: radius.md,
                    marginHorizontal: 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: isSelected ? colors.surface : colors.textSub,
                      textTransform: 'capitalize',
                    }}
                  >
                    {mode}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Settings List */}
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: colors.text,
              marginBottom: spacing.md,
            }}
          >
            Settings
          </Text>
          {settingsItems.map((item, index) => {
            const IconComponent = item.icon;
            const isLast = index === settingsItems.length - 1;
            const isRed = item.isRed || false;

            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleSettingPress(item.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.md,
                  backgroundColor: colors.surface,
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: colors.border,
                  borderTopLeftRadius: index === 0 ? radius.lg : 0,
                  borderTopRightRadius: index === 0 ? radius.lg : 0,
                  borderBottomLeftRadius: isLast ? radius.lg : 0,
                  borderBottomRightRadius: isLast ? radius.lg : 0,
                }}
              >
                <IconComponent
                  size={20}
                  color={isRed ? colors.red : colors.textMuted}
                  strokeWidth={2}
                  style={{ marginRight: spacing.md }}
                />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 16,
                    fontWeight: '500',
                    color: isRed ? colors.red : colors.text,
                  }}
                >
                  {item.label}
                </Text>
                <ChevronRight
                  size={20}
                  color={isRed ? colors.red : colors.textMuted}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
