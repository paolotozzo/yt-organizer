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
  /**
   * The folders (topics) each channel is in, without duplicates. A channel can be in several,
   * e.g. a podcast that is both Tech and Health. Channels missing here are unassigned; an
   * entry is never an empty list.
   */
  folderIdsByChannelId: Record<string, string[]>;
};

export const MAX_FOLDER_NAME_LENGTH = 40;

/** How the folder name field looks wherever a folder is named. */
export const FOLDER_NAME_FIELD = {
  placeholder: 'e.g. Tech, Geopolitics, Health',
  accessibilityLabel: 'Folder name',
  maxLength: MAX_FOLDER_NAME_LENGTH,
} as const;

export type FolderNameValidation =
  | { isValid: true; folderName: string }
  | { isValid: false; problem: string };

export function createEmptyFolderLibrary(): FolderLibrary {
  return { folders: [], folderIdsByChannelId: {} };
}

export function findFolder(library: FolderLibrary, folderId: string): TopicFolder | undefined {
  return library.folders.find((folder) => folder.id === folderId);
}

const NO_FOLDER_IDS: readonly string[] = [];

/** The folders a channel is in, or an empty list when it is unassigned. */
export function getFolderIdsOfChannel(library: FolderLibrary, channelId: string): readonly string[] {
  return library.folderIdsByChannelId[channelId] ?? NO_FOLDER_IDS;
}

export function isChannelInFolder(
  library: FolderLibrary,
  channelId: string,
  folderId: string,
): boolean {
  return getFolderIdsOfChannel(library, channelId).includes(folderId);
}

/** The names of the folders a channel is in, in display order, e.g. ["Tech", "Health"]. */
export function getFolderNamesOfChannel(library: FolderLibrary, channelId: string): string[] {
  const folderIds = new Set(getFolderIdsOfChannel(library, channelId));
  return library.folders.filter((folder) => folderIds.has(folder.id)).map((folder) => folder.name);
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

/**
 * Deletes the folder. Its channels are not unsubscribed: they stay in their other folders,
 * or become unassigned when it was their only one.
 */
export function deleteFolder(library: FolderLibrary, folderId: string): FolderLibrary {
  return {
    folders: library.folders.filter((folder) => folder.id !== folderId),
    folderIdsByChannelId: mapFolderIds(library.folderIdsByChannelId, (folderIds) =>
      folderIds.filter((assignedFolderId) => assignedFolderId !== folderId),
    ),
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

/** Adds the channels to the folder. They stay in any other folders they are in. */
export function addChannelsToFolder(
  library: FolderLibrary,
  channelIds: readonly string[],
  folderId: string,
): FolderLibrary {
  const channelIdsToAdd = channelIds.filter(
    (channelId) => !isChannelInFolder(library, channelId, folderId),
  );

  if (!findFolder(library, folderId) || channelIdsToAdd.length === 0) {
    return library;
  }

  const folderIdsByChannelId = { ...library.folderIdsByChannelId };

  for (const channelId of channelIdsToAdd) {
    folderIdsByChannelId[channelId] = [...getFolderIdsOfChannel(library, channelId), folderId];
  }

  return { ...library, folderIdsByChannelId };
}

/**
 * Takes the channels out of this one folder, dropping their pins there. They stay in their
 * other folders; a channel left in none becomes unassigned.
 */
export function removeChannelsFromFolder(
  library: FolderLibrary,
  channelIds: readonly string[],
  folderId: string,
): FolderLibrary {
  const channelIdsToRemove = new Set(
    channelIds.filter((channelId) => isChannelInFolder(library, channelId, folderId)),
  );

  if (channelIdsToRemove.size === 0) {
    return library;
  }

  return {
    folders: library.folders.map((folder) =>
      folder.id === folderId ? unpinChannels(folder, channelIdsToRemove) : folder,
    ),
    folderIdsByChannelId: mapFolderIds(library.folderIdsByChannelId, (folderIds, channelId) =>
      channelIdsToRemove.has(channelId)
        ? folderIds.filter((assignedFolderId) => assignedFolderId !== folderId)
        : folderIds,
    ),
  };
}

/** What to do with one folder for a set of channels: put them all in, or take them all out. */
export type FolderMembershipChange = 'add' | 'remove';

/**
 * Applies several folder changes to the same channels at once, as the topics sheet does when
 * the user taps Done. Folders without a change keep their channels as they are.
 */
export function applyFolderMembershipChanges(
  library: FolderLibrary,
  channelIds: readonly string[],
  changeByFolderId: Readonly<Record<string, FolderMembershipChange>>,
): FolderLibrary {
  return Object.entries(changeByFolderId).reduce(
    (updatedLibrary, [folderId, change]) =>
      change === 'add'
        ? addChannelsToFolder(updatedLibrary, channelIds, folderId)
        : removeChannelsFromFolder(updatedLibrary, channelIds, folderId),
    library,
  );
}

/** Takes the channels out of every folder, so they become unassigned. */
export function unassignChannels(
  library: FolderLibrary,
  channelIds: readonly string[],
): FolderLibrary {
  const channelIdsToUnassign = new Set(channelIds);

  return {
    folders: library.folders.map((folder) => unpinChannels(folder, channelIdsToUnassign)),
    folderIdsByChannelId: mapFolderIds(library.folderIdsByChannelId, (folderIds, channelId) =>
      channelIdsToUnassign.has(channelId) ? [] : folderIds,
    ),
  };
}

/** Pins or unpins a channel inside a folder. Ignored if the channel is not in that folder. */
export function setChannelPinned(
  library: FolderLibrary,
  folderId: string,
  channelId: string,
  isPinned: boolean,
): FolderLibrary {
  if (!isChannelInFolder(library, channelId, folderId)) {
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
  const unsubscribedChannelIds = Object.keys(library.folderIdsByChannelId).filter(
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

function unpinChannels(folder: TopicFolder, channelIds: ReadonlySet<string>): TopicFolder {
  if (!folder.pinnedChannelIds.some((channelId) => channelIds.has(channelId))) {
    return folder;
  }

  return {
    ...folder,
    pinnedChannelIds: folder.pinnedChannelIds.filter((channelId) => !channelIds.has(channelId)),
  };
}

/** Rewrites every channel's folder list, dropping channels whose list ends up empty. */
function mapFolderIds(
  folderIdsByChannelId: Readonly<Record<string, string[]>>,
  update: (folderIds: string[], channelId: string) => string[],
): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(folderIdsByChannelId)
      .map(([channelId, folderIds]): [string, string[]] => [channelId, update(folderIds, channelId)])
      .filter(([, folderIds]) => folderIds.length > 0),
  );
}
