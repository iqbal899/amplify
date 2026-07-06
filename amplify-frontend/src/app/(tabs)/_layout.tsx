import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTheme } from '@/hooks/use-theme';

export default function TabLayout() {
  const colors = useTheme();

  return (
    <NativeTabs
      backgroundColor={colors.surface}
      indicatorColor={colors.blue}
      labelVisibilityMode="labeled"
      labelStyle={{
        selected: { color: colors.blue },
        default: { color: colors.textMuted },
      }}
      iconColor={{
        selected: '#FFFFFF',
        default: colors.textMuted,
      }}
    >
      <NativeTabs.Trigger name="discover">
        <NativeTabs.Trigger.Label>Discover</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="safari" md="explore" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="my-campaigns">
        <NativeTabs.Trigger.Label>My Campaigns</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="briefcase" md="business_center" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="earnings">
        <NativeTabs.Trigger.Label>Earnings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="indianrupeesign" md="currency_rupee" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person" md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
