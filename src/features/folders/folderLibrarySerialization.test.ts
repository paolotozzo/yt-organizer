import { describe, expect, it } from '@jest/globals';

import {
  createEmptyFolderLibrary,
  createFolder,
  moveChannelsToFolder,
  setChannelPinned,
  setFolderPinned,
} from './folderLibrary';
import { parseStoredFolderLibrary, serializeFolderLibrary } from './folderLibrarySerialization';

describe('parseStoredFolderLibrary', () => {
  it('round-trips a serialized library', () => {
    const library = setChannelPinned(
      moveChannelsToFolder(
        setFolderPinned(
          createFolder(createFolder(createEmptyFolderLibrary(), { id: 'a', name: 'A' }), {
            id: 'b',
            name: 'B',
          }),
          'b',
          true,
        ),
        ['c1'],
        'a',
      ),
      'a',
      'c1',
      true,
    );

    expect(parseStoredFolderLibrary(serializeFolderLibrary(library))).toEqual(library);
  });

  it('returns an empty library for missing, corrupt or unknown-version data', () => {
    expect(parseStoredFolderLibrary(null)).toEqual(createEmptyFolderLibrary());
    expect(parseStoredFolderLibrary('{not json')).toEqual(createEmptyFolderLibrary());
    expect(parseStoredFolderLibrary('{"schemaVersion":99,"library":{}}')).toEqual(
      createEmptyFolderLibrary(),
    );
  });

  it('repairs data that breaks the library invariants', () => {
    const storedValue = JSON.stringify({
      schemaVersion: 1,
      library: {
        folders: [
          { id: 'a', name: 'A', isPinned: false, pinnedChannelIds: ['c1', 'c2', 'c1'] },
          { id: 'a', name: 'Duplicate', isPinned: false, pinnedChannelIds: [] },
          { id: 'b', name: 'B', isPinned: true, pinnedChannelIds: [] },
          { name: 'No id' },
        ],
        folderIdByChannelId: { c1: 'a', c3: 'deleted-folder', c4: 42 },
      },
    });

    expect(parseStoredFolderLibrary(storedValue)).toEqual({
      folders: [
        { id: 'b', name: 'B', isPinned: true, pinnedChannelIds: [] },
        { id: 'a', name: 'A', isPinned: false, pinnedChannelIds: ['c1'] },
      ],
      folderIdByChannelId: { c1: 'a' },
    });
  });
});
