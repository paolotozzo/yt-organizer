import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ChannelSortOrder } from './channelSorting';
import { CHANNEL_SORT_ORDERS } from './channelSorting';
import { parseStoredLatestUploadCache, type LatestUploadCache } from './latestUploadCache';

/** Both are stored per Google account, like the folder library. */
function buildSortOrderKey(userId: string): string {
  return `channelSortOrder:${userId}`;
}

function buildLatestUploadCacheKey(userId: string): string {
  return `latestUploadCache:${userId}`;
}

export async function loadSortOrder(userId: string): Promise<ChannelSortOrder | null> {
  const storedSortOrder = await AsyncStorage.getItem(buildSortOrderKey(userId));
  const knownSortOrder = CHANNEL_SORT_ORDERS.find((option) => option.value === storedSortOrder);
  return knownSortOrder?.value ?? null;
}

export async function saveSortOrder(userId: string, sortOrder: ChannelSortOrder): Promise<void> {
  await AsyncStorage.setItem(buildSortOrderKey(userId), sortOrder);
}

export async function loadLatestUploadCache(userId: string): Promise<LatestUploadCache> {
  return parseStoredLatestUploadCache(await AsyncStorage.getItem(buildLatestUploadCacheKey(userId)));
}

export async function saveLatestUploadCache(
  userId: string,
  cache: LatestUploadCache,
): Promise<void> {
  await AsyncStorage.setItem(buildLatestUploadCacheKey(userId), JSON.stringify(cache));
}
