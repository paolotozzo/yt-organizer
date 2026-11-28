import {
  applyFolderMembershipChanges,
  createFolder,
  deleteFolder,
  forgetUnsubscribedChannels,
  moveFolder,
  removeChannelsFromFolder,
  renameFolder,
  setChannelPinned,
  setFolderPinned,
  type FolderLibrary,
  type FolderMembershipChange,
} from './folderLibrary';

export type FolderLibraryAction =
  | { type: 'libraryLoaded'; library: FolderLibrary }
  | { type: 'folderCreated'; folderId: string; folderName: string }
  | { type: 'folderRenamed'; folderId: string; folderName: string }
  | { type: 'folderDeleted'; folderId: string }
  | { type: 'folderPinToggled'; folderId: string; isPinned: boolean }
  | { type: 'folderMoved'; fromIndex: number; toIndex: number }
  | { type: 'channelsRemovedFromFolder'; channelIds: string[]; folderId: string }
  | {
      type: 'folderMembershipsChanged';
      channelIds: string[];
      changeByFolderId: Record<string, FolderMembershipChange>;
    }
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
    case 'channelsRemovedFromFolder':
      return removeChannelsFromFolder(library, action.channelIds, action.folderId);
    case 'folderMembershipsChanged':
      return applyFolderMembershipChanges(library, action.channelIds, action.changeByFolderId);
    case 'channelPinToggled':
      return setChannelPinned(library, action.folderId, action.channelId, action.isPinned);
    case 'subscriptionsRefreshed':
      return forgetUnsubscribedChannels(library, action.subscribedChannelIds);
  }
}
