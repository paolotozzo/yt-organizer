import { StyleSheet } from 'react-native';

import { colors, spacing } from '@/theme/colors';

/** Text styles shared by the sections of the save sheet. */
export const saveSheetStyles = StyleSheet.create({
  section: {
    gap: spacing.extraSmall,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: spacing.small,
    paddingHorizontal: spacing.medium,
  },
  note: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: spacing.medium,
  },
  error: {
    color: colors.warning,
    fontSize: 13,
    paddingHorizontal: spacing.medium,
  },
  loading: {
    paddingVertical: spacing.large,
  },
});
