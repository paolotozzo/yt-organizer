import type { ChannelVideo } from '@/features/videos/channelVideo';

/**
 * Pure functions for the user's own video lists, kept on the device. Saving to them is free
 * and instant, unlike YouTube playlists, which cost 50 quota units per video. Every function
 * returns a new library and never mutates its input, so they fit a reducer.
 */

/** A video saved to a list, with enough of its channel to show it without asking YouTube. */
export type SavedVideo = ChannelVideo & {
  channelId: string;
  channelTitle: string;
  channelThumbnailUrl: string | null;
  /** When it was added to the list, in epoch milliseconds. */
  savedAt: number;
};

export type SavedVideoList = {
  id: string;
  name: string;
  /** Most recently saved first. A video appears at most once per list. */
  videos: SavedVideo[];
};

/** Lists in the order they were created. */
export type SavedVideoLibrary = {
  lists: SavedVideoList[];
};

export const MAX_LIST_NAME_LENGTH = 40;

/** How the list name field looks wherever a list is named. */
export const LIST_NAME_FIELD = {
  placeholder: 'e.g. Watch later, Recipes, Learn Rust',
  accessibilityLabel: 'List name',
  maxLength: MAX_LIST_NAME_LENGTH,
} as const;

export type ListNameValidation =
  | { isValid: true; listName: string }
  | { isValid: false; problem: string };

export function createEmptySavedVideoLibrary(): SavedVideoLibrary {
  return { lists: [] };
}

export function findSavedVideoList(
  library: SavedVideoLibrary,
  listId: string,
): SavedVideoList | undefined {
  return library.lists.find((list) => list.id === listId);
}

export function isVideoInList(list: SavedVideoList, videoId: string): boolean {
  return list.videos.some((video) => video.videoId === videoId);
}

/**
 * Trims the name and checks it is non-empty, short enough and not used by another list
 * (case-insensitively). Pass `listIdBeingRenamed` so a list can keep its own name.
 */
export function validateListName(
  library: SavedVideoLibrary,
  proposedName: string,
  listIdBeingRenamed?: string,
): ListNameValidation {
  const listName = proposedName.trim();

  if (listName.length === 0) {
    return { isValid: false, problem: 'Give the list a name.' };
  }

  if (listName.length > MAX_LIST_NAME_LENGTH) {
    return { isValid: false, problem: `Keep the name under ${MAX_LIST_NAME_LENGTH} characters.` };
  }

  const isNameTaken = library.lists.some(
    (list) =>
      list.id !== listIdBeingRenamed &&
      list.name.localeCompare(listName, undefined, { sensitivity: 'base' }) === 0,
  );

  if (isNameTaken) {
    return { isValid: false, problem: `A list named "${listName}" already exists.` };
  }

  return { isValid: true, listName };
}

/** Adds an empty list at the end. Expects an already validated name and a new id. */
export function createList(
  library: SavedVideoLibrary,
  { id, name }: { id: string; name: string },
): SavedVideoLibrary {
  if (findSavedVideoList(library, id)) {
    return library;
  }

  return { lists: [...library.lists, { id, name, videos: [] }] };
}

export function renameList(
  library: SavedVideoLibrary,
  listId: string,
  name: string,
): SavedVideoLibrary {
  return updateList(library, listId, (list) => ({ ...list, name }));
}

export function deleteList(library: SavedVideoLibrary, listId: string): SavedVideoLibrary {
  return { lists: library.lists.filter((list) => list.id !== listId) };
}

/** Puts the video at the top of the list, unless the list already has it. */
export function addVideoToList(
  library: SavedVideoLibrary,
  listId: string,
  video: SavedVideo,
): SavedVideoLibrary {
  return updateList(library, listId, (list) =>
    isVideoInList(list, video.videoId) ? list : { ...list, videos: [video, ...list.videos] },
  );
}

export function removeVideoFromList(
  library: SavedVideoLibrary,
  listId: string,
  videoId: string,
): SavedVideoLibrary {
  return updateList(library, listId, (list) =>
    isVideoInList(list, videoId)
      ? { ...list, videos: list.videos.filter((video) => video.videoId !== videoId) }
      : list,
  );
}

/** Applies `update` to one list, keeping the library unchanged when nothing changes. */
function updateList(
  library: SavedVideoLibrary,
  listId: string,
  update: (list: SavedVideoList) => SavedVideoList,
): SavedVideoLibrary {
  let hasChanged = false;
  const lists = library.lists.map((list) => {
    if (list.id !== listId) {
      return list;
    }

    const updatedList = update(list);
    hasChanged = updatedList !== list;
    return updatedList;
  });

  return hasChanged ? { lists } : library;
}
