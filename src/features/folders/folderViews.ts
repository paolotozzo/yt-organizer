import type { SubscribedChannel } from '@/features/subscriptions/subscribedChannel';

import {
  getFolderIdsOfChannel,
  isChannelInFolder,
  type FolderLibrary,
  type TopicFolder,
} from './folderLibrary';

export type FolderContents = {
  /** Pinned channels, in the order they were pinned. */
  pinnedChannels: SubscribedChannel[];
  /** The rest of the folder, in the order of `subscribedChannels`. */
  otherChannels: SubscribedChannel[];
};

/**
 * The channels of one folder, pinned ones first. Only channels the user still subscribes to
 * are returned, so a stale assignment never shows up as an empty row. Pass the channels
 * already sorted the way the user chose; that order is kept.
 */
export function getFolderContents(
  library: FolderLibrary,
  folder: TopicFolder,
  subscribedChannels: readonly SubscribedChannel[],
): FolderContents {
  const channelsInFolder = subscribedChannels.filter(
    (channel) => isChannelInFolder(library, channel.channelId, folder.id),
  );
  const channelsById = new Map(channelsInFolder.map((channel) => [channel.channelId, channel]));
  const pinnedChannelIds = new Set(folder.pinnedChannelIds);

  const pinnedChannels = folder.pinnedChannelIds
    .map((channelId) => channelsById.get(channelId))
    .filter((channel): channel is SubscribedChannel => channel !== undefined);
  const otherChannels = channelsInFolder.filter(
    (channel) => !pinnedChannelIds.has(channel.channelId),
  );

  return { pinnedChannels, otherChannels };
}

/** Subscribed channels that are in no folder at all, in the order of `subscribedChannels`. */
export function getUnassignedChannels(
  library: FolderLibrary,
  subscribedChannels: readonly SubscribedChannel[],
): SubscribedChannel[] {
  return subscribedChannels.filter(
    (channel) => getFolderIdsOfChannel(library, channel.channelId).length === 0,
  );
}

/** How many subscribed channels each folder holds, keyed by folder id. A channel in two folders counts in both. */
export function countChannelsPerFolder(
  library: FolderLibrary,
  subscribedChannels: readonly SubscribedChannel[],
): Map<string, number> {
  const channelCountByFolderId = new Map<string, number>();

  for (const channel of subscribedChannels) {
    for (const folderId of getFolderIdsOfChannel(library, channel.channelId)) {
      channelCountByFolderId.set(folderId, (channelCountByFolderId.get(folderId) ?? 0) + 1);
    }
  }

  return channelCountByFolderId;
}
