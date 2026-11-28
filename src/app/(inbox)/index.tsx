import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ScrollViewContainer } from 'react-native-reorderable-list';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/IconButton';
import { NameSheet } from '@/components/NameSheet';
import { SearchField } from '@/components/SearchField';
import { StatusView } from '@/components/StatusView';
import {
  FOLDER_NAME_FIELD,
  findFolder,
  type FolderLibrary,
} from '@/features/folders/folderLibrary';
import { getUnassignedChannels } from '@/features/folders/folderViews';
import { useChannelInbox } from '@/features/inbox/ChannelInboxProvider';
import { filterChannelsByName } from '@/features/inbox/channelNameSearch';
import { ChannelRow } from '@/features/inbox/components/ChannelRow';
import { FolderPickerSheet } from '@/features/inbox/components/FolderPickerSheet';
import { InboxHeader } from '@/features/inbox/components/InboxHeader';
import { ReorderableFolderLists } from '@/features/inbox/components/ReorderableFolderLists';
import { SectionHeader } from '@/features/inbox/components/SectionHeader';
import { SegmentedControl } from '@/features/inbox/components/SegmentedControl';
import { SelectionActionBar } from '@/features/inbox/components/SelectionActionBar';
import { SortPicker } from '@/features/inbox/components/SortPicker';
import { describeChannelSubtitle } from '@/features/inbox/describeChannelSubtitle';
import { useChannelPressHandlers } from '@/features/inbox/useChannelPressHandlers';
import { useChannelSelection } from '@/features/inbox/useChannelSelection';
import { colors, spacing } from '@/theme/colors';
import { useCurrentTime } from '@/utils/useCurrentTime';

type ChannelFilter = 'unassigned' | 'all';

const CHANNEL_FILTER_OPTIONS = [
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'all', label: 'All' },
] as const;

/**
 * The organized inbox: topic folders on top, subscribed channels below. Select channels and
 * tap a folder (or "Move to…") to file them; drag folders to reorder them.
 */
export default function InboxScreen() {
  const inbox = useChannelInbox();

  if (!inbox.isLibraryLoaded || inbox.subscriptionsState.status === 'loading') {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusView status="loading" message="Loading your subscriptions…" />
      </SafeAreaView>
    );
  }

  if (inbox.subscriptionsState.status === 'failed') {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusView
          status="failed"
          errorMessage={inbox.subscriptionsState.errorMessage}
          onRetry={inbox.refreshSubscriptions}
        />
      </SafeAreaView>
    );
  }

  return <OrganizedInbox />;
}

