/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { useColorScheme } from 'react-native';

export function useTheme() {
  const { themeMode } = useThemeStore();
  const systemScheme = useColorScheme();

  const theme = themeMode === 'system'
    ? (systemScheme === 'dark' ? 'dark' : 'light')
    : themeMode;

  return Colors[theme];
}
