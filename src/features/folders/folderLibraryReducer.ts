import {
  createFolder,
  deleteFolder,
  forgetUnsubscribedChannels,
  moveChannelsToFolder,
  moveFolder,
  renameFolder,
  setChannelPinned,
  setFolderPinned,
  unassignChannels,
  type FolderLibrary,
} from './folderLibrary';

export type FolderLibraryAction =
  | { type: 'libraryLoaded'; library: FolderLibrary }
  | { type: 'folderCreated'; folderId: string; folderName: string }
  | { type: 'folderRenamed'; folderId: string; folderName: string }
  | { type: 'folderDeleted'; folderId: string }
  | { type: 'folderPinToggled'; folderId: string; isPinned: boolean }
  | { type: 'folderMoved'; fromIndex: number; toIndex: number }
  | { type: 'channelsMovedToFolder'; channelIds: string[]; folderId: string }
  | { type: 'channelsUnassigned'; channelIds: string[] }
  | { type: 'channelPinToggled'; folderId: string; channelId: string; isPinned: boolean }
  | { type: 'subscriptionsRefreshed'; subscribedChannelIds: ReadonlySet<string> };

export function folderLibraryReducer(
  library: FolderLibrary,
  action: FolderLibraryAction,
): FolderLibrary {
  switch (action.type) {
    case 'libraryLoaded':
      return action.library;
    case 'folderCreated':
      return createFolder(library, { id: action.folderId, name: action.folderName });
    case 'folderRenamed':
      return renameFolder(library, action.folderId, action.folderName);
    case 'folderDeleted':
      return deleteFolder(library, action.folderId);
    case 'folderPinToggled':
      return setFolderPinned(library, action.folderId, action.isPinned);
    case 'folderMoved':
      return moveFolder(library, action.fromIndex, action.toIndex);
    case 'channelsMovedToFolder':
      return moveChannelsToFolder(library, action.channelIds, action.folderId);
    case 'channelsUnassigned':
      return unassignChannels(library, action.channelIds);
    case 'channelPinToggled':
      return setChannelPinned(library, action.folderId, action.channelId, action.isPinned);
    case 'subscriptionsRefreshed':
      return forgetUnsubscribedChannels(library, action.subscribedChannelIds);
  }
}
