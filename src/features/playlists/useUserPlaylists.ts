import { useCallback } from 'react';

import { useCachedYoutubeResource } from '@/features/youtube/useCachedYoutubeResource';
import { youtubeCacheEntryNames, youtubeCacheMaxAge } from '@/features/youtube/youtubeCachePolicy';

import { fetchAllUserPlaylists } from './playlistsApi';
import { isUserPlaylistList } from './userPlaylist';

/** The user's own playlists, from the cache when it is recent enough. */
export function useUserPlaylists(userId: string, getAccessToken: () => Promise<string>) {
  const fetchFreshPlaylists = useCallback(
    async () => fetchAllUserPlaylists(await getAccessToken()),
    [getAccessToken],
  );

  return useCachedYoutubeResource({
    userId,
    entryName: youtubeCacheEntryNames.playlists,
    maxAgeMilliseconds: youtubeCacheMaxAge.playlists,
    isValidValue: isUserPlaylistList,
    fetchFreshValue: fetchFreshPlaylists,
    fallbackErrorMessage: 'Could not load your playlists.',
  });
}
