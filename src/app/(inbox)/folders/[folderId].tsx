import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Alert, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/IconButton';
import { findFolder, type TopicFolder } from '@/features/folders/folderLibrary';
import { getFolderContents, type FolderContents } from '@/features/folders/folderViews';
import { useChannelInbox } from '@/features/inbox/ChannelInboxProvider';
import { ChannelRow } from '@/features/inbox/components/ChannelRow';
import { FolderNameSheet } from '@/features/inbox/components/FolderNameSheet';
import { FolderPickerSheet } from '@/features/inbox/components/FolderPickerSheet';
import { formatChannelCount } from '@/features/inbox/components/FolderRow';
import { SelectionActionBar } from '@/features/inbox/components/SelectionActionBar';
import { useChannelSelection } from '@/features/inbox/useChannelSelection';
import type { SubscribedChannel } from '@/features/subscriptions/subscribedChannel';
import { colors, spacing } from '@/theme/colors';

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
        <FolderTopBar title="Folder not found" />
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
    renameFolder,
    deleteFolder,
    setFolderPinned,
    setChannelPinned,
    moveChannelsToFolder,
    unassignChannels,
  } = useChannelInbox();
  const selection = useChannelSelection();
  const { selectedChannelIds, clearSelection } = selection;
  const [isFolderPickerVisible, setIsFolderPickerVisible] = useState(false);
  const [isRenameSheetVisible, setIsRenameSheetVisible] = useState(false);

  const sections = useMemo(
    () => buildChannelSections(getFolderContents(library, folder, subscribedChannels)),
    [library, folder, subscribedChannels],
  );
  const channelCount = sections.reduce((total, section) => total + section.data.length, 0);

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
      <FolderTopBar title={folder.name} subtitle={formatChannelCount(channelCount)}>
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
      </FolderTopBar>

      <SectionList
        sections={sections}
        keyExtractor={(channel) => channel.channelId}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item: channel, section }) => (
          <ChannelRow
            channel={channel}
            isSelected={selectedChannelIds.has(channel.channelId)}
            onToggleSelection={selection.toggleChannel}
            isPinned={section.isPinnedSection}
            onTogglePin={togglePin}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyHint}>
            No channels here yet. On the inbox, select channels and tap this folder to move them
            in.
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
      <FolderNameSheet
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

type FolderTopBarProps = {
  title: string;
  subtitle?: string;
  /** Action buttons shown on the right. */
  children?: ReactNode;
};

function FolderTopBar({ title, subtitle, children }: FolderTopBarProps) {
  return (
    <View style={styles.topBar}>
      <IconButton iconName="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} />
      <View style={styles.titles}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function buildChannelSections({
  pinnedChannels,
  otherChannels,
}: FolderContents): ChannelSection[] {
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.extraSmall,
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.small,
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: spacing.medium,
    paddingBottom: 120,
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