function OrganizedInbox() {
  const {
    library,
    subscribedChannels,
    sortOrder,
    latestUploadAtByChannelId,
    isRefreshing,
    refreshSubscriptions,
    createFolder,
    moveChannelsToFolder,
  } = useChannelInbox();
  const selection = useChannelSelection();
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('unassigned');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFolderPickerVisible, setIsFolderPickerVisible] = useState(false);
  const [isNewFolderSheetVisible, setIsNewFolderSheetVisible] = useState(false);

  const unassignedChannels = useMemo(
    () => getUnassignedChannels(library, subscribedChannels),
    [library, subscribedChannels],
  );
  const filteredChannels = channelFilter === 'unassigned' ? unassignedChannels : subscribedChannels;
  const visibleChannels = useMemo(
    () => filterChannelsByName(filteredChannels, searchQuery),
    [filteredChannels, searchQuery],
  );
  const isSearching = searchQuery.trim().length > 0;
  const hasSelection = selection.selectedCount > 0;
  const now = useCurrentTime();
  const { selectedChannelIds, clearSelection } = selection;

  const moveSelectionToFolder = useCallback(
    (folderId: string) => {
      moveChannelsToFolder([...selectedChannelIds], folderId);
      clearSelection();
      setIsFolderPickerVisible(false);
    },
    [moveChannelsToFolder, selectedChannelIds, clearSelection],
  );

  const handleFolderPress = useCallback(
    (folderId: string) => {
      if (hasSelection) {
        moveSelectionToFolder(folderId);
        return;
      }

      router.push({ pathname: '/folders/[folderId]', params: { folderId } });
    },
    [hasSelection, moveSelectionToFolder],
  );

  const { handleChannelPress, handleChannelLongPress } = useChannelPressHandlers(
    hasSelection,
    selection.toggleChannel,
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollViewContainer
        contentContainerStyle={styles.content}
        // Taps on a channel still work while the search keyboard is open.
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshSubscriptions}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        <InboxHeader />

        <SectionHeader
          title="Folders"
          subtitle={
            hasSelection ? 'Tap a folder to move the selected channels' : 'Long press to reorder'
          }
          accessory={
            <IconButton
              iconName="folder-plus-outline"
              color={colors.accent}
              accessibilityLabel="Create a folder"
              onPress={() => setIsNewFolderSheetVisible(true)}
            />
          }
        />
        <ReorderableFolderLists hasSelection={hasSelection} onFolderPress={handleFolderPress} />

        <View style={styles.channelsSection}>
          <SectionHeader
            title="Channels"
            subtitle={
              hasSelection
                ? describeChannelCount(channelFilter, visibleChannels.length, isSearching)
                : `${describeChannelCount(channelFilter, visibleChannels.length, isSearching)} · long press to select`
            }
            accessory={
              <SegmentedControl
                options={CHANNEL_FILTER_OPTIONS}
                selectedValue={channelFilter}
                onChange={setChannelFilter}
              />
            }
          />
          <SearchField
            query={searchQuery}
            onQueryChange={setSearchQuery}
            placeholder="Search channels"
            style={styles.searchField}
          />
          <SortPicker />
          {visibleChannels.length === 0 ? (
            <Text style={styles.emptyHint}>
              {describeEmptyChannelList(channelFilter, isSearching)}
            </Text>
          ) : (
            visibleChannels.map((channel) => (
              <ChannelRow
                key={channel.channelId}
                channel={channel}
                isSelected={selectedChannelIds.has(channel.channelId)}
                onPress={handleChannelPress}
                onLongPress={handleChannelLongPress}
                subtitle={describeChannelSubtitle({
                  sortOrder,
                  latestUploadAt: latestUploadAtByChannelId.get(channel.channelId),
                  folderName:
                    channelFilter === 'all'
                      ? findFolderNameOfChannel(library, channel.channelId)
                      : undefined,
                  now,
                })}
              />
            ))
          )}
        </View>
      </ScrollViewContainer>

      {hasSelection ? (
        <SafeAreaView edges={['bottom']} style={styles.actionBarContainer}>
          <SelectionActionBar
            selectedCount={selection.selectedCount}
            onMove={() => setIsFolderPickerVisible(true)}
            onClear={clearSelection}
          />
        </SafeAreaView>
      ) : null}

      <FolderPickerSheet
        isVisible={isFolderPickerVisible}
        selectedCount={selection.selectedCount}
        onFolderPicked={moveSelectionToFolder}
        onClose={() => setIsFolderPickerVisible(false)}
      />
      <NameSheet
        {...FOLDER_NAME_FIELD}
        isVisible={isNewFolderSheetVisible}
        title="New folder"
        submitLabel="Create"
        onSubmit={createFolder}
        onClose={() => setIsNewFolderSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

function findFolderNameOfChannel(library: FolderLibrary, channelId: string): string | undefined {
  const folderId = library.folderIdByChannelId[channelId];
  return folderId ? findFolder(library, folderId)?.name : undefined;
}

function describeChannelCount(
  channelFilter: ChannelFilter,
  channelCount: number,
  isSearching: boolean,
): string {
  const channels = channelCount === 1 ? '1 channel' : `${channelCount} channels`;

  if (isSearching) {
    return `${channels} found`;
  }

  return channelFilter === 'unassigned' ? `${channels} not in a folder` : `${channels} in total`;
}

function describeEmptyChannelList(channelFilter: ChannelFilter, isSearching: boolean): string {
  if (isSearching) {
    return channelFilter === 'unassigned'
      ? 'No unassigned channel matches. Switch to All to search every channel.'
      : 'No channel matches your search.';
  }

  return channelFilter === 'unassigned'
    ? 'Every channel is in a folder. Nice and tidy!'
    : 'You are not subscribed to any channel yet.';
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.medium,
    // Leaves room so the last channel is not hidden behind the selection bar.
    paddingBottom: 120,
  },
  channelsSection: {
    marginTop: spacing.large,
  },
  searchField: {
    marginBottom: spacing.small,
  },
  emptyHint: {
    color: colors.textSecondary,
    fontSize: 14,
    paddingVertical: spacing.small,
  },
  actionBarContainer: {
    position: 'absolute',
    left: spacing.medium,
    right: spacing.medium,
    bottom: spacing.medium,
  },
});
