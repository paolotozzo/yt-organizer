import { useCallback, useEffect, useRef, useState } from 'react';

import { YoutubeApiError } from './youtubeApiClient';
import { readCachedEntry, writeCachedEntry } from './youtubeDataCache';
import { isCacheEntryFresh } from './youtubeDataCacheKeys';

export type CachedResourceState<Value> =
  | { status: 'loading' }
  | { status: 'failed'; errorMessage: string }
  | { status: 'loaded'; value: Value };

type CachedResourceOptions<Value> = {
  userId: string;
  entryName: string;
  maxAgeMilliseconds: number;
  isValidValue: (value: unknown) => value is Value;
  /** Must be stable (wrapped in useCallback); a new function reloads the resource. */
  fetchFreshValue: () => Promise<Value>;
  /** Shown when the first load fails with an error that isn't a YoutubeApiError. */
  fallbackErrorMessage: string;
  /**
   * Optional free check, e.g. against a public feed, that an expired cached value is still
   * up to date. When it says yes, the value is kept for another full maximum age and YouTube's
   * API is not called. Must be stable (wrapped in useCallback) and resolve false on failure.
   */
  isCachedValueStillCurrent?: (cachedValue: Value) => Promise<boolean>;
};

type CachedResource<Value> = {
  state: CachedResourceState<Value>;
  isRefreshing: boolean;
  /** Fetches from YouTube, ignoring the cache. */
  refresh: () => Promise<void>;
  /** Changes the loaded value in memory only, e.g. to append another page. */
  updateLoadedValue: (update: (currentValue: Value) => Value) => void;
};

/**
 * Stale-while-revalidate loading of YouTube data: the cached value is shown at once, and
 * YouTube is only asked when there is no cached value or it is older than the maximum age.
 * A failed reload keeps the value already on screen.
 */
export function useCachedYoutubeResource<Value>({
  userId,
  entryName,
  maxAgeMilliseconds,
  isValidValue,
  fetchFreshValue,
  fallbackErrorMessage,
  isCachedValueStillCurrent,
}: CachedResourceOptions<Value>): CachedResource<Value> {
  const [state, setState] = useState<CachedResourceState<Value>>({ status: 'loading' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMountedRef = useRef(true);

  const fetchAndCache = useCallback(async () => {
    try {
      const freshValue = await fetchFreshValue();
      await writeCachedEntry(userId, entryName, freshValue);

      if (isMountedRef.current) {
        setState({ status: 'loaded', value: freshValue });
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState((currentState) =>
          currentState.status === 'loaded'
            ? currentState
            : { status: 'failed', errorMessage: describeError(error, fallbackErrorMessage) },
        );
      }

      console.warn(`Could not load YouTube data "${entryName}"`, error);
    }
  }, [entryName, fallbackErrorMessage, fetchFreshValue, userId]);

  useEffect(() => {
    isMountedRef.current = true;
    setState({ status: 'loading' });

    async function loadCachedThenFresh() {
      const cachedEntry = await readCachedEntry(userId, entryName, isValidValue);

      if (cachedEntry && isMountedRef.current) {
        setState({ status: 'loaded', value: cachedEntry.value });
      }

      const isCacheFresh =
        cachedEntry !== null && isCacheEntryFresh(cachedEntry, Date.now(), maxAgeMilliseconds);

      if (isCacheFresh) {
        return;
      }

      if (cachedEntry && (await isCachedValueStillCurrent?.(cachedEntry.value))) {
        await writeCachedEntry(userId, entryName, cachedEntry.value);
        return;
      }

      await fetchAndCache();
    }

    loadCachedThenFresh();

    return () => {
      isMountedRef.current = false;
    };
    // isValidValue is a plain type guard and maxAge a constant; neither should reload data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryName, fetchAndCache, isCachedValueStillCurrent, userId]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setState((currentState) =>
      currentState.status === 'failed' ? { status: 'loading' } : currentState,
    );

    try {
      await fetchAndCache();
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [fetchAndCache]);

  const updateLoadedValue = useCallback((update: (currentValue: Value) => Value) => {
    setState((currentState) =>
      currentState.status === 'loaded'
        ? { status: 'loaded', value: update(currentState.value) }
        : currentState,
    );
  }, []);

  return { state, isRefreshing, refresh, updateLoadedValue };
}

function describeError(error: unknown, fallbackErrorMessage: string): string {
  return error instanceof YoutubeApiError ? error.message : fallbackErrorMessage;
}
