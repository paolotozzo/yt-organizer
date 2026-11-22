import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { colors, spacing } from '@/theme/colors';

type PrimaryButtonVariant = 'filled' | 'outlined';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
  variant?: PrimaryButtonVariant;
  style?: ViewStyle;
};

export function PrimaryButton({
  label,
  onPress,
  isLoading = false,
  isDisabled = false,
  variant = 'filled',
  style,
}: PrimaryButtonProps) {
  const isInactive = isDisabled || isLoading;
  const isFilled = variant === 'filled';
  const contentColor = isFilled ? colors.onAccent : colors.textPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isInactive, busy: isLoading }}
      disabled={isInactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isFilled ? styles.filled : styles.outlined,
        pressed && isFilled && styles.filledPressed,
        pressed && !isFilled && styles.outlinedPressed,
        isInactive && styles.inactive,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={contentColor} />
      ) : (
        <Text style={[styles.label, { color: contentColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: spacing.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: {
    backgroundColor: colors.accent,
  },
  filledPressed: {
    backgroundColor: colors.accentPressed,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: 'transparent',
  },
  outlinedPressed: {
    backgroundColor: colors.surface,
  },
  inactive: {
    opacity: 0.6,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
