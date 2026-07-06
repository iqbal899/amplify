import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useStyles } from '@/hooks/useStyles';
import { radius } from '@/constants/theme';

interface GradientBorderCardProps {
  children: React.ReactNode;
  isActive?: boolean;
}

export function GradientBorderCard({ children, isActive = false }: GradientBorderCardProps) {
  const styles = useStyles(getStyles);

  return (
    <View style={[
      styles.container,
      isActive ? styles.activeBorder : styles.staticBorder
    ]}>
      {children}
    </View>
  );
}

const BORDER_WIDTH = 2;

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  staticBorder: {
    borderWidth: BORDER_WIDTH,
    borderColor: colors.border,
  },
  activeBorder: {
    borderWidth: BORDER_WIDTH,
    borderColor: colors.borderActive,
  },
});
