import { describe, expect, it } from '@jest/globals';

import {
  createEmptyFolderLibrary,
  createFolder,
  deleteFolder,
  findFolder,
  forgetUnsubscribedChannels,
  addChannelsToFolder,
  applyFolderMembershipChanges,
  moveFolder,
  removeChannelsFromFolder,
  renameFolder,
  setChannelPinned,
  setFolderPinned,
  unassignChannels,
  validateFolderName,
  type FolderLibrary,
} from './folderLibrary';

function buildLibraryWithFolders(...folderNames: string[]): FolderLibrary {
  return folderNames.reduce(
    (library, folderName) =>
      createFolder(library, { id: folderName.toLowerCase(), name: folderName }),
    createEmptyFolderLibrary(),
  );
}

function folderIdsInOrder(library: FolderLibrary): string[] {
  return library.folders.map((folder) => folder.id);
}

function pinnedChannelIdsOf(library: FolderLibrary, folderId: string): string[] {
  return findFolder(library, folderId)?.pinnedChannelIds ?? [];
}

describe('validateFolderName', () => {
  const library = buildLibraryWithFolders('Tech', 'Health');

  it('accepts a new name and trims it', () => {
    expect(validateFolderName(library, '  Geopolitics ')).toEqual({
      isValid: true,
      folderName: 'Geopolitics',
    });
  });

  it('rejects an empty or blank name', () => {
    expect(validateFolderName(library, '   ').isValid).toBe(false);
  });

  it('rejects a name longer than the limit', () => {
    expect(validateFolderName(library, 'x'.repeat(41)).isValid).toBe(false);
  });

  it('rejects a name another folder already uses, ignoring case', () => {
    expect(validateFolderName(library, 'tech').isValid).toBe(false);
  });

  it('lets a folder keep its own name when renaming', () => {
    expect(validateFolderName(library, 'TECH', 'tech')).toEqual({
      isValid: true,
      folderName: 'TECH',
    });
  });
});

describe('createFolder, renameFolder and deleteFolder', () => {
  it('appends new folders unpinned and in creation order', () => {
    const library = buildLibraryWithFolders('Tech', 'Health');

    expect(folderIdsInOrder(library)).toEqual(['tech', 'health']);
    expect(library.folders.every((folder) => !folder.isPinned)).toBe(true);
  });

  it('renames only the targeted folder', () => {
    const library = renameFolder(buildLibraryWithFolders('Tech', 'Health'), 'tech', 'Science');

    expect(library.folders.map((folder) => folder.name)).toEqual(['Science', 'Health']);
  });

  it('takes a deleted folder out of its channels, keeping their other folders', () => {
    const library = addChannelsToFolder(
      addChannelsToFolder(buildLibraryWithFolders('Tech', 'Health'), ['c1', 'c2'], 'tech'),
      ['c2', 'c3'],
      'health',
    );

    const libraryAfterDelete = deleteFolder(library, 'tech');

    expect(folderIdsInOrder(libraryAfterDelete)).toEqual(['health']);
    expect(libraryAfterDelete.folderIdsByChannelId).toEqual({ c2: ['health'], c3: ['health'] });
  });

  it('does not mutate the original library', () => {
    const library = buildLibraryWithFolders('Tech');
    const snapshot = JSON.stringify(library);

    renameFolder(library, 'tech', 'Science');
    deleteFolder(library, 'tech');
    addChannelsToFolder(library, ['c1'], 'tech');

    expect(JSON.stringify(library)).toBe(snapshot);
  });
});

describe('setFolderPinned', () => {
  it('moves a newly pinned folder to the end of the pinned group', () => {
    const library = buildLibraryWithFolders('A', 'B', 'C', 'D');

    const libraryAfterPins = setFolderPinned(setFolderPinned(library, 'c', true), 'a', true);

    expect(folderIdsInOrder(libraryAfterPins)).toEqual(['c', 'a', 'b', 'd']);
    expect(findFolder(libraryAfterPins, 'a')?.isPinned).toBe(true);
  });

  it('moves an unpinned folder to the top of the unpinned group', () => {
    const library = setFolderPinned(
      setFolderPinned(buildLibraryWithFolders('A', 'B', 'C', 'D'), 'c', true),
      'd',
      true,
    );

    const libraryAfterUnpin = setFolderPinned(library, 'c', false);

    expect(folderIdsInOrder(libraryAfterUnpin)).toEqual(['d', 'c', 'a', 'b']);
    expect(findFolder(libraryAfterUnpin, 'c')?.isPinned).toBe(false);
  });

  it('returns the same library when nothing changes', () => {
    const library = buildLibraryWithFolders('A');

    expect(setFolderPinned(library, 'a', false)).toBe(library);
    expect(setFolderPinned(library, 'missing', true)).toBe(library);
  });
});

describe('moveFolder', () => {
  const libraryWithTwoPinned = setFolderPinned(
    setFolderPinned(buildLibraryWithFolders('A', 'B', 'C', 'D', 'E'), 'a', true),
    'b',
    true,
  );

  it('reorders unpinned folders', () => {
    expect(folderIdsInOrder(moveFolder(libraryWithTwoPinned, 4, 2))).toEqual([
      'a',
      'b',
      'e',
      'c',
      'd',
    ]);
  });

  it('reorders pinned folders', () => {
    expect(folderIdsInOrder(moveFolder(libraryWithTwoPinned, 0, 1))).toEqual([
      'b',
      'a',
      'c',
      'd',
      'e',
    ]);
  });

  it('keeps an unpinned folder below the pinned ones when dropped above them', () => {
    expect(folderIdsInOrder(moveFolder(libraryWithTwoPinned, 3, 0))).toEqual([
      'a',
      'b',
      'd',
      'c',
      'e',
    ]);
  });

  it('keeps a pinned folder above the unpinned ones when dropped below them', () => {
    expect(folderIdsInOrder(moveFolder(libraryWithTwoPinned, 0, 4))).toEqual([
      'b',
      'a',
      'c',
      'd',
      'e',
    ]);
  });

  it('ignores an index outside the list', () => {
    expect(moveFolder(libraryWithTwoPinned, 9, 0)).toBe(libraryWithTwoPinned);
  });
});

