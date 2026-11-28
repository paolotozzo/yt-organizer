import { FlashList } from '@shopify/flash-list';
import * as Linking from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { ScreenTopBar } from '@/components/ScreenTopBar';
import { StatusView } from '@/components/StatusView';
import { useAuth } from '@/features/auth/AuthProvider';
import { findFolder } from '@/features/folders/folderLibrary';
import { useChannelInbox } from '@/features/inbox/ChannelInboxProvider';
import { SaveVideoSheet } from '@/features/playlists/components/SaveVideoSheet';
import type { SubscribedChannel } from '@/features/subscriptions/subscribedChannel';
import { buildVideoUrl, type ChannelVideo } from '@/features/videos/channelVideo';
import { VideoCard } from '@/features/videos/components/VideoCard';
import { useChannelVideos } from '@/features/videos/useChannelVideos';
import { colors, spacing } from '@/theme/colors';
import { useCurrentTime } from '@/utils/useCurrentTime';

const TOP_BAR_AVATAR_SIZE = 32;

/**
 * A channel's uploads, newest first. Tapping a video opens it in the YouTube app; its save
 * button adds it to a playlist.
 */
export default function ChannelVideosScreen() {
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const { session, getAccessToken } = useAuth();
  const { subscribedChannels, library } = useChannelInbox();
  const channel = subscribedChannels.find((candidate) => candidate.channelId === channelId);
  const folderId = library.folderIdByChannelId[channelId];
  const folderName = folderId ? findFolder(library, folderId)?.name : undefined;

  const videos = useChannelVideos(session?.user.id ?? '', channelId, getAccessToken);
  const now = useCurrentTime();
  const channelTitle = channel?.title ?? 'Channel';
  const channelThumbnailUrl = channel?.thumbnailUrl ?? null;
  const channelSummary = useMemo(
    () => ({ title: channelTitle, thumbnailUrl: channelThumbnailUrl }),
    [channelTitle, channelThumbnailUrl],
  );

  const [videoToSave, setVideoToSave] = useState<ChannelVideo | null>(null);

  const openVideo = useCallback((video: ChannelVideo) => {
    Linking.openURL(buildVideoUrl(video.videoId));
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScreenTopBar
        title={channelSummary.title}
        subtitle={folderName ? `in ${folderName}` : 'Not in a folder'}
        leading={<ChannelAvatar channel={channel} />}
      />

      {videos.state.status === 'loading' ? (
        <StatusView status="loading" message="Loading videos…" />
      ) : videos.state.status === 'failed' ? (
        <StatusView
          status="failed"
          errorMessage={videos.state.errorMessage}
          onRetry={videos.refresh}
        />
      ) : (
        <FlashList
          data={videos.state.value.videos}
          keyExtractor={(video) => video.videoId}
          renderItem={({ item: video }) => (
            <VideoCard
              video={video}
              channel={channelSummary}
              now={now}
              onPress={openVideo}
              onSavePress={setVideoToSave}
            />
          )}
          onEndReached={videos.loadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={videos.isRefreshing}
              onRefresh={videos.refresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
              progressBackgroundColor={colors.surface}
            />
          }
          ListEmptyComponent={
            <Text style={styles.hint}>This channel has no public videos yet.</Text>
          }
          ListFooterComponent={
            <ListFooter
              isLoadingMore={videos.isLoadingMore}
              errorMessage={videos.loadMoreErrorMessage}
            />
          }
        />
      )}

      <SaveVideoSheet video={videoToSave} onClose={() => setVideoToSave(null)} />
    </SafeAreaView>
  );
}

function ChannelAvatar({ channel }: { channel: SubscribedChannel | undefined }) {
  if (!channel) {
    return null;
  }

  return <Avatar imageUrl={channel.thumbnailUrl} name={channel.title} size={TOP_BAR_AVATAR_SIZE} />;
}

function ListFooter({
  isLoadingMore,
  errorMessage,
}: {
  isLoadingMore: boolean;
  errorMessage: string | null;
}) {
  if (isLoadingMore) {
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return errorMessage ? <Text style={styles.footerError}>{errorMessage}</Text> : null;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: spacing.extraLarge,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 14,
    padding: spacing.large,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: spacing.large,
  },
  footerError: {
    color: colors.warning,
    fontSize: 13,
    padding: spacing.large,
    textAlign: 'center',
  },
});
