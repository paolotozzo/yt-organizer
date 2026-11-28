import { isChannelVideo } from '@/features/videos/channelVideo';

import {
  createEmptySavedVideoLibrary,
  type SavedVideo,
  type SavedVideoLibrary,
  type SavedVideoList,
} from './savedVideoLists';

/** Bump when the stored shape changes, and migrate older versions in the parser below. */
export const SAVED_VIDEO_LIBRARY_SCHEMA_VERSION = 1;

type StoredSavedVideoLibrary = {
  schemaVersion: typeof SAVED_VIDEO_LIBRARY_SCHEMA_VERSION;
  library: SavedVideoLibrary;
};

export function serializeSavedVideoLibrary(library: SavedVideoLibrary): string {
  const storedLibrary: StoredSavedVideoLibrary = {
    schemaVersion: SAVED_VIDEO_LIBRARY_SCHEMA_VERSION,
    library,
  };

  return JSON.stringify(storedLibrary);
}

/**
 * Reads a stored library defensively: malformed lists and videos are dropped instead of
 * crashing the app, and list ids and the videos in each list stay unique.
 */
export function parseStoredSavedVideoLibrary(serializedLibrary: string | null): SavedVideoLibrary {
  if (!serializedLibrary) {
    return createEmptySavedVideoLibrary();
  }

  try {
    const storedValue: unknown = JSON.parse(serializedLibrary);

    if (
      !isRecord(storedValue) ||
      storedValue.schemaVersion !== SAVED_VIDEO_LIBRARY_SCHEMA_VERSION ||
      !isRecord(storedValue.library) ||
      !Array.isArray(storedValue.library.lists)
    ) {
      return createEmptySavedVideoLibrary();
    }

    return { lists: parseLists(storedValue.library.lists) };
  } catch {
    return createEmptySavedVideoLibrary();
  }
}

function parseLists(values: unknown[]): SavedVideoList[] {
  const listIds = new Set<string>();
  const lists: SavedVideoList[] = [];

  for (const value of values) {
    if (
      !isRecord(value) ||
      typeof value.id !== 'string' ||
      typeof value.name !== 'string' ||
      !Array.isArray(value.videos) ||
      listIds.has(value.id)
    ) {
      continue;
    }

    listIds.add(value.id);
    lists.push({ id: value.id, name: value.name, videos: parseVideos(value.videos) });
  }

  return lists;
}

function parseVideos(values: unknown[]): SavedVideo[] {
  const videoIds = new Set<string>();

  return values.filter((value): value is SavedVideo => {
    if (!isSavedVideo(value) || videoIds.has(value.videoId)) {
      return false;
    }

    videoIds.add(value.videoId);
    return true;
  });
}

function isSavedVideo(value: unknown): value is SavedVideo {
  if (!isRecord(value) || !isChannelVideo(value)) {
    return false;
  }

  const candidate: Record<string, unknown> = value;

  return (
    typeof candidate.channelId === 'string' &&
    typeof candidate.channelTitle === 'string' &&
    (candidate.channelThumbnailUrl === null || typeof candidate.channelThumbnailUrl === 'string') &&
    typeof candidate.savedAt === 'number'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