describe('addChannelsToFolder, removeChannelsFromFolder and unassignChannels', () => {
  const library = buildLibraryWithFolders('Tech', 'Health');

  it('adds every selected channel to the folder', () => {
    const libraryAfterAdd = addChannelsToFolder(library, ['c1', 'c2'], 'tech');

    expect(libraryAfterAdd.folderIdsByChannelId).toEqual({ c1: ['tech'], c2: ['tech'] });
  });

  it('lets a channel be in several folders, keeping its pin in the first', () => {
    const libraryWithPin = setChannelPinned(
      addChannelsToFolder(library, ['c1'], 'tech'),
      'tech',
      'c1',
      true,
    );

    const libraryAfterAdd = addChannelsToFolder(libraryWithPin, ['c1'], 'health');

    expect(libraryAfterAdd.folderIdsByChannelId).toEqual({ c1: ['tech', 'health'] });
    expect(pinnedChannelIdsOf(libraryAfterAdd, 'tech')).toEqual(['c1']);
  });

  it('returns the same library when nothing is added, or the folder does not exist', () => {
    const libraryWithChannel = addChannelsToFolder(library, ['c1'], 'tech');

    expect(addChannelsToFolder(libraryWithChannel, ['c1'], 'tech')).toBe(libraryWithChannel);
    expect(addChannelsToFolder(library, ['c1'], 'missing')).toBe(library);
  });

  it('removes channels from one folder only, dropping their pin there', () => {
    const libraryWithPin = setChannelPinned(
      addChannelsToFolder(addChannelsToFolder(library, ['c1', 'c2'], 'tech'), ['c1'], 'health'),
      'tech',
      'c1',
      true,
    );

    const libraryAfterRemove = removeChannelsFromFolder(libraryWithPin, ['c1', 'c2'], 'tech');

    expect(libraryAfterRemove.folderIdsByChannelId).toEqual({ c1: ['health'] });
    expect(pinnedChannelIdsOf(libraryAfterRemove, 'tech')).toEqual([]);
  });

  it('unassigns channels from every folder and removes their pins', () => {
    const libraryWithPin = setChannelPinned(
      addChannelsToFolder(addChannelsToFolder(library, ['c1', 'c2'], 'tech'), ['c1'], 'health'),
      'tech',
      'c1',
      true,
    );

    const libraryAfterUnassign = unassignChannels(libraryWithPin, ['c1']);

    expect(libraryAfterUnassign.folderIdsByChannelId).toEqual({ c2: ['tech'] });
    expect(pinnedChannelIdsOf(libraryAfterUnassign, 'tech')).toEqual([]);
  });
});

describe('applyFolderMembershipChanges', () => {
  it('adds and removes the channels per folder and leaves other folders alone', () => {
    const library = addChannelsToFolder(
      addChannelsToFolder(buildLibraryWithFolders('Tech', 'Health', 'News'), ['c1'], 'tech'),
      ['c2'],
      'news',
    );

    const libraryAfterChanges = applyFolderMembershipChanges(library, ['c1', 'c2'], {
      tech: 'remove',
      health: 'add',
    });

    expect(libraryAfterChanges.folderIdsByChannelId).toEqual({
      c1: ['health'],
      c2: ['news', 'health'],
    });
  });
});

describe('setChannelPinned', () => {
  const library = addChannelsToFolder(buildLibraryWithFolders('Tech'), ['c1', 'c2'], 'tech');

  it('keeps pins in the order they were made', () => {
    const libraryWithPins = setChannelPinned(
      setChannelPinned(library, 'tech', 'c2', true),
      'tech',
      'c1',
      true,
    );

    expect(pinnedChannelIdsOf(libraryWithPins, 'tech')).toEqual(['c2', 'c1']);
  });

  it('unpins a channel', () => {
    const libraryWithPin = setChannelPinned(library, 'tech', 'c1', true);

    expect(pinnedChannelIdsOf(setChannelPinned(libraryWithPin, 'tech', 'c1', false), 'tech')).toEqual(
      [],
    );
  });

  it('does not pin a channel twice', () => {
    const libraryWithPin = setChannelPinned(library, 'tech', 'c1', true);

    expect(setChannelPinned(libraryWithPin, 'tech', 'c1', true)).toEqual(libraryWithPin);
  });

  it('ignores a channel that is not in the folder', () => {
    expect(setChannelPinned(library, 'tech', 'c9', true)).toBe(library);
  });
});

describe('forgetUnsubscribedChannels', () => {
  it('drops assignments and pins of channels the user unsubscribed from', () => {
    const library = setChannelPinned(
      addChannelsToFolder(buildLibraryWithFolders('Tech'), ['c1', 'c2'], 'tech'),
      'tech',
      'c1',
      true,
    );

    const cleanedLibrary = forgetUnsubscribedChannels(library, new Set(['c2']));

    expect(cleanedLibrary.folderIdsByChannelId).toEqual({ c2: ['tech'] });
    expect(pinnedChannelIdsOf(cleanedLibrary, 'tech')).toEqual([]);
  });

  it('returns the same library when every channel is still subscribed', () => {
    const library = addChannelsToFolder(buildLibraryWithFolders('Tech'), ['c1'], 'tech');

    expect(forgetUnsubscribedChannels(library, new Set(['c1', 'c2']))).toBe(library);
  });
});
