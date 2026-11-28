import { FlashList } from '@shopify/flash-list';
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { NameSheet } from '@/components/NameSheet';
import { NavigationBarScrim } from '@/components/NavigationBarScrim';
import { SearchField } from '@/components/SearchField';
import { StatusView } from '@/components/StatusView';
import {
  FOLDER_NAME_FIELD,
  findFolder,
  type FolderLibrary,
} from '@/features/folders/folderLibrary';
import { getUnassignedChannels, type FolderContents } from '@/features/folders/folderViews';
import { useChannelInbox } from '@/features/inbox/ChannelInboxProvider';
import {
  ALL_CHANNELS_FILTER,
  getChannelsForFilter,
  type ChannelFilter,
} from '@/features/inbox/channelFilter';
import { filterChannelsByName } from '@/features/inbox/channelNameSearch';
import { ChannelRow } from '@/features/inbox/components/ChannelRow';
import { FolderActionsSheet } from '@/features/inbox/components/FolderActionsSheet';
import { FolderPickerSheet } from '@/features/inbox/components/FolderPickerSheet';
import { InboxHeader } from '@/features/inbox/components/InboxHeader';
import { SelectionActionBar } from '@/features/inbox/components/SelectionActionBar';
import { SortPicker } from '@/features/inbox/components/SortPicker';
import { TopicPills } from '@/features/inbox/components/TopicPills';
import { describeChannelSubtitle } from '@/features/inbox/describeChannelSubtitle';
import type { SubscribedChannel } from '@/features/subscriptions/subscribedChannel';
import { useChannelPressHandlers } from '@/features/inbox/useChannelPressHandlers';
import { useChannelSelection } from '@/features/inbox/useChannelSelection';
import { useGestureHint } from '@/features/inbox/useGestureHint';
import { colors, spacing } from '@/theme/colors';
import { useCurrentTime } from '@/utils/useCurrentTime';

/** A row of the channel list; pinned channels only exist inside a folder. */
type ChannelListItem = {
  channel: SubscribedChannel;
  isPinned: boolean;
};

/** Leaves room so the last channel is not hidden behind the selection bar. */
const SELECTION_BAR_CLEARANCE = 120;

