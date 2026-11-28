import { createContext, useCallback, useContext, useMemo, type PropsWithChildren } from 'react';

import type { SubscribedChannel } from '@/features/subscriptions/subscribedChannel';
import type { ChannelVideo } from '@/features/videos/channelVideo';
import { generateLocalId } from '@/utils/generateLocalId';
import { usePersistedReducer } from '@/utils/usePersistedReducer';

import { savedVideoLibraryReducer, type SavedVideoLibraryAction } from './savedVideoLibraryReducer';
import {
  deviceSavedVideoLibraryStore,
  type SavedVideoLibraryStore,
} from './savedVideoLibraryStore';
import {
  createEmptySavedVideoLibrary,
  validateListName,
  type ListNameValidation,
  type SavedVideoLibrary,
} from './savedVideoLists';

/** Creating or renaming returns the validation, so forms can show why a name was refused. */
export type ListNameResult = ListNameValidation & { listId?: string };

/** The channel a video is saved from, so the list can show it later. */
export type VideoChannel = Pick<SubscribedChannel, 'channelId' | 'title' | 'thumbnailUrl'>;

type SavedVideoListsContextValue = {
  library: SavedVideoLibrary;
  isLibraryLoaded: boolean;
  createList: (proposedName: string) => ListNameResult;
  renameList: (listId: string, proposedName: string) => ListNameResult;
  deleteList: (listId: string) => void;
  addVideoToList: (listId: string, video: ChannelVideo, channel: VideoChannel) => void;
  removeVideoFromList: (listId: string, videoId: string) => void;
};

type SavedVideoListsProviderProps = PropsWithChildren<{
  userId: string;
  /** Where lists are kept; the device unless a test or a future backend passes another. */
  store?: SavedVideoLibraryStore;
}>;

const SavedVideoListsContext = createContext<SavedVideoListsContextValue | null>(null);

function restoreSavedVideoLibrary(library: SavedVideoLibrary): SavedVideoLibraryAction {
  return { type: 'libraryLoaded', library };
}

/** The user's own video lists, kept on the device and shared by every signed-in screen. */
export function SavedVideoListsProvider({
  userId,
  store = deviceSavedVideoLibraryStore,
  children,
}: SavedVideoListsProviderProps) {
  const {
    state: library,
    isLoaded,
    dispatch,
  } = usePersistedReducer({
    storageKey: userId,
    reducer: savedVideoLibraryReducer,
    createInitialState: createEmptySavedVideoLibrary,
    createRestoredAction: restoreSavedVideoLibrary,
    loadState: store.load,
    saveState: store.save,
    description: 'saved video lists',
  });

  const createList = useCallback(
    (proposedName: string): ListNameResult => {
      const validation = validateListName(library, proposedName);

      if (!validation.isValid || !isLoaded) {
        return validation;
      }

      const listId = generateLocalId('list');
      dispatch({ type: 'listCreated', listId, listName: validation.listName });
      return { ...validation, listId };
    },
    [dispatch, isLoaded, library],
  );

  const renameList = useCallback(
    (listId: string, proposedName: string): ListNameResult => {
      const validation = validateListName(library, proposedName, listId);

      if (validation.isValid) {
        dispatch({ type: 'listRenamed', listId, listName: validation.listName });
      }

      return validation;
    },
    [dispatch, library],
  );

  const contextValue = useMemo<SavedVideoListsContextValue>(
    () => ({
      library,
      isLibraryLoaded: isLoaded,
      createList,
      renameList,
      deleteList: (listId) => dispatch({ type: 'listDeleted', listId }),
      addVideoToList: (listId, video, channel) =>
        dispatch({
          type: 'videoAdded',
          listId,
          video: {
            ...video,
            channelId: channel.channelId,
            channelTitle: channel.title,
            channelThumbnailUrl: channel.thumbnailUrl,
            savedAt: Date.now(),
          },
        }),
      removeVideoFromList: (listId, videoId) => dispatch({ type: 'videoRemoved', listId, videoId }),
    }),
    [createList, dispatch, isLoaded, library, renameList],
  );

  return (
    <SavedVideoListsContext.Provider value={contextValue}>
      {children}
    </SavedVideoListsContext.Provider>
  );
}

export function useSavedVideoLists(): SavedVideoListsContextValue {
  const contextValue = useContext(SavedVideoListsContext);

  if (!contextValue) {
    throw new Error('useSavedVideoLists must be used inside a SavedVideoListsProvider.');
  }

  return contextValue;
}
