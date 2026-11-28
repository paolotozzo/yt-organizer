import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/components/IconButton';
import { colors, spacing } from '@/theme/colors';

type ScreenTopBarProps = {
  title: string;
  subtitle?: string;
  /** Shown between the back button and the title, e.g. an avatar. */
  leading?: ReactNode;
  /** Action buttons shown on the right. */
  children?: ReactNode;
};

/** Back button, title and optional actions, at the top of pushed screens. */
export function ScreenTopBar({ title, subtitle, leading, children }: ScreenTopBarProps) {
  return (
    <View style={styles.topBar}>
      <IconButton iconName="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} />
      {leading}
      <View style={styles.titles}>
        <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.small,
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
