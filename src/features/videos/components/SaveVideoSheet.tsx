import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { NameForm, type NameValidationResult } from '@/components/NameForm';
import { YoutubePlaylistsSection } from '@/features/playlists/components/YoutubePlaylistsSection';
import { SavedListsSection } from '@/features/savedLists/components/SavedListsSection';
import {
  useSavedVideoLists,
  type VideoChannel,
} from '@/features/savedLists/SavedVideoListsProvider';
import { LIST_NAME_FIELD } from '@/features/savedLists/savedVideoLists';
import type { ChannelVideo } from '@/features/videos/channelVideo';
import { colors, spacing } from '@/theme/colors';

type SaveVideoSheetProps = {
  /** The video to save; the sheet is hidden while this is null. */
  video: ChannelVideo | null;
  channel: VideoChannel;
  onClose: () => void;
};

/** Saves a video to the user's own lists (free) or to their YouTube playlists. */
export function SaveVideoSheet({ video, channel, onClose }: SaveVideoSheetProps) {
  const [isCreatingList, setIsCreatingList] = useState(false);

  function close() {
    setIsCreatingList(false);
    onClose();
  }

  return (
    <BottomSheet
      isVisible={video !== null}
      title={isCreatingList ? 'New list' : 'Save video'}
      onClose={close}
    >
      {/* Mounted only while visible, so playlists load on demand and each video starts fresh. */}
      {video && isCreatingList ? (
        <NewListForm video={video} channel={channel} onDone={() => setIsCreatingList(false)} />
      ) : video ? (
        <ScrollView key={video.videoId} contentContainerStyle={styles.content}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {video.title}
          </Text>
          <SavedListsSection
            video={video}
            channel={channel}
            onCreateList={() => setIsCreatingList(true)}
          />
          <YoutubePlaylistsSection videoId={video.videoId} />
        </ScrollView>
      ) : null}
    </BottomSheet>
  );
}

type NewListFormProps = {
  video: ChannelVideo;
  channel: VideoChannel;
  onDone: () => void;
};

/** Names a new list and saves the video into it straight away. */
function NewListForm({ video, channel, onDone }: NewListFormProps) {
  const { createList, addVideoToList } = useSavedVideoLists();

  function createListWithVideo(proposedName: string): NameValidationResult {
    const result = createList(proposedName);

    if (result.isValid && result.listId) {
      addVideoToList(result.listId, video, channel);
      onDone();
    }

    return result;
  }

  return (
    <NameForm
      {...LIST_NAME_FIELD}
      submitLabel="Create and save"
      onSubmit={createListWithVideo}
      onCancel={onDone}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.small,
  },
  videoTitle: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
