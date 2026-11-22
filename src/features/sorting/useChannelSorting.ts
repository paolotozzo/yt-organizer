import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { SubscribedChannel } from '@/features/subscriptions/subscribedChannel';
import { fetchAllSubscribedChannels } from '@/features/subscriptions/youtubeSubscriptionsApi';
import { YoutubeApiError } from '@/features/youtube/youtubeApiClient';
import { youtubeCacheEntryNames, youtubeCacheMaxAge } from '@/features/youtube/youtubeCachePolicy';
import {
  loadThroughCache,
  readCachedEntry,
  writeCachedEntry,
} from '@/features/youtube/youtubeDataCache';

import {
  buildRankByChannelId,
  sortChannels,
  type ChannelSortData,
  type ChannelSortOrder,
  type RankedSortOrder,
} from './channelSorting';
import {
  findChannelsNeedingCheck,
  isLatestUploadCache,
  updateLatestUploadCache,
  type LatestUploadCache,
} from './latestUploadCache';
import { checkLatestUploads } from './latestUploadsApi';
import { loadSortOrder, saveSortOrder } from './sortingStorage';

const DEFAULT_SORT_ORDER: ChannelSortOrder = 'relevance';


export type SortProgress =
  | { status: 'idle' }
  | { status: 'loadingRanking' }
  | { status: 'checkingUploads'; checkedCount: number; totalCount: number };

export type ChannelSorting = {
  sortOrder: ChannelSortOrder;
  setSortOrder: (sortOrder: ChannelSortOrder) => void;
  /** The subscribed channels in the chosen order. */
  sortedChannels: SubscribedChannel[];
  latestUploadAtByChannelId: ReadonlyMap<string, number | null>;
  progress: SortProgress;
  /** Why the last ranking or upload check failed, if it did. */
  errorMessage: string | null;
  /**
   * Reloads YouTube's rankings and re-checks recent uploads. With `discardCachedData`, also
   * forgets every latest upload already checked (after the cache was cleared).
   */
  refreshSortData: (options?: { discardCachedData?: boolean }) => void;
};

type RankByChannelIdByOrder = ChannelSortData['rankByChannelIdByOrder'];

/**
 * Sorts the subscriptions in the order the user picked, and loads the data that order needs
 * only when it is picked: YouTube's ranking for "relevance" and "unread", and each channel's
 * newest upload (cached on the device) for "latest upload".
 */
export function useChannelSorting(
  userId: string,
  getAccessToken: () => Promise<string>,
  subscribedChannels: SubscribedChannel[],
): ChannelSorting {
  const [sortOrder, setSortOrderState] = useState<ChannelSortOrder>(DEFAULT_SORT_ORDER);
  const [rankByChannelIdByOrder, setRankByChannelIdByOrder] = useState<RankByChannelIdByOrder>({});
  const [latestUploadCache, setLatestUploadCache] = useState<LatestUploadCache | null>(null);
  const [progress, setProgress] = useState<SortProgress>({ status: 'idle' });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [latestUploadMaxAge, setLatestUploadMaxAge] = useState<number>(
    youtubeCacheMaxAge.latestUploads,
  );
  const isLoadingSortDataRef = useRef(false);
  /** Rankings to fetch from YouTube even if cached, set by a pull to refresh. */
  const rankingsToRefetchRef = useRef(new Set<RankedSortOrder>());

  useStoredSortPreferences(userId, setSortOrderState, setLatestUploadCache);

  const setSortOrder = useCallback(
    (nextSortOrder: ChannelSortOrder) => {
      setSortOrderState(nextSortOrder);
      setErrorMessage(null);
      saveSortOrder(userId, nextSortOrder).catch((error: unknown) =>
        console.warn('Could not save the sort order', error),
      );
    },
    [userId],
  );

  useEffect(() => {
    // The stored cache arrives together with the stored sort order, so this also waits for
    // the user's saved choice instead of loading data for the default one.
    const arePreferencesRestored = latestUploadCache !== null;

    if (
      !arePreferencesRestored ||
      subscribedChannels.length === 0 ||
      isLoadingSortDataRef.current ||
      errorMessage
    ) {
      return;
    }

    const loadSortData = async () => {
      isLoadingSortDataRef.current = true;

      try {
        if (isRankedSortOrder(sortOrder) && !rankByChannelIdByOrder[sortOrder]) {
          setProgress({ status: 'loadingRanking' });
          const forceRefresh = rankingsToRefetchRef.current.delete(sortOrder);
          const rankByChannelId = await loadRanking(userId, getAccessToken, sortOrder, forceRefresh);
          setRankByChannelIdByOrder((current) => ({ ...current, [sortOrder]: rankByChannelId }));
        }

        if (sortOrder === 'latestUpload') {
          const channelIdsToCheck = findChannelsNeedingCheck(
            latestUploadCache,
            subscribedChannels.map((channel) => channel.channelId),
            Date.now(),
            latestUploadMaxAge,
          );

          if (channelIdsToCheck.length > 0) {
            const updatedCache = await refreshLatestUploads(
              getAccessToken,
              latestUploadCache,
              channelIdsToCheck,
              subscribedChannels,
              setProgress,
            );
            setLatestUploadCache(updatedCache.cache);
            writeCachedEntry(userId, youtubeCacheEntryNames.latestUploads, updatedCache.cache);

            if (updatedCache.stoppedBecause) {
              setErrorMessage(updatedCache.stoppedBecause.message);
            }
          }

          setLatestUploadMaxAge(youtubeCacheMaxAge.latestUploads);
        }
      } catch (error) {
        setErrorMessage(describeError(error));
        console.warn('Could not load the data to sort channels', error);
      } finally {
        isLoadingSortDataRef.current = false;
        setProgress({ status: 'idle' });
      }
    };

    loadSortData();
  }, [
    progress.status,
    errorMessage,
    getAccessToken,
    latestUploadCache,
    latestUploadMaxAge,
    rankByChannelIdByOrder,
    sortOrder,
    subscribedChannels,
    userId,
  ]);

  const refreshSortData = useCallback((options?: { discardCachedData?: boolean }) => {
    rankingsToRefetchRef.current = new Set(['relevance', 'unread']);
    setRankByChannelIdByOrder({});
    setErrorMessage(null);

    if (options?.discardCachedData) {
      setLatestUploadCache({});
      setLatestUploadMaxAge(youtubeCacheMaxAge.latestUploads);
    } else {
      setLatestUploadMaxAge(youtubeCacheMaxAge.latestUploadsOnRefresh);
    }
  }, []);

  const latestUploadAtByChannelId = useMemo(
    () =>
      new Map(
        Object.entries(latestUploadCache ?? {}).map(([channelId, check]) => [
          channelId,
          check.latestUploadAt,
        ]),
      ),
    [latestUploadCache],
  );

  const sortedChannels = useMemo(
    () =>
      sortChannels(subscribedChannels, sortOrder, {
        rankByChannelIdByOrder,
        latestUploadAtByChannelId,
      }),
    [subscribedChannels, sortOrder, rankByChannelIdByOrder, latestUploadAtByChannelId],
  );

  return useMemo(
    () => ({
      sortOrder,
      setSortOrder,
      sortedChannels,
      latestUploadAtByChannelId,
      progress,
      errorMessage,
      refreshSortData,
    }),
    [
      sortOrder,
      setSortOrder,
      sortedChannels,
      latestUploadAtByChannelId,
      progress,
      errorMessage,
      refreshSortData,
    ],
  );
}

