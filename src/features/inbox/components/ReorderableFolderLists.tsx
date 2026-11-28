import { useCallback, useMemo, type ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  NestedReorderableList,
  type ReorderableListReorderEvent,
} from 'react-native-reorderable-list';

import type { TopicFolder } from '@/features/folders/folderLibrary';
import { countChannelsPerFolder } from '@/features/folders/folderViews';
import { useChannelInbox } from '@/features/inbox/ChannelInboxProvider';
import { colors, spacing } from '@/theme/colors';

import { FolderRow } from './FolderRow';

type FolderListsProps = {
  /** True while channels are selected: tapping a folder then moves them into it. */
  hasSelection: boolean;
  onFolderPress: (folderId: string) => void;
};

/**
 * The folders, pinned ones in their own group on top. Each group is a separate drag and drop
 * list, so a drag can never move a folder across the pinned boundary. Must be rendered inside
 * the library's `ScrollViewContainer`, which coordinates dragging with scrolling.
 */
export function ReorderableFolderLists({ hasSelection, onFolderPress }: FolderListsProps) {
  const { library, subscribedChannels, moveFolder, setFolderPinned } = useChannelInbox();

  const channelCountByFolderId = useMemo(
    () => countChannelsPerFolder(library, subscribedChannels),
    [library, subscribedChannels],
  );
  const pinnedFolders = library.folders.filter((folder) => folder.isPinned);
  const unpinnedFolders = library.folders.filter((folder) => !folder.isPinned);

  const renderFolder = useCallback(
    ({ item: folder }: { item: TopicFolder }) => (
      <FolderRow
        folder={folder}
        channelCount={channelCountByFolderId.get(folder.id) ?? 0}
        isDropTarget={hasSelection}
        onPress={onFolderPress}
        onTogglePin={setFolderPinned}
      />
    ),
    [channelCountByFolderId, hasSelection, onFolderPress, setFolderPinned],
  );

  if (library.folders.length === 0) {
    return (
      <Text style={styles.emptyHint}>
        No folders yet. Create one for each topic you follow, like Tech, Geopolitics or Health.
      </Text>
    );
  }

  return (
    <View>
      {pinnedFolders.length > 0 ? (
        <FolderGroup
          label="Pinned"
          folders={pinnedFolders}
          renderFolder={renderFolder}
          // Pinned folders come first, so their group index is also their library index.
          onReorder={({ from, to }) => moveFolder(from, to)}
        />
      ) : null}
      {unpinnedFolders.length > 0 ? (
        <FolderGroup
          label={pinnedFolders.length > 0 ? 'Others' : undefined}
          folders={unpinnedFolders}
          renderFolder={renderFolder}
          onReorder={({ from, to }) =>
            moveFolder(from + pinnedFolders.length, to + pinnedFolders.length)
          }
        />
      ) : null}
    </View>
  );
}

type FolderGroupProps = {
  label?: string;
  folders: TopicFolder[];
  renderFolder: (info: { item: TopicFolder }) => ReactElement;
  onReorder: (event: ReorderableListReorderEvent) => void;
};

function FolderGroup({ label, folders, renderFolder, onReorder }: FolderGroupProps) {
  return (
    <View>
      {label ? <Text style={styles.groupLabel}>{label}</Text> : null}
      <NestedReorderableList
        data={folders}
        keyExtractor={(folder) => folder.id}
        renderItem={renderFolder}
        onReorder={onReorder}
        scrollable={false}
        // The inbox scroll view does the scrolling. A list that cannot scroll on its own is
        // allowed inside it, which is what keeps React Native's nesting warning away.
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  emptyHint: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: spacing.small,
  },
  groupLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.small,
  },
});
