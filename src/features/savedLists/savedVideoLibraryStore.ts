import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  parseStoredSavedVideoLibrary,
  serializeSavedVideoLibrary,
} from './savedVideoLibrarySerialization';
import type { SavedVideoLibrary } from './savedVideoLists';

/**
 * Where the saved lists live. Today that is the device; a backend that syncs lists between
 * devices can replace it without touching the screens.
 */
export type SavedVideoLibraryStore = {
  load: (userId: string) => Promise<SavedVideoLibrary>;
  save: (userId: string, library: SavedVideoLibrary) => Promise<void>;
};

/**
 * One library per Google account, outside the YouTube data cache, so "Clear cached data"
 * never deletes the user's lists.
 */
function buildStorageKey(userId: string): string {
  return `savedVideoLibrary:${userId}`;
}

export const deviceSavedVideoLibraryStore: SavedVideoLibraryStore = {
  async load(userId) {
    return parseStoredSavedVideoLibrary(await AsyncStorage.getItem(buildStorageKey(userId)));
  },
  async save(userId, library) {
    await AsyncStorage.setItem(buildStorageKey(userId), serializeSavedVideoLibrary(library));
  },
};
