import { useCallback, useState } from 'react';

import { YoutubeApiError } from '@/features/youtube/youtubeApiClient';

import { addVideoToPlaylist } from './playlistsApi';

export type PlaylistSaveStatus = 'saving' | 'saved';

type SaveToPlaylists = {
  saveStatusByPlaylistId: ReadonlyMap<string, PlaylistSaveStatus>;
  errorMessage: string | null;
  /** Adds the video to the playlist, unless it is being or has been added already. */
  saveToPlaylist: (playlistId: string) => Promise<void>;
};

/**
 * Adds one video to the user's playlists, remembering which ones it went into so a second tap
 * doesn't add it twice. YouTube itself would happily keep duplicates.
 */
export function useSaveToPlaylists(
  videoId: string,
  getAccessToken: () => Promise<string>,
  onSaved: (playlistId: string) => void,
): SaveToPlaylists {
  const [saveStatusByPlaylistId, setSaveStatusByPlaylistId] = useState<
    ReadonlyMap<string, PlaylistSaveStatus>
  >(new Map());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setSaveStatus = useCallback((playlistId: string, status: PlaylistSaveStatus | null) => {
    setSaveStatusByPlaylistId((currentStatuses) => {
      const nextStatuses = new Map(currentStatuses);

      if (status) {
        nextStatuses.set(playlistId, status);
      } else {
        nextStatuses.delete(playlistId);
      }

      return nextStatuses;
    });
  }, []);

  const saveToPlaylist = useCallback(
    async (playlistId: string) => {
      if (saveStatusByPlaylistId.has(playlistId)) {
        return;
      }

      setErrorMessage(null);
      setSaveStatus(playlistId, 'saving');

      try {
        await addVideoToPlaylist(await getAccessToken(), playlistId, videoId);
        setSaveStatus(playlistId, 'saved');
        onSaved(playlistId);
      } catch (error) {
        setSaveStatus(playlistId, null);
        setErrorMessage(
          error instanceof YoutubeApiError ? error.message : 'Could not save the video. Try again.',
        );
        console.warn('Could not add the video to a playlist', error);
      }
    },
    [getAccessToken, onSaved, saveStatusByPlaylistId, setSaveStatus, videoId],
  );

  return { saveStatusByPlaylistId, errorMessage, saveToPlaylist };
}
