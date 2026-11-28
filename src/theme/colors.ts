import { DarkTheme, type Theme } from 'expo-router';

export const colors = {
  background: '#0F0F12',
  surface: '#1A1A20',
  surfaceBorder: '#2A2A33',
  textPrimary: '#F5F5F7',
  textSecondary: '#A1A1AA',
  /** Warm orange, deliberately clear of YouTube's red so the app never imitates its look. */
  accent: '#FF8A3D',
  accentPressed: '#E8742A',
  /** Background of selected rows: the accent at low opacity. */
  selectionBackground: 'rgba(255, 138, 61, 0.14)',
  pin: '#F5C451',
  scrim: 'rgba(0, 0, 0, 0.6)',
  /** Behind Android's navigation buttons: the background, nearly opaque. */
  navigationBarScrim: 'rgba(15, 15, 18, 0.92)',
  /** Dark text and icons on the accent, which is too light for white text. */
  onAccent: '#2B1205',
  /** Text on dark overlays drawn over thumbnails, such as the video length. */
  onMedia: '#FFFFFF',
  mediaOverlay: 'rgba(0, 0, 0, 0.8)',
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
