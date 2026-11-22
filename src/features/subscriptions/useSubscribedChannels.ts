import { useCallback, useEffect, useRef, useState } from 'react';

import { YoutubeApiError } from '@/features/youtube/youtubeApiClient';
import { youtubeCacheEntryNames, youtubeCacheMaxAge } from '@/features/youtube/youtubeCachePolicy';
import { readCachedEntry, writeCachedEntry } from '@/features/youtube/youtubeDataCache';
import { isCacheEntryFresh } from '@/features/youtube/youtubeDataCacheKeys';

import { isSubscribedChannelList, type SubscribedChannel } from './subscribedChannel';
import { fetchAllSubscribedChannels } from './youtubeSubscriptionsApi';

export type SubscribedChannelsState =
  | { status: 'loading' }
  | { status: 'failed'; errorMessage: string }
  | { status: 'loaded'; channels: SubscribedChannel[] };

type UseSubscribedChannelsResult = {
  state: SubscribedChannelsState;
  isRefreshing: boolean;
  /** Fetches the list from YouTube, ignoring the cache. */
  refresh: () => Promise<void>;
};

/**
 * Shows the cached subscriptions right away, and only asks YouTube when there is no cached
 * list or it is older than `youtubeCacheMaxAge.subscriptions`. While a newer list loads the
 * current one stays on screen.
 */
export function useSubscribedChannels(
  userId: string,
  getAccessToken: () => Promise<string>,
): UseSubscribedChannelsResult {
  const [state, setState] = useState<SubscribedChannelsState>({ status: 'loading' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMountedRef = useRef(true);

  const fetchAndCacheChannels = useCallback(async () => {
    try {
      const accessToken = await getAccessToken();
      const channels = await fetchAllSubscribedChannels(accessToken, 'alphabetical');
      await writeCachedEntry(userId, youtubeCacheEntryNames.subscriptions, channels);

      if (isMountedRef.current) {
        setState({ status: 'loaded', channels });
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState((currentState) =>
          // A failed refresh keeps the list the user already has.
          currentState.status === 'loaded'
            ? currentState
            : { status: 'failed', errorMessage: describeError(error) },
        );
      }

      console.warn('Could not load YouTube subscriptions', error);
    }
  }, [getAccessToken, userId]);

  useEffect(() => {
    isMountedRef.current = true;

    async function loadCachedThenFreshChannels() {
      const cachedEntry = await readCachedEntry(
        userId,
        youtubeCacheEntryNames.subscriptions,
        isSubscribedChannelList,
      );

      if (cachedEntry && isMountedRef.current) {
        setState({ status: 'loaded', channels: cachedEntry.value });
      }

      const isCacheFresh =
        cachedEntry !== null &&
        isCacheEntryFresh(cachedEntry, Date.now(), youtubeCacheMaxAge.subscriptions);

      if (!isCacheFresh) {
        await fetchAndCacheChannels();
      }
    }

    loadCachedThenFreshChannels();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchAndCacheChannels, userId]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setState((currentState) =>
      currentState.status === 'failed' ? { status: 'loading' } : currentState,
    );

    try {
      await fetchAndCacheChannels();
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [fetchAndCacheChannels]);

  return { state, isRefreshing, refresh };
}

function describeError(error: unknown): string {
  if (error instanceof YoutubeApiError) {
    return error.message;
  }

  return 'Could not load your subscriptions. Pull down to try again.';
}
