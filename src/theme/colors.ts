import { DarkTheme, type Theme } from 'expo-router';

export const colors = {
  background: '#0F0F12',
  surface: '#1A1A20',
  surfaceBorder: '#2A2A33',
  textPrimary: '#F5F5F7',
  textSecondary: '#A1A1AA',
  accent: '#FF3B3B',
  accentPressed: '#D92F2F',
  onAccent: '#FFFFFF',
  warning: '#F5A524',
  danger: '#FF6B6B',
} as const;

export const spacing = {
  extraSmall: 4,
  small: 8,
  medium: 16,
  large: 24,
  extraLarge: 40,
} as const;

/** React Navigation theme so headers and screen backgrounds match the dark palette. */
export const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.background,
    card: colors.background,
    text: colors.textPrimary,
    border: colors.surfaceBorder,
  },
};
