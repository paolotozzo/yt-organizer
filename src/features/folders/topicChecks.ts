import {
  isChannelInFolder,
  type FolderLibrary,
  type FolderMembershipChange,
} from './folderLibrary';

/**
 * How a topic (folder) looks in the topics sheet for the selected channels, like labels in
 * Gmail: checked when every channel is in it, partial when only some are, else unchecked.
 */
export type TopicCheckState = 'checked' | 'partial' | 'unchecked';

export function getTopicCheckState(
  library: FolderLibrary,
  channelIds: readonly string[],
  folderId: string,
): TopicCheckState {
  const channelsInTopic = channelIds.filter((channelId) =>
    isChannelInFolder(library, channelId, folderId),
  ).length;

  if (channelsInTopic === 0) {
    return 'unchecked';
  }

  return channelsInTopic === channelIds.length ? 'checked' : 'partial';
}

/** The check state of every topic for the selected channels, keyed by folder id. */
export function getTopicCheckStates(
  library: FolderLibrary,
  channelIds: readonly string[],
): Record<string, TopicCheckState> {
  return Object.fromEntries(
    library.folders.map((folder) => [
      folder.id,
      getTopicCheckState(library, channelIds, folder.id),
    ]),
  );
}

/**
 * The state after a tap. Checked and unchecked swap. A topic that started partial goes
 * partial, checked, unchecked and back to partial, so the user can always return to leaving
 * it as it was.
 */
export function getNextTopicCheckState(
  initialState: TopicCheckState,
  currentState: TopicCheckState,
): TopicCheckState {
  switch (currentState) {
    case 'partial':
      return 'checked';
    case 'checked':
      return 'unchecked';
    case 'unchecked':
      return initialState === 'partial' ? 'partial' : 'checked';
  }
}

/**
 * What tapping Done changes: topics now checked get every channel, topics now unchecked lose
 * them all, and topics that are still as they started, or partial, are left alone.
 */
export function getTopicMembershipChanges(
  initialStates: Readonly<Record<string, TopicCheckState>>,
  currentStates: Readonly<Record<string, TopicCheckState>>,
): Record<string, FolderMembershipChange> {
  const changeByFolderId: Record<string, FolderMembershipChange> = {};

  for (const [folderId, currentState] of Object.entries(currentStates)) {
    if (currentState === initialStates[folderId] || currentState === 'partial') {
      continue;
    }

    changeByFolderId[folderId] = currentState === 'checked' ? 'add' : 'remove';
  }

  return changeByFolderId;
}
