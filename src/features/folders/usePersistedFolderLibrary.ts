import type { Dispatch } from 'react';

import { usePersistedReducer } from '@/utils/usePersistedReducer';

import { createEmptyFolderLibrary, type FolderLibrary } from './folderLibrary';
import { folderLibraryReducer, type FolderLibraryAction } from './folderLibraryReducer';
import { loadFolderLibrary, saveFolderLibrary } from './folderLibraryStorage';

type UsePersistedFolderLibraryResult = {
  library: FolderLibrary;
  isLibraryLoaded: boolean;
  dispatch: Dispatch<FolderLibraryAction>;
};

function restoreFolderLibrary(library: FolderLibrary): FolderLibraryAction {
  return { type: 'libraryLoaded', library };
}

/**
 * The user's folder library, loaded from the device on mount and saved back after every
 * change. Callers must wait for `isLibraryLoaded` before dispatching changes.
 */
export function usePersistedFolderLibrary(userId: string): UsePersistedFolderLibraryResult {
  const { state, isLoaded, dispatch } = usePersistedReducer({
    storageKey: userId,
    reducer: folderLibraryReducer,
    createInitialState: createEmptyFolderLibrary,
    createRestoredAction: restoreFolderLibrary,
    loadState: loadFolderLibrary,
    saveState: saveFolderLibrary,
    description: 'folder library',
  });

  return { library: state, isLibraryLoaded: isLoaded, dispatch };
}
