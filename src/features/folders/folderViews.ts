import { compareChannelsByTitle, type SubscribedChannel } from '@/features/subscriptions/subscribedChannel';

import type { FolderLibrary, TopicFolder } from './folderLibrary';

export type FolderContents = {
  /** Pinned channels, in the order they were pinned. */
  pinnedChannels: SubscribedChannel[];
  /** The rest of the folder, sorted by title. */
  otherChannels: SubscribedChannel[];
};

/**
 * The channels of one folder, pinned ones first. Only channels the user still subscribes to
 * are returned, so a stale assignment never shows up as an empty row.
 */
export function getFolderContents(
  library: FolderLibrary,
  folder: TopicFolder,
  subscribedChannels: readonly SubscribedChannel[],
): FolderContents {
  const channelsInFolder = subscribedChannels.filter(
    (channel) => library.folderIdByChannelId[channel.channelId] === folder.id,
  );
  const channelsById = new Map(channelsInFolder.map((channel) => [channel.channelId, channel]));
  const pinnedChannelIds = new Set(folder.pinnedChannelIds);

  const pinnedChannels = folder.pinnedChannelIds
    .map((channelId) => channelsById.get(channelId))
    .filter((channel): channel is SubscribedChannel => channel !== undefined);
  const otherChannels = channelsInFolder
    .filter((channel) => !pinnedChannelIds.has(channel.channelId))
    .sort(compareChannelsByTitle);

  return { pinnedChannels, otherChannels };
}

/** Subscribed channels that are in no folder yet, sorted by title. */
export function getUnassignedChannels(
  library: FolderLibrary,
  subscribedChannels: readonly SubscribedChannel[],
): SubscribedChannel[] {
  return subscribedChannels
    .filter((channel) => library.folderIdByChannelId[channel.channelId] === undefined)
    .sort(compareChannelsByTitle);
}

/** How many subscribed channels each folder holds, keyed by folder id. */
export function countChannelsPerFolder(
  library: FolderLibrary,
  subscribedChannels: readonly SubscribedChannel[],
): Map<string, number> {
  const channelCountByFolderId = new Map<string, number>();

  for (const channel of subscribedChannels) {
    const folderId = library.folderIdByChannelId[channel.channelId];

    if (folderId !== undefined) {
      channelCountByFolderId.set(folderId, (channelCountByFolderId.get(folderId) ?? 0) + 1);
    }
  }

  return channelCountByFolderId;
}
