import { fetchYoutubeResource, insertYoutubeResource } from '@/features/youtube/youtubeApiClient';

import type { UserPlaylist } from './userPlaylist';

/** The largest page size playlists.list allows. */
const MAX_RESULTS_PER_PAGE = 50;

/** Stops a misbehaving API from paginating forever (20 pages = 1,000 playlists). */
const MAX_PAGE_COUNT = 20;

type PlaylistResource = {
  id?: string;
  snippet?: { title?: string };
  contentDetails?: { itemCount?: number };
  status?: { privacyStatus?: string };
};

type PlaylistListResponse = {
  items?: PlaylistResource[];
  nextPageToken?: string;
};

/**
 * Every playlist the signed-in user owns, in YouTube's order (newest first). Watch later is
 * not among them: YouTube stopped exposing it to apps. Costs one quota unit per 50 playlists.
 */
export async function fetchAllUserPlaylists(accessToken: string): Promise<UserPlaylist[]> {
  const playlists: UserPlaylist[] = [];
  let pageToken: string | undefined;
  let pageCount = 0;

  do {
    const page = await fetchYoutubeResource<PlaylistListResponse>(accessToken, 'playlists', {
      part: 'snippet,contentDetails,status',
      mine: 'true',
      maxResults: String(MAX_RESULTS_PER_PAGE),
      ...(pageToken ? { pageToken } : {}),
    });

    for (const resource of page.items ?? []) {
      const playlist = toUserPlaylist(resource);

      if (playlist) {
        playlists.push(playlist);
      }
    }

    pageToken = page.nextPageToken;
    pageCount += 1;
  } while (pageToken && pageCount < MAX_PAGE_COUNT);

  return playlists;
}

/** Appends the video to the end of the playlist. Costs 50 quota units. */
export async function addVideoToPlaylist(
  accessToken: string,
  playlistId: string,
  videoId: string,
): Promise<void> {
  await insertYoutubeResource(
    accessToken,
    'playlistItems',
    { part: 'snippet' },
    { snippet: { playlistId, resourceId: { kind: 'youtube#video', videoId } } },
  );
}

function toUserPlaylist(resource: PlaylistResource): UserPlaylist | null {
  if (!resource.id) {
    return null;
  }

  return {
    playlistId: resource.id,
    title: resource.snippet?.title || 'Untitled playlist',
    itemCount: resource.contentDetails?.itemCount ?? 0,
    privacyStatus: toPrivacyStatus(resource.status?.privacyStatus),
  };
}

function toPrivacyStatus(privacyStatus: string | undefined): UserPlaylist['privacyStatus'] {
  return privacyStatus === 'public' || privacyStatus === 'unlisted' ? privacyStatus : 'private';
}
