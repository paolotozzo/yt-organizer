import { FlashList } from '@shopify/flash-list';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/IconButton';
import { NameSheet } from '@/components/NameSheet';
import { ScreenTopBar } from '@/components/ScreenTopBar';
import { useSavedVideoLists } from '@/features/savedLists/SavedVideoListsProvider';
import {
  LIST_NAME_FIELD,
  findSavedVideoList,
  type SavedVideo,
  type SavedVideoList,
} from '@/features/savedLists/savedVideoLists';
import { buildVideoUrl, type ChannelVideo } from '@/features/videos/channelVideo';
import { formatVideoCount } from '@/features/videos/components/SaveTargetOption';
import { VideoCard, type VideoCardAction } from '@/features/videos/components/VideoCard';
import { colors, spacing } from '@/theme/colors';
import { useCurrentTime } from '@/utils/useCurrentTime';

/** One of the user's lists: its videos, newest saved first, plus rename and delete. */
export default function SavedListScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const { library } = useSavedVideoLists();
  const list = findSavedVideoList(library, listId);

  if (!list) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScreenTopBar title="List not found" />
        <Text style={styles.emptyHint}>This list no longer exists.</Text>
      </SafeAreaView>
    );
  }

  return <SavedListContents list={list} />;
}

function SavedListContents({ list }: { list: SavedVideoList }) {
  const { renameList, deleteList, removeVideoFromList } = useSavedVideoLists();
  const [isRenameSheetVisible, setIsRenameSheetVisible] = useState(false);
  const now = useCurrentTime();

  const openVideo = useCallback((video: ChannelVideo) => {
    Linking.openURL(buildVideoUrl(video.videoId));
  }, []);
  const removeAction = useMemo<VideoCardAction>(
    () => ({
      iconName: 'bookmark-remove-outline',
      label: 'Remove from list',
      onPress: (video) => removeVideoFromList(list.id, video.videoId),
    }),
    [list.id, removeVideoFromList],
  );

  function confirmDelete() {
    Alert.alert(`Delete "${list.name}"?`, 'The videos stay on YouTube; only the list goes.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          router.back();
          deleteList(list.id);
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScreenTopBar title={list.name} subtitle={formatVideoCount(list.videos.length)}>
        <IconButton
          iconName="pencil-outline"
          accessibilityLabel="Rename list"
          onPress={() => setIsRenameSheetVisible(true)}
        />
        <IconButton
          iconName="trash-can-outline"
          color={colors.danger}
          accessibilityLabel="Delete list"
          onPress={confirmDelete}
        />
      </ScreenTopBar>

      <FlashList
        data={list.videos}
        keyExtractor={(video) => video.videoId}
        renderItem={({ item: video }) => (
          <VideoCard
            video={video}
            channel={toChannelSummary(video)}
            now={now}
            onPress={openVideo}
            action={removeAction}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyHint}>
            Nothing saved here yet. Open a channel and tap the save button beside a video.
          </Text>
        }
      />

      <NameSheet
        {...LIST_NAME_FIELD}
        isVisible={isRenameSheetVisible}
        title="Rename list"
        submitLabel="Save"
        initialName={list.name}
        onSubmit={(proposedName) => renameList(list.id, proposedName)}
        onClose={() => setIsRenameSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

function toChannelSummary(video: SavedVideo) {
  return { title: video.channelTitle, thumbnailUrl: video.channelThumbnailUrl };
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: spacing.extraLarge,
  },
  emptyHint: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    padding: spacing.large,
    textAlign: 'center',
  },
});
