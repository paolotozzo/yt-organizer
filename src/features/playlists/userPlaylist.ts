/** A playlist the signed-in user owns on YouTube. */
export type UserPlaylist = {
  playlistId: string;
  title: string;
  itemCount: number;
  privacyStatus: 'public' | 'unlisted' | 'private';
};

/** Checks data read back from the cache before trusting it as a playlist list. */
export function isUserPlaylistList(value: unknown): value is UserPlaylist[] {
  return Array.isArray(value) && value.every(isUserPlaylist);
}

function isUserPlaylist(value: unknown): value is UserPlaylist {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.playlistId === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.itemCount === 'number' &&
    (candidate.privacyStatus === 'public' ||
      candidate.privacyStatus === 'unlisted' ||
      candidate.privacyStatus === 'private')
  );
}
