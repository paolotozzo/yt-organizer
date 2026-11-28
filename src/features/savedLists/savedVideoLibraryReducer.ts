import {
  addVideoToList,
  createList,
  deleteList,
  removeVideoFromList,
  renameList,
  type SavedVideo,
  type SavedVideoLibrary,
} from './savedVideoLists';

export type SavedVideoLibraryAction =
  | { type: 'libraryLoaded'; library: SavedVideoLibrary }
  | { type: 'listCreated'; listId: string; listName: string }
  | { type: 'listRenamed'; listId: string; listName: string }
  | { type: 'listDeleted'; listId: string }
  | { type: 'videoAdded'; listId: string; video: SavedVideo }
  | { type: 'videoRemoved'; listId: string; videoId: string };

export function savedVideoLibraryReducer(
  library: SavedVideoLibrary,
  action: SavedVideoLibraryAction,
): SavedVideoLibrary {
  switch (action.type) {
    case 'libraryLoaded':
      return action.library;
    case 'listCreated':
      return createList(library, { id: action.listId, name: action.listName });
    case 'listRenamed':
      return renameList(library, action.listId, action.listName);
    case 'listDeleted':
      return deleteList(library, action.listId);
    case 'videoAdded':
      return addVideoToList(library, action.listId, action.video);
    case 'videoRemoved':
      return removeVideoFromList(library, action.listId, action.videoId);
  }
}
