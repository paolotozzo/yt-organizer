import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ChannelSortOrder } from './channelSorting';
import { CHANNEL_SORT_ORDERS } from './channelSorting';

/** Stored per Google account, like the folder library. */
function buildSortOrderKey(userId: string): string {
  return `channelSortOrder:${userId}`;
}

export async function loadSortOrder(userId: string): Promise<ChannelSortOrder | null> {
  const storedSortOrder = await AsyncStorage.getItem(buildSortOrderKey(userId));
  const knownSortOrder = CHANNEL_SORT_ORDERS.find((option) => option.value === storedSortOrder);
  return knownSortOrder?.value ?? null;
}

export async function saveSortOrder(userId: string, sortOrder: ChannelSortOrder): Promise<void> {
  await AsyncStorage.setItem(buildSortOrderKey(userId), sortOrder);
}
