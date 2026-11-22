/**
 * Pure functions describing how topic folders organize subscribed channels.
 *
 * YouTube has no folder concept, so the library is owned by the app. Every function returns
 * a new library and never mutates its input, which keeps them easy to use from a reducer.
 *
 * Invariant: `folders` is the display order, and pinned folders always come before unpinned
 * ones. Dragging only reorders a folder inside its own group (pinned or unpinned).
 */

export type TopicFolder = {
  id: string;
  name: string;
  isPinned: boolean;
  /** Channels pinned to the top of this folder, in the order they were pinned. */
  pinnedChannelIds: string[];
};

export type FolderLibrary = {
  folders: TopicFolder[];
  /** A channel belongs to at most one folder. Channels missing here are unassigned. */
  folderIdByChannelId: Record<string, string>;
};

export const MAX_FOLDER_NAME_LENGTH = 40;

export type FolderNameValidation =
  | { isValid: true; folderName: string }
  | { isValid: false; problem: string };

export function createEmptyFolderLibrary(): FolderLibrary {
  return { folders: [], folderIdByChannelId: {} };
}

export function findFolder(library: FolderLibrary, folderId: string): TopicFolder | undefined {
  return library.folders.find((folder) => folder.id === folderId);
}

/**
 * Trims the name and checks it is non-empty, short enough and not already used by another
 * folder (case-insensitively). Pass `folderIdBeingRenamed` so a folder can keep its own name.
 */
export function validateFolderName(
  library: FolderLibrary,
  proposedName: string,
  folderIdBeingRenamed?: string,
): FolderNameValidation {
  const folderName = proposedName.trim();

  if (folderName.length === 0) {
    return { isValid: false, problem: 'Give the folder a name.' };
  }

  if (folderName.length > MAX_FOLDER_NAME_LENGTH) {
    return {
      isValid: false,
      problem: `Keep the name under ${MAX_FOLDER_NAME_LENGTH} characters.`,
    };
  }

  const isNameTaken = library.folders.some(
    (folder) =>
      folder.id !== folderIdBeingRenamed &&
      folder.name.localeCompare(folderName, undefined, { sensitivity: 'base' }) === 0,
  );

  if (isNameTaken) {
    return { isValid: false, problem: `A folder named "${folderName}" already exists.` };
  }

  return { isValid: true, folderName };
}

/** Adds an unpinned folder at the end of the list. The name must be validated beforehand. */
export function createFolder(
  library: FolderLibrary,
  newFolder: { id: string; name: string },
): FolderLibrary {
  const folder: TopicFolder = {
    id: newFolder.id,
    name: newFolder.name,
    isPinned: false,
    pinnedChannelIds: [],
  };

  return { ...library, folders: [...library.folders, folder] };
}

export function renameFolder(
  library: FolderLibrary,
  folderId: string,
  folderName: string,
): FolderLibrary {
  return updateFolder(library, folderId, (folder) => ({ ...folder, name: folderName }));
}

/** Deletes the folder. Its channels are not unsubscribed, they become unassigned again. */
export function deleteFolder(library: FolderLibrary, folderId: string): FolderLibrary {
  const folderIdByChannelId = Object.fromEntries(
    Object.entries(library.folderIdByChannelId).filter(
      ([, assignedFolderId]) => assignedFolderId !== folderId,
    ),
  );

  return {
    folders: library.folders.filter((folder) => folder.id !== folderId),
    folderIdByChannelId,
  };
}

/**
 * Pinning moves a folder to the end of the pinned group, so the newest pin sits just above
 * the unpinned folders. Unpinning moves it to the top of the unpinned group.
 */
export function setFolderPinned(
  library: FolderLibrary,
  folderId: string,
  isPinned: boolean,
): FolderLibrary {
  const folder = findFolder(library, folderId);

  if (!folder || folder.isPinned === isPinned) {
    return library;
  }

  const otherFolders = library.folders.filter((otherFolder) => otherFolder.id !== folderId);
  const pinnedFolders = otherFolders.filter((otherFolder) => otherFolder.isPinned);
  const unpinnedFolders = otherFolders.filter((otherFolder) => !otherFolder.isPinned);
  const updatedFolder = { ...folder, isPinned };

  // The boundary between the two groups is both the end of the pinned group and the top of
  // the unpinned group, so the folder lands there in either direction.
  return { ...library, folders: [...pinnedFolders, updatedFolder, ...unpinnedFolders] };
}

/**
 * Moves the folder at `fromIndex` to `toIndex` (both in display order). The target index is
 * clamped to the folder's own group, so a drag can never mix pinned and unpinned folders.
 */
