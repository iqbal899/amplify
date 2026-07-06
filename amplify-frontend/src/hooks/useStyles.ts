import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from './use-theme';

export function useStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  createStyles: (colors: ReturnType<typeof useTheme>) => T
): T {
  const colors = useTheme();
  return useMemo(() => createStyles(colors), [colors, createStyles]);
}
