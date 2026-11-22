import { createContext, useCallback, useContext, useEffect, useMemo, type PropsWithChildren } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import {
  validateFolderName,
  type FolderLibrary,
  type FolderNameValidation,
} from '@/features/folders/folderLibrary';
import { usePersistedFolderLibrary } from '@/features/folders/usePersistedFolderLibrary';
import type { SubscribedChannel } from '@/features/subscriptions/subscribedChannel';
import {
  useSubscribedChannels,
  type SubscribedChannelsState,
} from '@/features/subscriptions/useSubscribedChannels';

/** Creating or renaming returns the validation, so dialogs can show why a name was refused. */
type FolderNameResult = FolderNameValidation & { folderId?: string };

type ChannelInboxContextValue = {
  subscriptionsState: SubscribedChannelsState;
  /** Empty until the subscriptions have loaded. */
  subscribedChannels: SubscribedChannel[];
  isRefreshing: boolean;
  refreshSubscriptions: () => Promise<void>;
  isLibraryLoaded: boolean;
  library: FolderLibrary;
  createFolder: (proposedName: string) => FolderNameResult;
  renameFolder: (folderId: string, proposedName: string) => FolderNameResult;
  deleteFolder: (folderId: string) => void;
  setFolderPinned: (folderId: string, isPinned: boolean) => void;
  moveFolder: (fromIndex: number, toIndex: number) => void;
  moveChannelsToFolder: (channelIds: string[], folderId: string) => void;
  unassignChannels: (channelIds: string[]) => void;
  setChannelPinned: (folderId: string, channelId: string, isPinned: boolean) => void;
};

type ChannelInboxProviderProps = PropsWithChildren<{
  /** The signed-in Google user, whose folders are loaded and saved. */
  userId: string;
}>;

const ChannelInboxContext = createContext<ChannelInboxContextValue | null>(null);

const NO_CHANNELS: SubscribedChannel[] = [];

/**
 * The "organized inbox": the user's YouTube subscriptions plus the topic folders they sort
 * them into. Mounted only for signed-in users; remounting with another `userId` loads
 * that user's folders.
 */
export function ChannelInboxProvider({ userId, children }: ChannelInboxProviderProps) {
  const { getAccessToken } = useAuth();
  const subscriptions = useSubscribedChannels(getAccessToken);
  const { library, isLibraryLoaded, dispatch } = usePersistedFolderLibrary(userId);
  const subscribedChannels =
    subscriptions.state.status === 'loaded' ? subscriptions.state.channels : NO_CHANNELS;

  useEffect(() => {
    if (isLibraryLoaded && subscriptions.state.status === 'loaded') {
      const subscribedChannelIds = new Set(
        subscriptions.state.channels.map((channel) => channel.channelId),
      );
      dispatch({ type: 'subscriptionsRefreshed', subscribedChannelIds });
    }
  }, [dispatch, isLibraryLoaded, subscriptions.state]);

  const createFolder = useCallback(
    (proposedName: string): FolderNameResult => {
      const validation = validateFolderName(library, proposedName);

      if (!validation.isValid) {
        return validation;
      }

      const folderId = generateFolderId();
      dispatch({ type: 'folderCreated', folderId, folderName: validation.folderName });
      return { ...validation, folderId };
    },
    [dispatch, library],
  );

  const renameFolder = useCallback(
    (folderId: string, proposedName: string): FolderNameResult => {
      const validation = validateFolderName(library, proposedName, folderId);

      if (validation.isValid) {
        dispatch({ type: 'folderRenamed', folderId, folderName: validation.folderName });
      }

      return { ...validation, folderId };
    },
    [dispatch, library],
  );

  const folderActions = useMemo(
    () => ({
      deleteFolder: (folderId: string) => dispatch({ type: 'folderDeleted', folderId }),
      setFolderPinned: (folderId: string, isPinned: boolean) =>
        dispatch({ type: 'folderPinToggled', folderId, isPinned }),
      moveFolder: (fromIndex: number, toIndex: number) =>
        dispatch({ type: 'folderMoved', fromIndex, toIndex }),
      moveChannelsToFolder: (channelIds: string[], folderId: string) =>
        dispatch({ type: 'channelsMovedToFolder', channelIds, folderId }),
      unassignChannels: (channelIds: string[]) =>
        dispatch({ type: 'channelsUnassigned', channelIds }),
      setChannelPinned: (folderId: string, channelId: string, isPinned: boolean) =>
        dispatch({ type: 'channelPinToggled', folderId, channelId, isPinned }),
    }),
    [dispatch],
  );

  const contextValue = useMemo<ChannelInboxContextValue>(
    () => ({
      subscriptionsState: subscriptions.state,
      subscribedChannels,
      isRefreshing: subscriptions.isRefreshing,
      refreshSubscriptions: subscriptions.refresh,
      isLibraryLoaded,
      library,
      createFolder,
      renameFolder,
      ...folderActions,
    }),
    [
      subscriptions.state,
      subscriptions.isRefreshing,
      subscriptions.refresh,
      subscribedChannels,
      isLibraryLoaded,
      library,
      createFolder,
      renameFolder,
      folderActions,
    ],
  );

  return (
    <ChannelInboxContext.Provider value={contextValue}>{children}</ChannelInboxContext.Provider>
  );
}

export function useChannelInbox(): ChannelInboxContextValue {
  const contextValue = useContext(ChannelInboxContext);

  if (!contextValue) {
    throw new Error('useChannelInbox must be used inside a ChannelInboxProvider.');
  }

  return contextValue;
}

function generateFolderId(): string {
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `folder-${Date.now().toString(36)}-${randomSuffix}`;
}
