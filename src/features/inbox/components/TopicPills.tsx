import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { IconName } from '@/components/IconButton';
import type { TopicFolder } from '@/features/folders/folderLibrary';
import {
  ALL_CHANNELS_FILTER,
  isSameChannelFilter,
  type ChannelFilter,
} from '@/features/inbox/channelFilter';
import { colors, spacing } from '@/theme/colors';

type TopicPillsProps = {
  folders: readonly TopicFolder[];
  selectedFilter: ChannelFilter;
  /** Adds an "Unassigned" pill, for channels that are in no folder yet. */
  hasUnassignedPill: boolean;
  onSelect: (filter: ChannelFilter) => void;
  /** Long press on a folder pill: rename, pin or delete it. */
  onFolderLongPress: (folderId: string) => void;
  onCreateFolder: () => void;
};

const UNASSIGNED_FILTER: ChannelFilter = { kind: 'unassigned' };

/**
 * A horizontal, scrollable row of topics: "All" first, then the folders (pinned ones lead),
 * then "Unassigned". A "+" button to create a folder stays fixed at the right edge.
 */
export function TopicPills({
  folders,
  selectedFilter,
  hasUnassignedPill,
  onSelect,
  onFolderLongPress,
  onCreateFolder,
}: TopicPillsProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        keyboardShouldPersistTaps="handled"
      >
        <TopicPill
          label="All"
          isSelected={isSameChannelFilter(selectedFilter, ALL_CHANNELS_FILTER)}
          onPress={() => onSelect(ALL_CHANNELS_FILTER)}
        />
        {folders.map((folder) => {
          const folderFilter: ChannelFilter = { kind: 'folder', folderId: folder.id };

          return (
            <TopicPill
              key={folder.id}
              label={folder.name}
              iconName={folder.isPinned ? 'pin' : undefined}
              isSelected={isSameChannelFilter(selectedFilter, folderFilter)}
              onPress={() => onSelect(folderFilter)}
              onLongPress={() => onFolderLongPress(folder.id)}
            />
          );
        })}
        {hasUnassignedPill ? (
          <TopicPill
            label="Unassigned"
            isSelected={isSameChannelFilter(selectedFilter, UNASSIGNED_FILTER)}
            onPress={() => onSelect(UNASSIGNED_FILTER)}
          />
        ) : null}
      </ScrollView>
      <View style={styles.fixedActions}>
        {/* Pills fade out as they scroll under the button instead of being cut off. */}
        <LinearGradient
          colors={[TRANSPARENT_BACKGROUND, colors.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fade}
          pointerEvents="none"
        />
        <View style={styles.newFolderButtonContainer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create a folder"
            onPress={onCreateFolder}
            style={({ pressed }) => [styles.newFolderButton, pressed && styles.pressedPill]}
          >
            <MaterialCommunityIcons name="plus" size={20} color={colors.accent} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

type TopicPillProps = {
  label: string;
  iconName?: IconName;
  isSelected: boolean;
  onPress: () => void;
  onLongPress?: () => void;
};

function TopicPill({
  label,
  iconName,
  isSelected,
  onPress,
  onLongPress,
}: TopicPillProps) {
  const contentColor = isSelected ? colors.onAccent : colors.textPrimary;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={label}
      accessibilityHint={onLongPress ? 'Long press for folder options' : undefined}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={300}
      style={({ pressed }) => [
        styles.pill,
        isSelected && styles.selectedPill,
        pressed && !isSelected && styles.pressedPill,
      ]}
    >
      {iconName ? <MaterialCommunityIcons name={iconName} size={14} color={contentColor} /> : null}
      <Text style={[styles.label, { color: contentColor }, isSelected && styles.selectedLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const PILL_HEIGHT = 36;
const FADE_WIDTH = 24;
/** The background at zero opacity, so the fade blends into it on every device. */
const TRANSPARENT_BACKGROUND = 'rgba(15, 15, 18, 0)';

const styles = StyleSheet.create({
  container: {
    // The fixed button is positioned against this box, over the scrolling pills.
    position: 'relative',
  },
  row: {
    gap: spacing.small,
    paddingLeft: spacing.medium,
    // Lets the last pill scroll fully clear of the fixed button.
    paddingRight: PILL_HEIGHT + FADE_WIDTH + spacing.medium,
  },
  fixedActions: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    flexDirection: 'row',
  },
  fade: {
    width: FADE_WIDTH,
  },
  newFolderButtonContainer: {
    justifyContent: 'center',
    paddingRight: spacing.medium,
    backgroundColor: colors.background,
  },
  newFolderButton: {
    width: PILL_HEIGHT,
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.extraSmall,
    height: PILL_HEIGHT,
    paddingHorizontal: 14,
    borderRadius: PILL_HEIGHT / 2,
    borderWidth: 1,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
  },
  selectedPill: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  pressedPill: {
    backgroundColor: colors.surfaceBorder,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedLabel: {
    fontWeight: '700',
  },
});
