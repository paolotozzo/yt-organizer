import { describe, expect, it } from '@jest/globals';

import {
  parseStoredSavedVideoLibrary,
  serializeSavedVideoLibrary,
} from './savedVideoLibrarySerialization';
import { addVideoToList, createEmptySavedVideoLibrary, createList } from './savedVideoLists';
import { buildSavedVideo } from './savedVideoTestData';

describe('parseStoredSavedVideoLibrary', () => {
  it('reads back what was serialized', () => {
    const library = addVideoToList(
      createList(createEmptySavedVideoLibrary(), { id: 'later', name: 'Later' }),
      'later',
      buildSavedVideo('a'),
    );

    expect(parseStoredSavedVideoLibrary(serializeSavedVideoLibrary(library))).toEqual(library);
  });

  it('starts empty for missing, broken or unknown-version data', () => {
    expect(parseStoredSavedVideoLibrary(null)).toEqual({ lists: [] });
    expect(parseStoredSavedVideoLibrary('{not json')).toEqual({ lists: [] });
    expect(parseStoredSavedVideoLibrary('{"schemaVersion":99,"library":{"lists":[]}}')).toEqual({
      lists: [],
    });
  });

  it('drops malformed lists and videos, and duplicates', () => {
    const stored = JSON.stringify({
      schemaVersion: 1,
      library: {
        lists: [
          { id: 'later', name: 'Later', videos: [buildSavedVideo('a'), buildSavedVideo('a'), {}] },
          { id: 'later', name: 'Duplicate id', videos: [] },
          { name: 'No id', videos: [] },
        ],
      },
    });

    expect(parseStoredSavedVideoLibrary(stored)).toEqual({
      lists: [{ id: 'later', name: 'Later', videos: [buildSavedVideo('a')] }],
    });
  });
});
