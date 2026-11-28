import { createEmptyFolderLibrary, type FolderLibrary, type TopicFolder } from './folderLibrary';

/**
 * Bump when the stored shape changes, and migrate older versions in `parseStoredFolderLibrary`.
 * Version 1 kept one folder per channel (`folderIdByChannelId`); version 2 allows several.
 */
export const FOLDER_LIBRARY_SCHEMA_VERSION = 2;

const SINGLE_FOLDER_SCHEMA_VERSION = 1;

type StoredFolderLibrary = {
  schemaVersion: typeof FOLDER_LIBRARY_SCHEMA_VERSION;
  library: FolderLibrary;
};

export function serializeFolderLibrary(library: FolderLibrary): string {
  const storedLibrary: StoredFolderLibrary = {
    schemaVersion: FOLDER_LIBRARY_SCHEMA_VERSION,
    library,
  };

  return JSON.stringify(storedLibrary);
}

/**
 * Reads a stored library defensively: anything malformed is dropped rather than crashing the
 * app, and the result always satisfies the library invariants (unique folder ids, pinned
 * folders first, assignments and pins only pointing at existing folders).
 */
export function parseStoredFolderLibrary(serializedLibrary: string | null): FolderLibrary {
  if (!serializedLibrary) {
    return createEmptyFolderLibrary();
  }

  try {
    const storedValue: unknown = JSON.parse(serializedLibrary);

    if (!isRecord(storedValue) || !isRecord(storedValue.library)) {
      return createEmptyFolderLibrary();
    }

    switch (storedValue.schemaVersion) {
      case FOLDER_LIBRARY_SCHEMA_VERSION:
        return normalizeFolderLibrary(storedValue.library, storedValue.library.folderIdsByChannelId);
      case SINGLE_FOLDER_SCHEMA_VERSION:
        return normalizeFolderLibrary(
          storedValue.library,
          migrateSingleFolderAssignments(storedValue.library.folderIdByChannelId),
        );
      default:
        return createEmptyFolderLibrary();
    }
  } catch {
    return createEmptyFolderLibrary();
  }
}

/** Version 1 stored `{ channelId: folderId }`; each channel keeps that one folder. */
function migrateSingleFolderAssignments(value: unknown): unknown {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([channelId, folderId]) => [channelId, [folderId]]),
  );
}

function normalizeFolderLibrary(
  value: Record<string, unknown>,
  storedAssignments: unknown,
): FolderLibrary {
  const folders = parseFolders(value.folders);
  const folderIds = new Set(folders.map((folder) => folder.id));
  const folderIdsByChannelId = parseAssignments(storedAssignments, folderIds);

  const foldersWithValidPins = folders.map((folder) => ({
    ...folder,
    pinnedChannelIds: folder.pinnedChannelIds.filter(
      (channelId) => folderIdsByChannelId[channelId]?.includes(folder.id) === true,
    ),
  }));

  return {
    folders: [
      ...foldersWithValidPins.filter((folder) => folder.isPinned),
      ...foldersWithValidPins.filter((folder) => !folder.isPinned),
    ],
    folderIdsByChannelId,
  };
}

function parseFolders(value: unknown): TopicFolder[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenFolderIds = new Set<string>();
  const folders: TopicFolder[] = [];

  for (const candidate of value) {
    const folder = parseFolder(candidate);

    if (folder && !seenFolderIds.has(folder.id)) {
      seenFolderIds.add(folder.id);
      folders.push(folder);
    }
  }

  return folders;
}

function parseFolder(value: unknown): TopicFolder | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string') {
    return null;
  }

  const pinnedChannelIds = Array.isArray(value.pinnedChannelIds)
    ? [...new Set(value.pinnedChannelIds.filter((id): id is string => typeof id === 'string'))]
    : [];

  return {
    id: value.id,
    name: value.name,
    isPinned: value.isPinned === true,
    pinnedChannelIds,
  };
}

/** Keeps only string folder ids of existing folders, once each, and drops empty entries. */
function parseAssignments(
  value: unknown,
  folderIds: ReadonlySet<string>,
): Record<string, string[]> {
  if (!isRecord(value)) {
    return {};
  }

  const folderIdsByChannelId: Record<string, string[]> = {};

  for (const [channelId, assignedFolderIds] of Object.entries(value)) {
    if (!Array.isArray(assignedFolderIds)) {
      continue;
    }

    const validFolderIds = [
      ...new Set(
        assignedFolderIds.filter(
          (folderId): folderId is string => typeof folderId === 'string' && folderIds.has(folderId),
        ),
      ),
    ];

    if (validFolderIds.length > 0) {
      folderIdsByChannelId[channelId] = validFolderIds;
    }
  }

  return folderIdsByChannelId;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
