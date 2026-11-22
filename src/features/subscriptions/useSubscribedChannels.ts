import { useCallback, useEffect, useRef, useState } from 'react';

import type { SubscribedChannel } from './subscribedChannel';
import { fetchAllSubscribedChannels, YoutubeApiError } from './youtubeSubscriptionsApi';

export type SubscribedChannelsState =
  | { status: 'loading' }
  | { status: 'failed'; errorMessage: string }
  | { status: 'loaded'; channels: SubscribedChannel[] };

type UseSubscribedChannelsResult = {
  state: SubscribedChannelsState;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
};

/**
 * Loads the user's subscriptions once on mount. `refresh` reloads them while keeping the
 * current list on screen, and only replaces it once the new list has fully arrived.
 */
export function useSubscribedChannels(
  getAccessToken: () => Promise<string>,
): UseSubscribedChannelsResult {
  const [state, setState] = useState<SubscribedChannelsState>({ status: 'loading' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMountedRef = useRef(true);

  const loadChannels = useCallback(async () => {
    try {
      const accessToken = await getAccessToken();
      const channels = await fetchAllSubscribedChannels(accessToken);

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
  }, [getAccessToken]);

  useEffect(() => {
    isMountedRef.current = true;
    loadChannels();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadChannels]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setState((currentState) =>
      currentState.status === 'failed' ? { status: 'loading' } : currentState,
    );

    try {
      await loadChannels();
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [loadChannels]);

  return { state, isRefreshing, refresh };
}

function describeError(error: unknown): string {
  if (error instanceof YoutubeApiError) {
    return error.message;
  }

  return 'Could not load your subscriptions. Pull down to try again.';
}
