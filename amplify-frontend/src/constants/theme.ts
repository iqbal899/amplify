import { Platform } from 'react-native';

export const lightColors = {
  bg: '#F4F6FB', // Google Health inspired soft background
  surface: '#FFFFFF', // Pure white card surfaces
  surfaceElevated: '#FFFFFF', // White for elevated surfaces
  card: '#FFFFFF', // White for cards
  blue: '#1A6BFF', // Primary Google blue
  blueDim: '#1252CC',
  blueGlow: 'rgba(26, 107, 255, 0.08)',
  cyan: '#0284C7',
  cyanGlow: 'rgba(2, 132, 199, 0.08)',
  gold: '#D97706',
  goldGlow: 'rgba(217, 119, 6, 0.08)',
  goldDim: '#B45309',
  green: '#00875A',
  greenGlow: 'rgba(0, 135, 90, 0.08)',
  amber: '#D97706',
  red: '#DE350B',
  text: '#172B4D', // High contrast primary text
  textMuted: '#5E6C84', // Medium contrast text
  textSub: '#7A869A', // Soft secondary text
  border: '#DFE1E6', // Clean soft border
  borderActive: '#1A6BFF',

  // Core compatibility properties
  background: '#F4F6FB',
  backgroundElement: '#FFFFFF',
  backgroundSelected: 'rgba(26, 107, 255, 0.08)',
  textSecondary: '#5E6C84',
};

export const darkColors = {
  bg: '#121212', // Near-black charcoal background
  surface: '#1E1E1E', // Dark grey card surface
  surfaceElevated: '#2A2A2A', // Elevated dark grey surface
  card: '#1E1E1E',
  blue: '#1A6BFF', // Primary Google blue (same as light theme)
  blueDim: '#1252CC',
  blueGlow: 'rgba(26, 107, 255, 0.08)',
  cyan: '#22D3EE',
  cyanGlow: 'rgba(34, 211, 238, 0.12)',
  gold: '#F59E0B',
  goldGlow: 'rgba(245, 158, 11, 0.12)',
  goldDim: '#D97706',
  green: '#10B981',
  greenGlow: 'rgba(16, 185, 129, 0.12)',
  amber: '#F59E0B',
  red: '#EF4444',
  text: '#F3F4F6', // Off-white clean text
  textMuted: '#9CA3AF', // Neutral muted text
  textSub: '#6B7280', // Secondary neutral text
  border: '#2C2C2C', // Neutral dark border
  borderActive: '#1A6BFF',

  // Core compatibility properties
  background: '#121212',
  backgroundElement: '#1E1E1E',
  backgroundSelected: 'rgba(26, 107, 255, 0.08)',
  textSecondary: '#9CA3AF',
};

export const Colors = {
  light: lightColors,
  dark: darkColors,
};

export const colors = lightColors;

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48
};

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 24, full: 9999
};

export const fonts = {
  display: 'Syne_700Bold',
  displayMedium: 'Syne_600SemiBold',
  body: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
  bodyBold: 'Figtree_700Bold',
};

// Core compatibility types and constants
export type ThemeColor = 'text' | 'background' | 'backgroundElement' | 'backgroundSelected' | 'textSecondary';

export const Fonts = {
  ...fonts,
  mono: Platform.select({
    ios: 'ui-monospace',
    android: 'monospace',
    default: 'monospace',
  }),
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 800;
