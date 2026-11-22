import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useIsActive, useReorderableDrag } from 'react-native-reorderable-list';

import { IconButton } from '@/components/IconButton';
import type { TopicFolder } from '@/features/folders/folderLibrary';
import { colors, spacing } from '@/theme/colors';

type FolderRowProps = {
  folder: TopicFolder;
  channelCount: number;
  /** While channels are selected, tapping a folder moves them into it. */
  isDropTarget: boolean;
  onPress: (folderId: string) => void;
  onTogglePin: (folderId: string, isPinned: boolean) => void;
};

/**
 * A folder in the reorderable folder list. Long-press the row, or touch the handle, to drag
 * it. Must be rendered as an item of a `ReorderableList`.
 */
export const FolderRow = memo(function FolderRow({
  folder,
  channelCount,
  isDropTarget,
  onPress,
  onTogglePin,
}: FolderRowProps) {
  const startDrag = useReorderableDrag();
  const isBeingDragged = useIsActive();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        isDropTarget ? `Move selected channels to ${folder.name}` : `Open ${folder.name}`
      }
      accessibilityHint="Long press to reorder"
      onPress={() => onPress(folder.id)}
      onLongPress={startDrag}
      delayLongPress={250}
      style={({ pressed }) => [
        styles.row,
        isDropTarget && styles.dropTargetRow,
        pressed && styles.pressedRow,
        isBeingDragged && styles.draggedRow,
      ]}
    >
      <IconButton
        iconName={folder.isPinned ? 'pin' : 'pin-outline'}
        color={folder.isPinned ? colors.pin : colors.textSecondary}
        accessibilityLabel={folder.isPinned ? `Unpin ${folder.name}` : `Pin ${folder.name}`}
        onPress={() => onTogglePin(folder.id, !folder.isPinned)}
      />
      <MaterialCommunityIcons
        name={isDropTarget ? 'folder-download-outline' : 'folder-outline'}
        size={22}
        color={isDropTarget ? colors.accent : colors.textPrimary}
      />
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={1}>
          {folder.name}
        </Text>
        <Text style={styles.count}>{formatChannelCount(channelCount)}</Text>
      </View>
      <IconButton
        iconName="drag-horizontal-variant"
        accessibilityLabel={`Drag to reorder ${folder.name}`}
        onPressIn={startDrag}
      />
    </Pressable>
  );
});

export function formatChannelCount(channelCount: number): string {
  return channelCount === 1 ? '1 channel' : `${channelCount} channels`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    paddingLeft: spacing.extraSmall,
    paddingRight: spacing.extraSmall,
    marginBottom: spacing.small,
    minHeight: 60,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  dropTargetRow: {
    borderColor: colors.accent,
  },
  pressedRow: {
    backgroundColor: colors.surfaceBorder,
  },
  draggedRow: {
    borderColor: colors.textSecondary,
    backgroundColor: colors.surfaceBorder,
  },
  details: {
    flex: 1,
    gap: 2,
    paddingLeft: spacing.extraSmall,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  count: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
