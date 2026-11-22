import { StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/components/IconButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, spacing } from '@/theme/colors';

type SelectionActionBarProps = {
  selectedCount: number;
  onMove: () => void;
  onClear: () => void;
  /** Shown inside a folder, to send the selected channels back to "Unassigned". */
  onRemoveFromFolder?: () => void;
};

/** Bottom bar shown while channels are selected. */
export function SelectionActionBar({
  selectedCount,
  onMove,
  onClear,
  onRemoveFromFolder,
}: SelectionActionBarProps) {
  return (
    <View style={styles.bar}>
      <View style={styles.summary}>
        <IconButton iconName="close" accessibilityLabel="Clear selection" onPress={onClear} />
        <Text style={styles.count}>{selectedCount} selected</Text>
      </View>
      <View style={styles.actions}>
        {onRemoveFromFolder ? (
          <PrimaryButton
            label="Remove"
            variant="outlined"
            onPress={onRemoveFromFolder}
            style={styles.button}
          />
        ) : null}
        <PrimaryButton label="Move to…" onPress={onMove} style={styles.button} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.small,
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.small,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  count: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.small,
  },
  button: {
    minHeight: 44,
    paddingHorizontal: spacing.medium,
  },
});
