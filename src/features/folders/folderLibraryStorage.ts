import AsyncStorage from '@react-native-async-storage/async-storage';

import type { FolderLibrary } from './folderLibrary';
import { parseStoredFolderLibrary, serializeFolderLibrary } from './folderLibrarySerialization';

/**
 * Folders are stored on the device, one library per Google account, so two people sharing a
 * phone never see each other's folders. YouTube offers no API to store them remotely.
 */
function buildStorageKey(userId: string): string {
  return `folderLibrary:${userId}`;
}

export async function loadFolderLibrary(userId: string): Promise<FolderLibrary> {
  const serializedLibrary = await AsyncStorage.getItem(buildStorageKey(userId));
  return parseStoredFolderLibrary(serializedLibrary);
}

export async function saveFolderLibrary(userId: string, library: FolderLibrary): Promise<void> {
  await AsyncStorage.setItem(buildStorageKey(userId), serializeFolderLibrary(library));
}