export function moveFolder(library: FolderLibrary, fromIndex: number, toIndex: number): FolderLibrary {
  const movingFolder = library.folders[fromIndex];

  if (!movingFolder) {
    return library;
  }

  const pinnedFolderCount = library.folders.filter((folder) => folder.isPinned).length;
  const [groupStartIndex, groupEndIndex] = movingFolder.isPinned
    ? [0, pinnedFolderCount - 1]
    : [pinnedFolderCount, library.folders.length - 1];
  const clampedToIndex = Math.min(Math.max(toIndex, groupStartIndex), groupEndIndex);

  if (clampedToIndex === fromIndex) {
    return library;
  }

  const folders = [...library.folders];
  folders.splice(fromIndex, 1);
  folders.splice(clampedToIndex, 0, movingFolder);

  return { ...library, folders };
}

/**
 * Assigns the channels to the folder, taking them out of any folder they were in before.
 * A channel keeps its pin only when it is already in the target folder.
 */
export function moveChannelsToFolder(
  library: FolderLibrary,
  channelIds: readonly string[],
  folderId: string,
): FolderLibrary {
  if (!findFolder(library, folderId)) {
    return library;
  }

  const channelIdsLeavingTheirFolder = channelIds.filter(
    (channelId) => library.folderIdByChannelId[channelId] !== folderId,
  );
  const folderIdByChannelId = { ...library.folderIdByChannelId };

  for (const channelId of channelIds) {
    folderIdByChannelId[channelId] = folderId;
  }

  return {
    folders: removeChannelPins(library.folders, channelIdsLeavingTheirFolder),
    folderIdByChannelId,
  };
}

/** Takes the channels out of whichever folder they are in, so they become unassigned. */
export function unassignChannels(
  library: FolderLibrary,
  channelIds: readonly string[],
): FolderLibrary {
  const channelIdsToUnassign = new Set(channelIds);
  const folderIdByChannelId = Object.fromEntries(
    Object.entries(library.folderIdByChannelId).filter(
      ([channelId]) => !channelIdsToUnassign.has(channelId),
    ),
  );

  return {
    folders: removeChannelPins(library.folders, channelIds),
    folderIdByChannelId,
  };
}

/** Pins or unpins a channel inside its folder. Ignored if the channel is not in that folder. */
export function setChannelPinned(
  library: FolderLibrary,
  folderId: string,
  channelId: string,
  isPinned: boolean,
): FolderLibrary {
  if (library.folderIdByChannelId[channelId] !== folderId) {
    return library;
  }

  return updateFolder(library, folderId, (folder) => {
    const isAlreadyPinned = folder.pinnedChannelIds.includes(channelId);

    if (isPinned === isAlreadyPinned) {
      return folder;
    }

    const pinnedChannelIds = isPinned
      ? [...folder.pinnedChannelIds, channelId]
      : folder.pinnedChannelIds.filter((pinnedChannelId) => pinnedChannelId !== channelId);

    return { ...folder, pinnedChannelIds };
  });
}

/**
 * Forgets channels the user no longer subscribes to, so stale assignments and pins do not
 * pile up in storage after an unsubscribe.
 */
export function forgetUnsubscribedChannels(
  library: FolderLibrary,
  subscribedChannelIds: ReadonlySet<string>,
): FolderLibrary {
  const unsubscribedChannelIds = Object.keys(library.folderIdByChannelId).filter(
    (channelId) => !subscribedChannelIds.has(channelId),
  );
  const unsubscribedPinnedChannelIds = library.folders.flatMap((folder) =>
    folder.pinnedChannelIds.filter((channelId) => !subscribedChannelIds.has(channelId)),
  );

  if (unsubscribedChannelIds.length === 0 && unsubscribedPinnedChannelIds.length === 0) {
    return library;
  }

  return unassignChannels(library, [...unsubscribedChannelIds, ...unsubscribedPinnedChannelIds]);
}

function updateFolder(
  library: FolderLibrary,
  folderId: string,
  update: (folder: TopicFolder) => TopicFolder,
): FolderLibrary {
  if (!findFolder(library, folderId)) {
    return library;
  }

  return {
    ...library,
    folders: library.folders.map((folder) => (folder.id === folderId ? update(folder) : folder)),
  };
}

function removeChannelPins(
  folders: TopicFolder[],
  channelIds: readonly string[],
): TopicFolder[] {
  if (channelIds.length === 0) {
    return folders;
  }

  const channelIdsToUnpin = new Set(channelIds);

  return folders.map((folder) => {
    if (!folder.pinnedChannelIds.some((channelId) => channelIdsToUnpin.has(channelId))) {
      return folder;
    }

    return {
      ...folder,
      pinnedChannelIds: folder.pinnedChannelIds.filter(
        (channelId) => !channelIdsToUnpin.has(channelId),
      ),
    };
  });
}
