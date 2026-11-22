import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  buildCacheKey,
  findOutdatedCacheKeys,
  findUserCacheKeys,
  isCacheEntryFresh,
  type CachedEntry,
} from './youtubeDataCacheKeys';

/**
 * On-device cache for data fetched from the YouTube API, so the app opens instantly and
 * spends less quota. Entries are versioned (see YOUTUBE_CACHE_SCHEMA_VERSION) and stored per
 * Google account.
 */

export async function readCachedEntry<Value>(
  userId: string,
  entryName: string,
  isValidValue: (value: unknown) => value is Value,
): Promise<CachedEntry<Value> | null> {
  try {
    const serializedEntry = await AsyncStorage.getItem(buildCacheKey(userId, entryName));

    if (!serializedEntry) {
      return null;
    }

    const entry: unknown = JSON.parse(serializedEntry);
    return isCachedEntry(entry) && isValidValue(entry.value) ? (entry as CachedEntry<Value>) : null;
  } catch (error) {
    console.warn(`Could not read cached YouTube data "${entryName}"`, error);
    return null;
  }
}

export async function writeCachedEntry<Value>(
  userId: string,
  entryName: string,
  value: Value,
  storedAt: number = Date.now(),
): Promise<void> {
  const entry: CachedEntry<Value> = { storedAt, value };

  try {
    await AsyncStorage.setItem(buildCacheKey(userId, entryName), JSON.stringify(entry));
  } catch (error) {
    console.warn(`Could not cache YouTube data "${entryName}"`, error);
  }
}

type LoadThroughCacheOptions<Value> = {
  userId: string;
  entryName: string;
  maxAgeMilliseconds: number;
  /** Skips the cache and always asks YouTube, e.g. on pull to refresh. */
  forceRefresh: boolean;
  isValidValue: (value: unknown) => value is Value;
  fetchFreshValue: () => Promise<Value>;
};

/** Returns the cached value while it is fresh, otherwise fetches it and caches the result. */
export async function loadThroughCache<Value>({
  userId,
  entryName,
  maxAgeMilliseconds,
  forceRefresh,
  isValidValue,
  fetchFreshValue,
}: LoadThroughCacheOptions<Value>): Promise<Value> {
  if (!forceRefresh) {
    const cachedEntry = await readCachedEntry(userId, entryName, isValidValue);

    if (cachedEntry && isCacheEntryFresh(cachedEntry, Date.now(), maxAgeMilliseconds)) {
      return cachedEntry.value;
    }
  }

  const freshValue = await fetchFreshValue();
  await writeCachedEntry(userId, entryName, freshValue);
  return freshValue;
}

/** Deletes cache entries left by older schema versions. Run once at startup. */
export async function deleteOutdatedCacheEntries(): Promise<void> {
  try {
    const outdatedKeys = findOutdatedCacheKeys(await AsyncStorage.getAllKeys());

    if (outdatedKeys.length > 0) {
      await AsyncStorage.multiRemove(outdatedKeys);
    }
  } catch (error) {
    console.warn('Could not delete outdated cached YouTube data', error);
  }
}

/** Deletes all cached YouTube data of one user. Their folders are kept. */
export async function clearCachedYoutubeData(userId: string): Promise<void> {
  const userKeys = findUserCacheKeys(await AsyncStorage.getAllKeys(), userId);
  await AsyncStorage.multiRemove(userKeys);
}

function isCachedEntry(value: unknown): value is CachedEntry<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).storedAt === 'number' &&
    'value' in value
  );
}
