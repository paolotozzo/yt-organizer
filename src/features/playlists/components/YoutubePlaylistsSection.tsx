import { useCallback } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { useAuth } from '@/features/auth/AuthProvider';
import { useSaveToPlaylists } from '@/features/playlists/useSaveToPlaylists';
import { useUserPlaylists } from '@/features/playlists/useUserPlaylists';
import type { UserPlaylist } from '@/features/playlists/userPlaylist';
import { SaveTargetOption, formatVideoCount } from '@/features/videos/components/SaveTargetOption';
import { saveSheetStyles } from '@/features/videos/components/saveSheetStyles';
import { colors } from '@/theme/colors';

/** The user's YouTube playlists in the save sheet. Each save costs 50 quota units. */
export function YoutubePlaylistsSection({ videoId }: { videoId: string }) {
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
    videoId,
    getAccessToken,
    countSavedVideo,
  );

  return (
    <View style={saveSheetStyles.section}>
      <Text style={saveSheetStyles.sectionTitle}>YouTube playlists</Text>
      {errorMessage ? <Text style={saveSheetStyles.error}>{errorMessage}</Text> : null}
      {playlists.state.status === 'loading' ? (
        <ActivityIndicator color={colors.accent} style={saveSheetStyles.loading} />
      ) : playlists.state.status === 'failed' ? (
        <Text style={saveSheetStyles.error}>{playlists.state.errorMessage}</Text>
      ) : playlists.state.value.length === 0 ? (
        <Text style={saveSheetStyles.note}>You have no YouTube playlists.</Text>
      ) : (
        playlists.state.value.map((playlist) => (
          <SaveTargetOption
            key={playlist.playlistId}
            // A generic icon: YouTube's logo may only be used as its branding rules allow.
            iconName={playlist.privacyStatus === 'private' ? 'lock-outline' : 'playlist-play'}
            title={playlist.title}
            details={describePlaylist(playlist)}
            status={saveStatusByPlaylistId.get(playlist.playlistId) ?? 'notSaved'}
            onPress={() => saveToPlaylist(playlist.playlistId)}
          />
        ))
      )}
    </View>
  );
}

function describePlaylist(playlist: UserPlaylist): string {
  const videoCount = formatVideoCount(playlist.itemCount);

  return playlist.privacyStatus === 'public'
    ? videoCount
    : `${videoCount} · ${playlist.privacyStatus}`;
}
