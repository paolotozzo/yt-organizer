import { describe, expect, it } from '@jest/globals';

import {
  addVideoToList,
  createEmptySavedVideoLibrary,
  createList,
  deleteList,
  findSavedVideoList,
  removeVideoFromList,
  renameList,
  validateListName,
} from './savedVideoLists';
import { buildSavedVideo } from './savedVideoTestData';

const libraryWithLater = createList(createEmptySavedVideoLibrary(), {
  id: 'later',
  name: 'Later',
});

function videoIdsIn(library: typeof libraryWithLater, listId: string): string[] {
  return findSavedVideoList(library, listId)?.videos.map((video) => video.videoId) ?? [];
}

describe('validateListName', () => {
  it('trims the name and refuses empty, long or taken names', () => {
    expect(validateListName(libraryWithLater, '  Cooking ')).toEqual({
      isValid: true,
      listName: 'Cooking',
    });
    expect(validateListName(libraryWithLater, '   ').isValid).toBe(false);
    expect(validateListName(libraryWithLater, 'x'.repeat(41)).isValid).toBe(false);
    expect(validateListName(libraryWithLater, 'LATER').isValid).toBe(false);
  });

  it('lets a list keep its own name when renamed', () => {
    expect(validateListName(libraryWithLater, 'later', 'later').isValid).toBe(true);
  });
});

describe('createList, renameList and deleteList', () => {
  it('adds lists in creation order and ignores a duplicate id', () => {
    const library = createList(libraryWithLater, { id: 'cooking', name: 'Cooking' });

    expect(library.lists.map((list) => list.name)).toEqual(['Later', 'Cooking']);
    expect(createList(library, { id: 'later', name: 'Again' })).toBe(library);
  });

  it('renames and deletes by id', () => {
    const renamed = renameList(libraryWithLater, 'later', 'Watch soon');
    expect(findSavedVideoList(renamed, 'later')?.name).toBe('Watch soon');
    expect(deleteList(renamed, 'later').lists).toEqual([]);
  });
});

describe('addVideoToList and removeVideoFromList', () => {
  it('puts new videos on top and never adds one twice', () => {
    let library = addVideoToList(libraryWithLater, 'later', buildSavedVideo('a'));
    library = addVideoToList(library, 'later', buildSavedVideo('b'));

    expect(videoIdsIn(library, 'later')).toEqual(['b', 'a']);
    expect(addVideoToList(library, 'later', buildSavedVideo('a'))).toBe(library);
  });

  it('removes a video and leaves the library unchanged when it is not there', () => {
    const library = addVideoToList(libraryWithLater, 'later', buildSavedVideo('a'));

    expect(videoIdsIn(removeVideoFromList(library, 'later', 'a'), 'later')).toEqual([]);
    expect(removeVideoFromList(library, 'later', 'missing')).toBe(library);
  });

  it('ignores a list that does not exist', () => {
    expect(addVideoToList(libraryWithLater, 'missing', buildSavedVideo('a'))).toBe(
      libraryWithLater,
    );
  });
});
