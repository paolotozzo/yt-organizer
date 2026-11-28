import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { IconButton, type IconName } from '@/components/IconButton';
import { formatTimeAgo } from '@/features/sorting/formatRelativeTime';
import type { SubscribedChannel } from '@/features/subscriptions/subscribedChannel';
import type { ChannelVideo } from '@/features/videos/channelVideo';
import { formatCompactCount, formatDuration } from '@/features/videos/videoFormatting';
import { colors, spacing } from '@/theme/colors';

type VideoCardProps = {
  video: ChannelVideo;
  channel: Pick<SubscribedChannel, 'title' | 'thumbnailUrl'>;
  now: number;
  onPress: (video: ChannelVideo) => void;
  /** The button beside the title, e.g. to save the video or to remove it from a list. */
  action: VideoCardAction;
};

export type VideoCardAction = {
  iconName: IconName;
  /** Read out with the video title, e.g. "Save" becomes "Save <title>". */
  label: string;
  onPress: (video: ChannelVideo) => void;
};

const CHANNEL_AVATAR_SIZE = 36;
const THUMBNAIL_ASPECT_RATIO = 16 / 9;

/**
 * Full-width thumbnail with its length, then the title, channel, views and age below, and an
 * action button beside them.
 */
export const VideoCard = memo(function VideoCard({
  video,
  channel,
  now,
  onPress,
  action,
}: VideoCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={video.title}
      accessibilityHint="Opens the video on YouTube"
      onPress={() => onPress(video)}
      style={({ pressed }) => [styles.card, pressed && styles.pressedCard]}
    >
      <View style={styles.thumbnailContainer}>
        {video.thumbnailUrl ? (
          <Image
            source={{ uri: video.thumbnailUrl }}
            style={styles.thumbnail}
            // "high" thumbnails are 4:3 with black bars; covering a 16:9 frame crops them off.
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={video.videoId}
            transition={150}
          />
        ) : null}
        <ThumbnailBadge video={video} />
      </View>

      <View style={styles.details}>
        <Avatar imageUrl={channel.thumbnailUrl} name={channel.title} size={CHANNEL_AVATAR_SIZE} />
        <View style={styles.texts}>
          <Text style={styles.title} numberOfLines={2}>
            {video.title}
          </Text>
          <VideoMetadata video={video} channelTitle={channel.title} now={now} />
        </View>
        <IconButton
          iconName={action.iconName}
          color={colors.textSecondary}
          accessibilityLabel={`${action.label} ${video.title}`}
          onPress={() => action.onPress(video)}
          style={styles.saveButton}
        />
      </View>
    </Pressable>
  );
});

function ThumbnailBadge({ video }: { video: ChannelVideo }) {
  if (video.liveStatus === 'live') {
    return (
      <View style={[styles.badge, styles.liveBadge]}>
        <Text style={styles.badgeText}>LIVE</Text>
      </View>
    );
  }

  if (video.liveStatus === 'upcoming') {
    return (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>UPCOMING</Text>
      </View>
    );
  }

  if (video.durationSeconds === null) {
    return null;
  }

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{formatDuration(video.durationSeconds)}</Text>
    </View>
  );
}

type VideoMetadataProps = {
  video: ChannelVideo;
  channelTitle: string;
  now: number;
};

function VideoMetadata({ video, channelTitle, now }: VideoMetadataProps) {
  return (
    <View style={styles.metadata}>
      <Text style={styles.metadataText} numberOfLines={1}>
        {channelTitle}
      </Text>
      {video.viewCount !== null ? (
        <View style={styles.viewCount} accessibilityLabel={`${video.viewCount} views`} accessible>
          <MaterialCommunityIcons name="play-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.metadataText}>{formatCompactCount(video.viewCount)}</Text>
        </View>
      ) : null}
      <Text style={styles.metadataText}>{formatTimeAgo(video.publishedAt, now)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.large,
  },
  pressedCard: {
    opacity: 0.8,
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: THUMBNAIL_ASPECT_RATIO,
    backgroundColor: colors.surface,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    right: spacing.small,
    bottom: spacing.small,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  liveBadge: {
    backgroundColor: colors.accent,
  },
  badgeText: {
    color: colors.onAccent,
    fontSize: 12,
    fontWeight: '700',
  },
  details: {
    flexDirection: 'row',
    gap: spacing.medium,
    paddingTop: spacing.medium,
    paddingLeft: spacing.medium,
  },
  saveButton: {
    // Lines the icon up with the first line of the title.
    marginTop: -spacing.small,
  },
  texts: {
    flex: 1,
    gap: spacing.extraSmall,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 21,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  metadataText: {
    flexShrink: 1,
    color: colors.textSecondary,
    fontSize: 13,
  },
  viewCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
