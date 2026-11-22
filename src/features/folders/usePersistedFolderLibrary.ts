import { useEffect, useReducer, useRef, useState, type Dispatch } from 'react';

import { createEmptyFolderLibrary, type FolderLibrary } from './folderLibrary';
import { folderLibraryReducer, type FolderLibraryAction } from './folderLibraryReducer';
import { loadFolderLibrary, saveFolderLibrary } from './folderLibraryStorage';

type UsePersistedFolderLibraryResult = {
  library: FolderLibrary;
  isLibraryLoaded: boolean;
  dispatch: Dispatch<FolderLibraryAction>;
};

/**
 * Keeps the user's folder library in a reducer, loads it from the device on mount and saves
 * every change back. Callers must wait for `isLibraryLoaded` before dispatching changes,
 * otherwise the stored library would overwrite them when it arrives.
 */
export function usePersistedFolderLibrary(userId: string): UsePersistedFolderLibraryResult {
  const [library, dispatch] = useReducer(folderLibraryReducer, undefined, createEmptyFolderLibrary);
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  const loadedLibraryRef = useRef<FolderLibrary | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function restoreLibrary() {
      let storedLibrary = createEmptyFolderLibrary();

      try {
        storedLibrary = await loadFolderLibrary(userId);
      } catch (error) {
        console.warn('Could not read the folder library from the device', error);
      }

      if (isMounted) {
        loadedLibraryRef.current = storedLibrary;
        dispatch({ type: 'libraryLoaded', library: storedLibrary });
        setIsLibraryLoaded(true);
      }
    }

    restoreLibrary();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  useEffect(() => {
    // Skip the initial empty library and the one just read from storage.
    if (!isLibraryLoaded || library === loadedLibraryRef.current) {
      return;
    }

    saveFolderLibrary(userId, library).catch((error: unknown) => {
      console.warn('Could not save the folder library to the device', error);
    });
  }, [isLibraryLoaded, library, userId]);

  return { library, isLibraryLoaded, dispatch };
}