/**
 * The organized inbox: topic pills on top ("All" first, then each folder), and the chosen
 * topic's channels below. Long press channels to select them and move them to a folder.
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
    unassignChannels,
    setChannelPinned,
  } = useChannelInbox();
  const selection = useChannelSelection();
  const { selectedChannelIds, clearSelection } = selection;
  const [requestedFilter, setRequestedFilter] = useState<ChannelFilter>(ALL_CHANNELS_FILTER);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFolderPickerVisible, setIsFolderPickerVisible] = useState(false);
  const [isNewFolderSheetVisible, setIsNewFolderSheetVisible] = useState(false);
  const [folderIdForActions, setFolderIdForActions] = useState<string | null>(null);
  const channelSelectionHint = useGestureHint('selectChannels');
  const { markGestureUsed: markChannelSelectionUsed } = channelSelectionHint;
  const now = useCurrentTime();
  const { bottom: bottomInset } = useSafeAreaInsets();

  const hasUnassignedChannels = useMemo(
    () => getUnassignedChannels(library, subscribedChannels).length > 0,
    [library, subscribedChannels],
  );
  const channelFilter = resolveChannelFilter(library, requestedFilter, hasUnassignedChannels);
  // The tapped pill lights up at once; the list below catches up right after, in the background.
  const listFilter = useDeferredValue(channelFilter);
  const selectedFolder =
    listFilter.kind === 'folder' ? findFolder(library, listFilter.folderId) : undefined;
  const visibleChannels = useMemo(
    () =>
      filterFolderContents(
        getChannelsForFilter(library, subscribedChannels, listFilter),
        searchQuery,
      ),
    [library, subscribedChannels, listFilter, searchQuery],
  );
  const channelListItems = useMemo(() => toChannelListItems(visibleChannels), [visibleChannels]);
  const newUploadsSummary = useMemo(
    () => describeNewUploads(subscribedChannels),
    [subscribedChannels],
  );
  const isSearching = searchQuery.trim().length > 0;
  // Kept stable between renders, so the list redraws its rows only when one of these changes.
  const channelRowInputs = useMemo(
    () => ({ selectedChannelIds, sortOrder, latestUploadAtByChannelId, now, library }),
    [selectedChannelIds, sortOrder, latestUploadAtByChannelId, now, library],
  );
  const hasSelection = selection.selectedCount > 0;

  useEffect(() => {
    if (hasSelection) {
      markChannelSelectionUsed();
    }
  }, [hasSelection, markChannelSelectionUsed]);

  const selectFilter = useCallback(
    (filter: ChannelFilter) => {
      setRequestedFilter(filter);
      clearSelection();
    },
    [clearSelection],
  );

  function moveSelectionToFolder(folderId: string) {
    moveChannelsToFolder([...selectedChannelIds], folderId);
    clearSelection();
    setIsFolderPickerVisible(false);
  }

  function removeSelectionFromFolder() {
    unassignChannels([...selectedChannelIds]);
    clearSelection();
  }

  const toggleChannelPin = useCallback(
    (channelId: string, isPinned: boolean) => {
      if (selectedFolder) {
        setChannelPinned(selectedFolder.id, channelId, isPinned);
      }
    },
    [selectedFolder, setChannelPinned],
  );

  const { handleChannelPress, handleChannelLongPress } = useChannelPressHandlers(
    hasSelection,
    selection.toggleChannel,
  );

  function renderChannelRow({ item: { channel, isPinned } }: { item: ChannelListItem }) {
    return (
      <ChannelRow
        channel={channel}
        isSelected={selectedChannelIds.has(channel.channelId)}
        onPress={handleChannelPress}
        onLongPress={handleChannelLongPress}
        isPinned={isPinned}
        onTogglePin={selectedFolder ? toggleChannelPin : undefined}
        subtitle={describeChannelSubtitle({
          sortOrder,
          latestUploadAt: latestUploadAtByChannelId.get(channel.channelId),
          folderName:
            listFilter.kind === 'all'
              ? findFolderNameOfChannel(library, channel.channelId)
              : undefined,
          now,
        })}
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {/* Fixed above the list, so the topics stay in reach while scrolling a long list. */}
      <View style={styles.top}>
        <View style={styles.headerContainer}>
          <InboxHeader summary={newUploadsSummary} />
        </View>
        <SearchField
          query={searchQuery}
          onQueryChange={setSearchQuery}
          placeholder="Search channels"
          style={styles.searchField}
        />
        <TopicPills
          folders={library.folders}
          selectedFilter={channelFilter}
          hasUnassignedPill={hasUnassignedChannels && library.folders.length > 0}
          onSelect={selectFilter}
          onFolderLongPress={setFolderIdForActions}
          onCreateFolder={() => setIsNewFolderSheetVisible(true)}
        />
      </View>

      <FlashList
        data={channelListItems}
        keyExtractor={(item) => item.channel.channelId}
        renderItem={renderChannelRow}
        // Rows also depend on the selection, the sort order and the clock.
        extraData={channelRowInputs}
        contentContainerStyle={{
          ...styles.listContent,
          paddingBottom: SELECTION_BAR_CLEARANCE + bottomInset,
        }}
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
        ListHeaderComponent={
          <View style={styles.listToolbar}>
            <SortPicker />
            <Text style={styles.channelCount}>
              {describeChannelCount(channelListItems.length, channelSelectionHint.isVisible)}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyHint}>
            {describeEmptyChannelList(listFilter, isSearching)}
          </Text>
        }
      />

      <NavigationBarScrim />

      {hasSelection ? (
        <SafeAreaView edges={['bottom']} style={styles.actionBarContainer}>
          <SelectionActionBar
            selectedCount={selection.selectedCount}
            onMove={() => setIsFolderPickerVisible(true)}
            onRemoveFromFolder={selectedFolder ? removeSelectionFromFolder : undefined}
            onClear={clearSelection}
          />
        </SafeAreaView>
      ) : null}

      <FolderPickerSheet
        isVisible={isFolderPickerVisible}
        selectedCount={selection.selectedCount}
        currentFolderId={selectedFolder?.id}
        onFolderPicked={moveSelectionToFolder}
        onClose={() => setIsFolderPickerVisible(false)}
      />
      <FolderActionsSheet
        folder={folderIdForActions ? (findFolder(library, folderIdForActions) ?? null) : null}
        onClose={() => setFolderIdForActions(null)}
        onDeleted={() => selectFilter(ALL_CHANNELS_FILTER)}
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

