import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text } from 'react-native';

import type { IconName } from '@/components/IconButton';
import { colors, spacing } from '@/theme/colors';

type SheetOptionTone = 'default' | 'accent' | 'danger';

type SheetOptionProps = {
  iconName: IconName;
  label: string;
  tone?: SheetOptionTone;
  isDisabled?: boolean;
  onPress: () => void;
};

const TONE_COLORS: Record<SheetOptionTone, string> = {
  default: colors.textPrimary,
  accent: colors.accent,
  danger: colors.danger,
};

/** A tappable row with an icon, for menus shown in a BottomSheet. */
export function SheetOption({
  iconName,
  label,
  tone = 'default',
  isDisabled = false,
  onPress,
}: SheetOptionProps) {
  const contentColor = TONE_COLORS[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        pressed && styles.pressedOption,
        isDisabled && styles.disabledOption,
      ]}
    >
      <MaterialCommunityIcons name={iconName} size={22} color={contentColor} />
      <Text style={[styles.label, { color: contentColor }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    minHeight: 52,
    paddingHorizontal: spacing.medium,
    borderRadius: 12,
  },
  pressedOption: {
    backgroundColor: colors.surfaceBorder,
  },
  disabledOption: {
    opacity: 0.5,
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
});
