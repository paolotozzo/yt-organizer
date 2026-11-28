import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { useChannelInbox } from '@/features/inbox/ChannelInboxProvider';
import { CHANNEL_SORT_ORDERS, type ChannelSortOrder } from '@/features/sorting/channelSorting';
import type { SortProgress } from '@/features/sorting/useChannelSorting';
import { colors, spacing } from '@/theme/colors';

/**
 * "Sorted by …" control for the channel lists, with the progress of loading the data that
 * order needs. The choice applies to every list and is remembered.
 */
export function SortPicker() {
  const { sortOrder, setSortOrder, sortProgress, sortErrorMessage } = useChannelInbox();
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const selectedOption = CHANNEL_SORT_ORDERS.find((option) => option.value === sortOrder);

  function pickSortOrder(nextSortOrder: ChannelSortOrder) {
    setSortOrder(nextSortOrder);
    setIsSheetVisible(false);
  }

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Sorted by ${selectedOption?.label}. Change sort order`}
        onPress={() => setIsSheetVisible(true)}
        hitSlop={8}
        style={styles.trigger}
      >
        <MaterialCommunityIcons name="sort" size={18} color={colors.textSecondary} />
        <Text style={styles.triggerLabel}>
          Sorted by <Text style={styles.triggerValue}>{selectedOption?.label}</Text>
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={18} color={colors.textSecondary} />
        <SortProgressIndicator progress={sortProgress} />
      </Pressable>
      {sortErrorMessage ? <Text style={styles.errorMessage}>{sortErrorMessage}</Text> : null}

      <BottomSheet
        isVisible={isSheetVisible}
        title="Sort channels"
        onClose={() => setIsSheetVisible(false)}
      >
        <View style={styles.options}>
          {CHANNEL_SORT_ORDERS.map((option) => (
            <SortOption
              key={option.value}
              label={option.label}
              description={option.description}
              isSelected={option.value === sortOrder}
              onPress={() => pickSortOrder(option.value)}
            />
          ))}
        </View>
      </BottomSheet>
    </View>
  );
}

function SortProgressIndicator({ progress }: { progress: SortProgress }) {
  if (progress.status === 'idle') {
    return null;
  }

  return (
    <View style={styles.progress}>
      <ActivityIndicator size="small" color={colors.accent} />
      {progress.status === 'checkingUploads' ? (
        <Text style={styles.progressText}>
          {progress.checkedCount}/{progress.totalCount}
        </Text>
      ) : null}
    </View>
  );
}

type SortOptionProps = {
  label: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
};

function SortOption({ label, description, isSelected, onPress }: SortOptionProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={label}
      accessibilityHint={description}
      onPress={onPress}
      style={({ pressed }) => [styles.option, pressed && styles.pressedOption]}
    >
      <MaterialCommunityIcons
        name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
        size={22}
        color={isSelected ? colors.accent : colors.textSecondary}
      />
      <View style={styles.optionTexts}>
        <Text style={styles.optionLabel}>{label}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.extraSmall,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.extraSmall,
    alignSelf: 'flex-start',
    minHeight: 32,
  },
  triggerLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  triggerValue: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.extraSmall,
    marginLeft: spacing.small,
  },
  progressText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  errorMessage: {
    color: colors.warning,
    fontSize: 12,
  },
  options: {
    gap: spacing.extraSmall,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    minHeight: 60,
    paddingHorizontal: spacing.medium,
    borderRadius: 12,
  },
  pressedOption: {
    backgroundColor: colors.surfaceBorder,
  },
  optionTexts: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  optionDescription: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
