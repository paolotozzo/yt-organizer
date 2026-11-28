import { describe, expect, it } from '@jest/globals';

import {
  addChannelsToFolder,
  applyFolderMembershipChanges,
  createEmptyFolderLibrary,
  createFolder,
  type FolderLibrary,
} from './folderLibrary';
import {
  getNextTopicCheckState,
  getTopicCheckStates,
  getTopicMembershipChanges,
  type TopicCheckState,
} from './topicChecks';

/** Tech holds both channels, Health only one, News none. */
function buildLibrary(): FolderLibrary {
  const withFolders = ['Tech', 'Health', 'News'].reduce(
    (library, name) => createFolder(library, { id: name.toLowerCase(), name }),
    createEmptyFolderLibrary(),
  );

  return addChannelsToFolder(
    addChannelsToFolder(withFolders, ['c1', 'c2'], 'tech'),
    ['c1'],
    'health',
  );
}

function tapTimes(initialState: TopicCheckState, taps: number): TopicCheckState[] {
  const states: TopicCheckState[] = [];
  let state = initialState;

  for (let tap = 0; tap < taps; tap += 1) {
    state = getNextTopicCheckState(initialState, state);
    states.push(state);
  }

  return states;
}

describe('getTopicCheckStates', () => {
  it('shows checked, partial or unchecked depending on how many channels are in a topic', () => {
    expect(getTopicCheckStates(buildLibrary(), ['c1', 'c2'])).toEqual({
      tech: 'checked',
      health: 'partial',
      news: 'unchecked',
    });
  });

  it('is only checked or unchecked for a single channel', () => {
    expect(getTopicCheckStates(buildLibrary(), ['c2'])).toEqual({
      tech: 'checked',
      health: 'unchecked',
      news: 'unchecked',
    });
  });
});

describe('getNextTopicCheckState', () => {
  it('swaps checked and unchecked', () => {
    expect(tapTimes('checked', 2)).toEqual(['unchecked', 'checked']);
    expect(tapTimes('unchecked', 2)).toEqual(['checked', 'unchecked']);
  });

  it('cycles a partial topic through checked and unchecked back to partial', () => {
    expect(tapTimes('partial', 3)).toEqual(['checked', 'unchecked', 'partial']);
  });
});

describe('getTopicMembershipChanges', () => {
  it('only reports topics the user changed, and never a partial one', () => {
    const initialStates = getTopicCheckStates(buildLibrary(), ['c1', 'c2']);

    expect(
      getTopicMembershipChanges(initialStates, {
        tech: 'unchecked',
        health: 'partial',
        news: 'checked',
        created: 'checked',
      }),
    ).toEqual({ tech: 'remove', news: 'add', created: 'add' });
  });

  it('turns a partial topic into one that holds every selected channel', () => {
    const library = buildLibrary();
    const initialStates = getTopicCheckStates(library, ['c1', 'c2']);
    const changes = getTopicMembershipChanges(initialStates, {
      ...initialStates,
      health: 'checked',
    });

    const updatedLibrary = applyFolderMembershipChanges(library, ['c1', 'c2'], changes);

    expect(getTopicCheckStates(updatedLibrary, ['c1', 'c2']).health).toBe('checked');
    expect(updatedLibrary.folderIdsByChannelId).toEqual({
      c1: ['tech', 'health'],
      c2: ['tech', 'health'],
    });
  });
});
