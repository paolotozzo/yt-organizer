import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/IconButton';
import { NameSheet } from '@/components/NameSheet';
import { SearchField } from '@/components/SearchField';
import { ScreenTopBar } from '@/components/ScreenTopBar';
import { FOLDER_NAME_FIELD, findFolder, type TopicFolder } from '@/features/folders/folderLibrary';
import { getFolderContents, type FolderContents } from '@/features/folders/folderViews';
import { useChannelInbox } from '@/features/inbox/ChannelInboxProvider';
import { filterChannelsByName } from '@/features/inbox/channelNameSearch';
import { ChannelRow } from '@/features/inbox/components/ChannelRow';
import { FolderPickerSheet } from '@/features/inbox/components/FolderPickerSheet';
import { formatChannelCount } from '@/features/inbox/components/FolderRow';
import { SelectionActionBar } from '@/features/inbox/components/SelectionActionBar';
import { SortPicker } from '@/features/inbox/components/SortPicker';
import { describeChannelSubtitle } from '@/features/inbox/describeChannelSubtitle';
import { useChannelPressHandlers } from '@/features/inbox/useChannelPressHandlers';
import { useChannelSelection } from '@/features/inbox/useChannelSelection';
import type { SubscribedChannel } from '@/features/subscriptions/subscribedChannel';
import { colors, spacing } from '@/theme/colors';
import { useCurrentTime } from '@/utils/useCurrentTime';

type ChannelSection = {
  title: string;
  isPinnedSection: boolean;
  data: SubscribedChannel[];
};

/** One topic folder: its channels, pinned ones on top, plus rename, pin and delete. */
export default function FolderScreen() {
  const { folderId } = useLocalSearchParams<{ folderId: string }>();
  const { library } = useChannelInbox();
  const folder = findFolder(library, folderId);

  if (!folder) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScreenTopBar title="Folder not found" />
        <Text style={styles.emptyHint}>This folder no longer exists.</Text>
      </SafeAreaView>
    );
  }

  return <FolderContentsScreen folder={folder} />;
}