function useStoredSortPreferences(
  userId: string,
  onSortOrderLoaded: (sortOrder: ChannelSortOrder) => void,
  onLatestUploadCacheLoaded: (cache: LatestUploadCache) => void,
) {
  useEffect(() => {
    let isMounted = true;

    async function restorePreferences() {
      const [storedSortOrder, storedCache] = await Promise.all([
        loadSortOrder(userId).catch(() => null),
        readCachedEntry(userId, youtubeCacheEntryNames.latestUploads, isLatestUploadCache).then(
          (entry) => entry?.value ?? {},
        ),
      ]);

      if (isMounted) {
        if (storedSortOrder) {
          onSortOrderLoaded(storedSortOrder);
        }

        onLatestUploadCacheLoaded(storedCache);
      }
    }

    restorePreferences();

    return () => {
      isMounted = false;
    };
  }, [userId, onSortOrderLoaded, onLatestUploadCacheLoaded]);
}

function isRankedSortOrder(sortOrder: ChannelSortOrder): sortOrder is RankedSortOrder {
  return sortOrder === 'relevance' || sortOrder === 'unread';
}

/** YouTube's order for `sortOrder`, cached as the list of channel ids in that order. */
async function loadRanking(
  userId: string,
  getAccessToken: () => Promise<string>,
  sortOrder: RankedSortOrder,
  forceRefresh: boolean,
): Promise<Map<string, number>> {
  const channelIdsInApiOrder = await loadThroughCache({
    userId,
    entryName: youtubeCacheEntryNames.subscriptionRanking(sortOrder),
    maxAgeMilliseconds: youtubeCacheMaxAge.subscriptionRankings,
    forceRefresh,
    isValidValue: isStringList,
    fetchFreshValue: async () => {
      const accessToken = await getAccessToken();
      const channelsInApiOrder = await fetchAllSubscribedChannels(accessToken, sortOrder);
      return channelsInApiOrder.map((channel) => channel.channelId);
    },
  });

  return buildRankByChannelId(channelIdsInApiOrder);
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

async function refreshLatestUploads(
  getAccessToken: () => Promise<string>,
  currentCache: LatestUploadCache,
  channelIdsToCheck: string[],
  subscribedChannels: SubscribedChannel[],
  onProgress: (progress: SortProgress) => void,
): Promise<{ cache: LatestUploadCache; stoppedBecause: YoutubeApiError | null }> {
  const totalCount = channelIdsToCheck.length;
  onProgress({ status: 'checkingUploads', checkedCount: 0, totalCount });

  const accessToken = await getAccessToken();
  const { freshChecks, stoppedBecause } = await checkLatestUploads(
    accessToken,
    channelIdsToCheck,
    (checkedCount) => onProgress({ status: 'checkingUploads', checkedCount, totalCount }),
  );
  const subscribedChannelIds = new Set(subscribedChannels.map((channel) => channel.channelId));
  const checks = stoppedBecause
    ? freshChecks
    : { ...markAsChecked(currentCache, channelIdsToCheck), ...freshChecks };

  return {
    cache: updateLatestUploadCache(currentCache, checks, subscribedChannelIds),
    stoppedBecause,
  };
}

/**
 * Channels whose check failed keep their previous value but count as checked, so they are
 * retried at the next expiry instead of in an endless loop.
 */
function markAsChecked(cache: LatestUploadCache, channelIds: string[]): LatestUploadCache {
  const checkedAt = Date.now();

  return Object.fromEntries(
    channelIds.map((channelId) => [
      channelId,
      { checkedAt, latestUploadAt: cache[channelId]?.latestUploadAt ?? null },
    ]),
  );
}

function describeError(error: unknown): string {
  if (error instanceof YoutubeApiError) {
    return error.message;
  }

  return 'Could not load the sort order from YouTube. Pull down to try again.';
}
