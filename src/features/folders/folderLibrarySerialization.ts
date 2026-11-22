import { createEmptyFolderLibrary, type FolderLibrary, type TopicFolder } from './folderLibrary';

/** Bump when the stored shape changes, and migrate older versions in `parseStoredFolderLibrary`. */
export const FOLDER_LIBRARY_SCHEMA_VERSION = 1;

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

    if (!isRecord(storedValue) || storedValue.schemaVersion !== FOLDER_LIBRARY_SCHEMA_VERSION) {
      return createEmptyFolderLibrary();
    }

    return normalizeFolderLibrary(storedValue.library);
  } catch {
    return createEmptyFolderLibrary();
  }
}

function normalizeFolderLibrary(value: unknown): FolderLibrary {
  if (!isRecord(value)) {
    return createEmptyFolderLibrary();
  }

  const folders = parseFolders(value.folders);
  const folderIds = new Set(folders.map((folder) => folder.id));
  const folderIdByChannelId = parseAssignments(value.folderIdByChannelId, folderIds);

  const foldersWithValidPins = folders.map((folder) => ({
    ...folder,
    pinnedChannelIds: folder.pinnedChannelIds.filter(
      (channelId) => folderIdByChannelId[channelId] === folder.id,
    ),
  }));

  return {
    folders: [
      ...foldersWithValidPins.filter((folder) => folder.isPinned),
      ...foldersWithValidPins.filter((folder) => !folder.isPinned),
    ],
    folderIdByChannelId,
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

function parseAssignments(value: unknown, folderIds: ReadonlySet<string>): Record<string, string> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === 'string' && folderIds.has(entry[1]),
    ),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
