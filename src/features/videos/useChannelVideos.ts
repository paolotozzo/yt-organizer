import { useCallback, useState } from 'react';

import { fetchLatestUploadFromFeed } from '@/features/youtube/channelUploadsFeed';
import { YoutubeApiError } from '@/features/youtube/youtubeApiClient';
import { youtubeCacheEntryNames, youtubeCacheMaxAge } from '@/features/youtube/youtubeCachePolicy';
import {
  useCachedYoutubeResource,
  type CachedResourceState,
} from '@/features/youtube/useCachedYoutubeResource';

import { isChannelVideosPage, type ChannelVideo, type ChannelVideosPage } from './channelVideo';
import { fetchChannelVideosPage } from './channelVideosApi';

type UseChannelVideosResult = {
  /** The loaded value holds every page loaded so far. */
  state: CachedResourceState<ChannelVideosPage>;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  /** Error from the last "load more", shown under the list without hiding it. */
  loadMoreErrorMessage: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
};

/**
 * A channel's uploads, newest first. The first page is cached for
 * `youtubeCacheMaxAge.channelVideos`; after that, the channel's free uploads feed is asked
 * first, and the API only when there is a new video. Older pages load on demand and are not
 * cached.
 */
export function useChannelVideos(
  userId: string,
  channelId: string,
  getAccessToken: () => Promise<string>,
): UseChannelVideosResult {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreErrorMessage, setLoadMoreErrorMessage] = useState<string | null>(null);

  const fetchFirstPage = useCallback(
    async () => fetchChannelVideosPage(await getAccessToken(), channelId, null),
    [channelId, getAccessToken],
  );

  const hasNoNewUpload = useCallback(
    (cachedPage: ChannelVideosPage) => hasSameNewestUpload(channelId, cachedPage),
    [channelId],
  );

  const { state, isRefreshing, refresh, updateLoadedValue } = useCachedYoutubeResource({
    userId,
    entryName: youtubeCacheEntryNames.channelVideos(channelId),
    maxAgeMilliseconds: youtubeCacheMaxAge.channelVideos,
    isValidValue: isChannelVideosPage,
    fetchFreshValue: fetchFirstPage,
    fallbackErrorMessage: 'Could not load the videos. Pull down to try again.',
    isCachedValueStillCurrent: hasNoNewUpload,
  });

  const nextPageToken = state.status === 'loaded' ? state.value.nextPageToken : null;

  const loadMore = useCallback(async () => {
    if (!nextPageToken || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    setLoadMoreErrorMessage(null);

    try {
      const nextPage = await fetchChannelVideosPage(
        await getAccessToken(),
        channelId,
        nextPageToken,
      );
      updateLoadedValue((loadedPages) => ({
        videos: appendNewVideos(loadedPages.videos, nextPage.videos),
        nextPageToken: nextPage.nextPageToken,
      }));
    } catch (error) {
      setLoadMoreErrorMessage(
        error instanceof YoutubeApiError ? error.message : 'Could not load more videos.',
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [channelId, getAccessToken, isLoadingMore, nextPageToken, updateLoadedValue]);

  const refreshFirstPage = useCallback(async () => {
    setLoadMoreErrorMessage(null);
    await refresh();
  }, [refresh]);

  return {
    state,
    isRefreshing,
    isLoadingMore,
    loadMoreErrorMessage,
    refresh: refreshFirstPage,
    loadMore,
  };
}

/**
 * Whether the feed's newest video is the one the cached page starts with. View counts and
 * live badges may be slightly old then; pull to refresh brings them up to date.
 */
async function hasSameNewestUpload(
  channelId: string,
  cachedPage: ChannelVideosPage,
): Promise<boolean> {
  try {
    const latestUpload = await fetchLatestUploadFromFeed(channelId);
    return (latestUpload?.videoId ?? null) === (cachedPage.videos[0]?.videoId ?? null);
  } catch (error) {
    console.warn(`Uploads feed failed for channel ${channelId}, asking the API`, error);
    return false;
  }
}

/** Skips videos already listed, which can happen when a channel uploads between pages. */
function appendNewVideos(
  currentVideos: ChannelVideo[],
  nextVideos: ChannelVideo[],
): ChannelVideo[] {
  const listedVideoIds = new Set(currentVideos.map((video) => video.videoId));
  return [...currentVideos, ...nextVideos.filter((video) => !listedVideoIds.has(video.videoId))];
}
