import type { PropsWithChildren } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme/colors';
import { useKeyboardHeight } from '@/utils/useKeyboardHeight';

type BottomSheetProps = PropsWithChildren<{
  isVisible: boolean;
  title: string;
  onClose: () => void;
}>;

/**
 * A dark panel that slides up from the bottom and stays above the keyboard. Tapping outside it
 * closes it.
 */
export function BottomSheet({ isVisible, title, onClose, children }: BottomSheetProps) {
  const safeAreaInsets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  // The modal draws edge to edge, so Android does not shrink it for the keyboard: lift the
  // sheet ourselves. The keyboard already covers the navigation bar inset when it is open.
  const bottomInset = Math.max(safeAreaInsets.bottom, keyboardHeight);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable
          style={styles.scrim}
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
        />
        <View style={[styles.sheet, { paddingBottom: bottomInset + spacing.medium }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.scrim,
  },
  sheet: {
    maxHeight: '80%',
    gap: spacing.medium,
    paddingTop: spacing.small,
    paddingHorizontal: spacing.large,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceBorder,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
});
