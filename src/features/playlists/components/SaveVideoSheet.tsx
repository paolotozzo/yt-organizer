import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { useAuth } from '@/features/auth/AuthProvider';
import type { UserPlaylist } from '@/features/playlists/userPlaylist';
import {
  useSaveToPlaylists,
  type PlaylistSaveStatus,
} from '@/features/playlists/useSaveToPlaylists';
import { useUserPlaylists } from '@/features/playlists/useUserPlaylists';
import type { ChannelVideo } from '@/features/videos/channelVideo';
import { colors, spacing } from '@/theme/colors';

type SaveVideoSheetProps = {
  /** The video to save; the sheet is hidden while this is null. */
  video: ChannelVideo | null;
  onClose: () => void;
};

/** Saves a video to one or more of the user's playlists. */
export function SaveVideoSheet({ video, onClose }: SaveVideoSheetProps) {
  return (
    <BottomSheet isVisible={video !== null} title="Save video" onClose={onClose}>
      {/* Mounted only while visible, so playlists load on demand and each video starts fresh. */}
      {video ? <SaveVideoOptions key={video.videoId} video={video} /> : null}
    </BottomSheet>
  );
}

function SaveVideoOptions({ video }: { video: ChannelVideo }) {
  const { session, getAccessToken } = useAuth();
  const playlists = useUserPlaylists(session?.user.id ?? '', getAccessToken);
  const { updateLoadedValue } = playlists;

  const countSavedVideo = useCallback(
    (savedPlaylistId: string) =>
      updateLoadedValue((currentPlaylists) =>
        currentPlaylists.map((playlist) =>
          playlist.playlistId === savedPlaylistId
            ? { ...playlist, itemCount: playlist.itemCount + 1 }
            : playlist,
        ),
      ),
    [updateLoadedValue],
  );
  const { saveStatusByPlaylistId, errorMessage, saveToPlaylist } = useSaveToPlaylists(
    video.videoId,
    getAccessToken,
    countSavedVideo,
  );

  return (
    <View style={styles.content}>
      <Text style={styles.videoTitle} numberOfLines={2}>
        {video.title}
      </Text>
      <Text style={styles.sectionTitle}>Your playlists</Text>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      {playlists.state.status === 'loading' ? (
        <ActivityIndicator color={colors.accent} style={styles.loading} />
      ) : playlists.state.status === 'failed' ? (
        <Text style={styles.error}>{playlists.state.errorMessage}</Text>
      ) : playlists.state.value.length === 0 ? (
        <Text style={styles.note}>You have no playlists yet. Create one in YouTube first.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.playlists}>
          {playlists.state.value.map((playlist) => (
            <PlaylistOption
              key={playlist.playlistId}
              playlist={playlist}
              saveStatus={saveStatusByPlaylistId.get(playlist.playlistId)}
              onPress={saveToPlaylist}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

type PlaylistOptionProps = {
  playlist: UserPlaylist;
  saveStatus: PlaylistSaveStatus | undefined;
  onPress: (playlistId: string) => void;
};

function PlaylistOption({ playlist, saveStatus, onPress }: PlaylistOptionProps) {
  const videoCount = playlist.itemCount === 1 ? '1 video' : `${playlist.itemCount} videos`;
  const privacyLabel = playlist.privacyStatus === 'public' ? '' : ` · ${playlist.privacyStatus}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Save to ${playlist.title}`}
      accessibilityState={{ disabled: saveStatus !== undefined }}
      disabled={saveStatus !== undefined}
      onPress={() => onPress(playlist.playlistId)}
      style={({ pressed }) => [styles.playlistOption, pressed && styles.pressedOption]}
    >
      <MaterialCommunityIcons
        name={playlist.privacyStatus === 'private' ? 'lock-outline' : 'playlist-play'}
        size={22}
        color={colors.textPrimary}
      />
      <View style={styles.playlistTexts}>
        <Text style={styles.playlistTitle} numberOfLines={1}>
          {playlist.title}
        </Text>
        <Text style={styles.playlistDetails}>
          {videoCount}
          {privacyLabel}
        </Text>
      </View>
      <SaveStatusIndicator saveStatus={saveStatus} />
    </Pressable>
  );
}

function SaveStatusIndicator({ saveStatus }: { saveStatus: PlaylistSaveStatus | undefined }) {
  if (saveStatus === 'saving') {
    return <ActivityIndicator size="small" color={colors.accent} />;
  }

  if (saveStatus === 'saved') {
    return (
      <View style={styles.savedLabel} accessibilityLabel="Saved">
        <MaterialCommunityIcons name="check" size={18} color={colors.accent} />
        <Text style={styles.savedText}>Saved</Text>
      </View>
    );
  }

  return <MaterialCommunityIcons name="plus" size={22} color={colors.textSecondary} />;
}

const styles = StyleSheet.create({
  content: {
    flexShrink: 1,
    gap: spacing.small,
  },
  videoTitle: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  note: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: spacing.medium,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: spacing.small,
    paddingHorizontal: spacing.medium,
  },
  loading: {
    paddingVertical: spacing.large,
  },
  error: {
    color: colors.warning,
    fontSize: 13,
    paddingHorizontal: spacing.medium,
  },
  playlists: {
    gap: spacing.extraSmall,
  },
  playlistOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    minHeight: 56,
    paddingHorizontal: spacing.medium,
    borderRadius: 12,
  },
  pressedOption: {
    backgroundColor: colors.surfaceBorder,
  },
  playlistTexts: {
    flex: 1,
    gap: 2,
  },
  playlistTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  playlistDetails: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  savedLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  savedText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
});
