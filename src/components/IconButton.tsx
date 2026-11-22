import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type IconButtonProps = {
  iconName: IconName;
  accessibilityLabel: string;
  onPress?: () => void;
  onLongPress?: () => void;
  /** Fires as soon as the finger touches the button, e.g. to start a drag right away. */
  onPressIn?: () => void;
  color?: string;
  size?: number;
  isDisabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const DEFAULT_ICON_SIZE = 22;
/** Keeps small icons comfortably tappable (Android recommends at least 48dp). */
const MINIMUM_TOUCH_SIZE = 44;

export function IconButton({
  iconName,
  accessibilityLabel,
  onPress,
  onLongPress,
  onPressIn,
  color = colors.textSecondary,
  size = DEFAULT_ICON_SIZE,
  isDisabled = false,
  style,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      hitSlop={4}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <MaterialCommunityIcons name={iconName} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: MINIMUM_TOUCH_SIZE,
    minHeight: MINIMUM_TOUCH_SIZE,
    borderRadius: MINIMUM_TOUCH_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: colors.surfaceBorder,
  },
  disabled: {
    opacity: 0.4,
  },
});
