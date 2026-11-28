import { useCallback, useMemo } from 'react';

import { youtubeCacheEntryNames, youtubeCacheMaxAge } from '@/features/youtube/youtubeCachePolicy';
import { useCachedYoutubeResource } from '@/features/youtube/useCachedYoutubeResource';

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
 * The user's subscriptions: cached ones are shown right away, and YouTube is only asked when
 * the cached list is missing or older than `youtubeCacheMaxAge.subscriptions`.
 */
export function useSubscribedChannels(
  userId: string,
  getAccessToken: () => Promise<string>,
): UseSubscribedChannelsResult {
  const fetchFreshChannels = useCallback(
    async () => fetchAllSubscribedChannels(await getAccessToken(), 'alphabetical'),
    [getAccessToken],
  );

  const { state, isRefreshing, refresh } = useCachedYoutubeResource({
    userId,
    entryName: youtubeCacheEntryNames.subscriptions,
    maxAgeMilliseconds: youtubeCacheMaxAge.subscriptions,
    isValidValue: isSubscribedChannelList,
    fetchFreshValue: fetchFreshChannels,
    fallbackErrorMessage: 'Could not load your subscriptions. Pull down to try again.',
  });

  const subscriptionsState = useMemo<SubscribedChannelsState>(
    () => (state.status === 'loaded' ? { status: 'loaded', channels: state.value } : state),
    [state],
  );

  return { state: subscriptionsState, isRefreshing, refresh };
}