function FolderContentsScreen({ folder }: { folder: TopicFolder }) {
  const {
    library,
    subscribedChannels,
    sortOrder,
    latestUploadAtByChannelId,
    renameFolder,
    deleteFolder,
    setFolderPinned,
    setChannelPinned,
    moveChannelsToFolder,
    unassignChannels,
  } = useChannelInbox();
  const selection = useChannelSelection();
  const { selectedChannelIds, clearSelection } = selection;
  const now = useCurrentTime();
  const { handleChannelPress, handleChannelLongPress } = useChannelPressHandlers(
    selection.selectedCount > 0,
    selection.toggleChannel,
  );
  const [isFolderPickerVisible, setIsFolderPickerVisible] = useState(false);
  const [isRenameSheetVisible, setIsRenameSheetVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const folderContents = useMemo(
    () => getFolderContents(library, folder, subscribedChannels),
    [library, folder, subscribedChannels],
  );
  const channelCount = folderContents.pinnedChannels.length + folderContents.otherChannels.length;
  const sections = useMemo(
    () => buildChannelSections(filterFolderContents(folderContents, searchQuery)),
    [folderContents, searchQuery],
  );
  const isSearching = searchQuery.trim().length > 0;

  const togglePin = useCallback(
    (channelId: string, isPinned: boolean) => setChannelPinned(folder.id, channelId, isPinned),
    [folder.id, setChannelPinned],
  );

  function moveSelectionToFolder(destinationFolderId: string) {
    moveChannelsToFolder([...selectedChannelIds], destinationFolderId);
    clearSelection();
    setIsFolderPickerVisible(false);
  }

  function removeSelectionFromFolder() {
    unassignChannels([...selectedChannelIds]);
    clearSelection();
  }

  function confirmDelete() {
    Alert.alert(
      `Delete "${folder.name}"?`,
      'Its channels move back to Unassigned. You stay subscribed to all of them.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            router.back();
            deleteFolder(folder.id);
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScreenTopBar title={folder.name} subtitle={formatChannelCount(channelCount)}>
        <IconButton
          iconName={folder.isPinned ? 'pin' : 'pin-outline'}
          color={folder.isPinned ? colors.pin : colors.textSecondary}
          accessibilityLabel={folder.isPinned ? 'Unpin folder' : 'Pin folder'}
          onPress={() => setFolderPinned(folder.id, !folder.isPinned)}
        />
        <IconButton
          iconName="pencil-outline"
          accessibilityLabel="Rename folder"
          onPress={() => setIsRenameSheetVisible(true)}
        />
        <IconButton
          iconName="trash-can-outline"
          color={colors.danger}
          accessibilityLabel="Delete folder"
          onPress={confirmDelete}
        />
      </ScreenTopBar>

      <SectionList
        sections={sections}
        keyExtractor={(channel) => channel.channelId}
        contentContainerStyle={styles.listContent}
        // Taps on a channel still work while the search keyboard is open.
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          channelCount > 0 ? (
            <View style={styles.listHeader}>
              <SearchField
                query={searchQuery}
                onQueryChange={setSearchQuery}
                placeholder={`Search in ${folder.name}`}
              />
              <SortPicker />
            </View>
          ) : undefined
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item: channel, section }) => (
          <ChannelRow
            channel={channel}
            isSelected={selectedChannelIds.has(channel.channelId)}
            onPress={handleChannelPress}
            onLongPress={handleChannelLongPress}
            isPinned={section.isPinnedSection}
            onTogglePin={togglePin}
            subtitle={describeChannelSubtitle({
              sortOrder,
              latestUploadAt: latestUploadAtByChannelId.get(channel.channelId),
              now,
            })}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyHint}>
            {isSearching
              ? 'No channel in this folder matches your search.'
              : 'No channels here yet. On the inbox, long press channels to select them, then tap this folder to move them in.'}
          </Text>
        }
      />

      {selection.selectedCount > 0 ? (
        <SafeAreaView edges={['bottom']} style={styles.actionBarContainer}>
          <SelectionActionBar
            selectedCount={selection.selectedCount}
            onMove={() => setIsFolderPickerVisible(true)}
            onRemoveFromFolder={removeSelectionFromFolder}
            onClear={clearSelection}
          />
        </SafeAreaView>
      ) : null}

      <FolderPickerSheet
        isVisible={isFolderPickerVisible}
        selectedCount={selection.selectedCount}
        currentFolderId={folder.id}
        onFolderPicked={moveSelectionToFolder}
        onClose={() => setIsFolderPickerVisible(false)}
      />
      <NameSheet
        {...FOLDER_NAME_FIELD}
        isVisible={isRenameSheetVisible}
        title="Rename folder"
        submitLabel="Save"
        initialName={folder.name}
        onSubmit={(proposedName) => renameFolder(folder.id, proposedName)}
        onClose={() => setIsRenameSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

function filterFolderContents(contents: FolderContents, searchQuery: string): FolderContents {
  return {
    pinnedChannels: filterChannelsByName(contents.pinnedChannels, searchQuery),
    otherChannels: filterChannelsByName(contents.otherChannels, searchQuery),
  };
}

function buildChannelSections({ pinnedChannels, otherChannels }: FolderContents): ChannelSection[] {
  const sections: ChannelSection[] = [];

  if (pinnedChannels.length > 0) {
    sections.push({ title: 'Pinned', isPinnedSection: true, data: pinnedChannels });
  }

  if (otherChannels.length > 0) {
    const title = pinnedChannels.length > 0 ? 'Other channels' : 'Channels';
    sections.push({ title, isPinnedSection: false, data: otherChannels });
  }

  return sections;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.medium,
    paddingBottom: 120,
  },
  listHeader: {
    gap: spacing.small,
    paddingTop: spacing.small,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: spacing.medium,
    marginBottom: spacing.small,
  },
  emptyHint: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    padding: spacing.medium,
  },
  actionBarContainer: {
    position: 'absolute',
    left: spacing.medium,
    right: spacing.medium,
    bottom: spacing.medium,
  },
});
