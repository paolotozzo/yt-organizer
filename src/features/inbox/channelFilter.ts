import { findFolder, type FolderLibrary } from '@/features/folders/folderLibrary';
import {
  getFolderContents,
  getUnassignedChannels,
  type FolderContents,
} from '@/features/folders/folderViews';
import type { SubscribedChannel } from '@/features/subscriptions/subscribedChannel';

/** Which channels the inbox shows, picked with the topic pills. */
export type ChannelFilter =
  | { kind: 'all' }
  | { kind: 'unassigned' }
  | { kind: 'folder'; folderId: string };

export const ALL_CHANNELS_FILTER: ChannelFilter = { kind: 'all' };

export function isSameChannelFilter(first: ChannelFilter, second: ChannelFilter): boolean {
  if (first.kind === 'folder' && second.kind === 'folder') {
    return first.folderId === second.folderId;
  }

  return first.kind === second.kind;
}

/**
 * The channels a filter shows, in the order of `subscribedChannels`. Only a folder has pinned
 * channels. A folder that no longer exists shows nothing; the screen falls back to "All".
 */
export function getChannelsForFilter(
  library: FolderLibrary,
  subscribedChannels: readonly SubscribedChannel[],
  filter: ChannelFilter,
): FolderContents {
  switch (filter.kind) {
    case 'all':
      return { pinnedChannels: [], otherChannels: [...subscribedChannels] };
    case 'unassigned':
      return {
        pinnedChannels: [],
        otherChannels: getUnassignedChannels(library, subscribedChannels),
      };
    case 'folder': {
      const folder = findFolder(library, filter.folderId);
      return folder
        ? getFolderContents(library, folder, subscribedChannels)
        : { pinnedChannels: [], otherChannels: [] };
    }
  }
}