/** Falls back to "All" when the chosen folder was deleted or nothing is left unassigned. */
function resolveChannelFilter(
  library: FolderLibrary,
  requestedFilter: ChannelFilter,
  hasUnassignedChannels: boolean,
): ChannelFilter {
  if (requestedFilter.kind === 'folder' && !findFolder(library, requestedFilter.folderId)) {
    return ALL_CHANNELS_FILTER;
  }

  if (requestedFilter.kind === 'unassigned' && !hasUnassignedChannels) {
    return ALL_CHANNELS_FILTER;
  }

  return requestedFilter;
}

function filterFolderContents(contents: FolderContents, searchQuery: string): FolderContents {
  return {
    pinnedChannels: filterChannelsByName(contents.pinnedChannels, searchQuery),
    otherChannels: filterChannelsByName(contents.otherChannels, searchQuery),
  };
}

function toChannelListItems({ pinnedChannels, otherChannels }: FolderContents): ChannelListItem[] {
  return [
    ...pinnedChannels.map((channel) => ({ channel, isPinned: true })),
    ...otherChannels.map((channel) => ({ channel, isPinned: false })),
  ];
}

function describeNewUploads(subscribedChannels: readonly SubscribedChannel[]): string {
  const channelsWithNewUploads = subscribedChannels.filter(
    (channel) => channel.newItemCount > 0,
  ).length;

  if (channelsWithNewUploads === 0) {
    return 'You are all caught up';
  }

  return channelsWithNewUploads === 1
    ? '1 channel with new uploads'
    : `${channelsWithNewUploads} channels with new uploads`;
}

function findFolderNameOfChannel(library: FolderLibrary, channelId: string): string | undefined {
  const folderId = library.folderIdByChannelId[channelId];
  return folderId ? findFolder(library, folderId)?.name : undefined;
}

function describeChannelCount(channelCount: number, isSelectionHintVisible: boolean): string {
  const channels = channelCount === 1 ? '1 channel' : `${channelCount} channels`;
  return isSelectionHintVisible ? `${channels} · long press to select` : channels;
}

function describeEmptyChannelList(channelFilter: ChannelFilter, isSearching: boolean): string {
  if (isSearching) {
    return 'No channel here matches your search.';
  }

  switch (channelFilter.kind) {
    case 'all':
      return 'You are not subscribed to any channel yet.';
    case 'unassigned':
      return 'Every channel is in a folder. Nice and tidy!';
    case 'folder':
      return 'No channels here yet. In All, long press channels to select them, then tap Move to… to file them here.';
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  top: {
    paddingBottom: spacing.small,
  },
  headerContainer: {
    paddingHorizontal: spacing.medium,
  },
  searchField: {
    marginHorizontal: spacing.medium,
    marginBottom: spacing.medium,
  },
  listContent: {
    // With the rows' own small padding, avatars line up with the header and the pills.
    paddingHorizontal: spacing.small,
  },
  listToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.small,
    paddingHorizontal: spacing.small,
    paddingBottom: spacing.small,
  },
  channelCount: {
    flexShrink: 1,
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'right',
  },
  emptyHint: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.small,
  },
  actionBarContainer: {
    position: 'absolute',
    left: spacing.medium,
    right: spacing.medium,
    bottom: spacing.medium,
  },
});
