import { fetchLatestUploadFromFeed } from '@/features/youtube/channelUploadsFeed';
import { fetchYoutubeResource, YoutubeApiError } from '@/features/youtube/youtubeApiClient';
import { getUploadsPlaylistId } from '@/features/youtube/uploadsPlaylist';
import { mapWithConcurrency } from '@/utils/mapWithConcurrency';

import type { LatestUploadCache } from './latestUploadCache';

/** Parallel requests while checking many channels; keeps the phone and YouTube comfortable. */
const CONCURRENT_REQUEST_LIMIT = 8;

type PlaylistItemListResponse = {
  items?: { contentDetails?: { videoPublishedAt?: string } }[];
};

/**
 * Publish time of the channel's newest upload, or null when it has none. Reads the free
 * uploads feed first and only spends a quota unit on the Data API when the feed fails.
 */
export async function fetchLatestUploadTime(
  accessToken: string,
  channelId: string,
): Promise<number | null> {
  try {
    return (await fetchLatestUploadFromFeed(channelId))?.publishedAt ?? null;
  } catch (feedError) {
    console.warn(`Uploads feed failed for channel ${channelId}, asking the API`, feedError);
    return fetchLatestUploadTimeFromApi(accessToken, channelId);
  }
}

/** The same answer from the uploads playlist, at 1 quota unit per channel. */
async function fetchLatestUploadTimeFromApi(
  accessToken: string,
  channelId: string,
): Promise<number | null> {
  const uploadsPlaylistId = getUploadsPlaylistId(channelId);

  if (!uploadsPlaylistId) {
    return null;
  }

  try {
    const response = await fetchYoutubeResource<PlaylistItemListResponse>(
      accessToken,
      'playlistItems',
      { part: 'contentDetails', playlistId: uploadsPlaylistId, maxResults: '1' },
    );
    const publishedAt = response.items?.[0]?.contentDetails?.videoPublishedAt;
    const publishedTime = publishedAt ? Date.parse(publishedAt) : Number.NaN;

    return Number.isNaN(publishedTime) ? null : publishedTime;
  } catch (error) {
    // Channels without any public upload have no uploads playlist.
    if (error instanceof YoutubeApiError && error.httpStatus === 404) {
      return null;
    }

    throw error;
  }
}

export type LatestUploadsCheckResult = {
  freshChecks: LatestUploadCache;
  /** Set when a quota or session error stopped the run early. The checks so far are kept. */
  stoppedBecause: YoutubeApiError | null;
};

/**
 * Checks the latest upload of every given channel. A failure on one channel only skips that
 * channel, except quota and session errors, which stop the whole run.
 */
export async function checkLatestUploads(
  accessToken: string,
  channelIds: readonly string[],
  onProgress: (checkedCount: number) => void,
): Promise<LatestUploadsCheckResult> {
  const freshChecks: LatestUploadCache = {};
  let stoppingError: YoutubeApiError | null = null;

  await mapWithConcurrency(
    channelIds,
    CONCURRENT_REQUEST_LIMIT,
    async (channelId) => {
      if (stoppingError) {
        return;
      }

      try {
        const latestUploadAt = await fetchLatestUploadTime(accessToken, channelId);
        freshChecks[channelId] = { checkedAt: Date.now(), latestUploadAt };
      } catch (error) {
        if (isStoppingError(error)) {
          stoppingError = error;
        } else {
          console.warn(`Could not check the latest upload of channel ${channelId}`, error);
        }
      }
    },
    onProgress,
  );

  return { freshChecks, stoppedBecause: stoppingError };
}

function isStoppingError(error: unknown): error is YoutubeApiError {
  return (
    error instanceof YoutubeApiError &&
    (error.httpStatus === 401 ||
      error.reason === 'quotaExceeded' ||
      error.reason === 'dailyLimitExceeded')
  );
}
