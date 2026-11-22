import { compareChannelsByTitle, type SubscribedChannel } from '@/features/subscriptions/subscribedChannel';

export type ChannelSortOrder = 'alphabetical' | 'relevance' | 'unread' | 'latestUpload';

/** Sort orders that come straight from subscriptions.list. */
export type RankedSortOrder = Extract<ChannelSortOrder, 'relevance' | 'unread'>;

export const CHANNEL_SORT_ORDERS: readonly { value: ChannelSortOrder; label: string; description: string }[] = [
  {
    value: 'relevance',
    label: 'Relevance',
    description: "YouTube's ranking, roughly the channels you engage with most",
  },
  {
    value: 'unread',
    label: 'Unread',
    description: 'Channels with activity you have not seen yet come first',
  },
  {
    value: 'latestUpload',
    label: 'Latest upload',
    description: 'Channels that uploaded most recently come first',
  },
  { value: 'alphabetical', label: 'A to Z', description: 'Channel names in alphabetical order' },
];

/** Everything needed to sort, beyond the channels themselves. Missing data sorts last. */
export type ChannelSortData = {
  /** Position of each channel in YouTube's list for that order (0 = first). */
  rankByChannelIdByOrder: Partial<Record<RankedSortOrder, ReadonlyMap<string, number>>>;
  latestUploadAtByChannelId: ReadonlyMap<string, number | null>;
};

export function buildRankByChannelId(channelIdsInApiOrder: readonly string[]): Map<string, number> {
  return new Map(channelIdsInApiOrder.map((channelId, index) => [channelId, index]));
}

/** Returns a new array sorted by `sortOrder`. Ties, and channels without data, go by title. */
export function sortChannels(
  channels: readonly SubscribedChannel[],
  sortOrder: ChannelSortOrder,
  sortData: ChannelSortData,
): SubscribedChannel[] {
  const compareByOrder = buildComparator(sortOrder, sortData);

  return [...channels].sort(
    (firstChannel, secondChannel) =>
      compareByOrder(firstChannel, secondChannel) ||
      compareChannelsByTitle(firstChannel, secondChannel),
  );
}

type ChannelComparator = (firstChannel: SubscribedChannel, secondChannel: SubscribedChannel) => number;

function buildComparator(sortOrder: ChannelSortOrder, sortData: ChannelSortData): ChannelComparator {
  switch (sortOrder) {
    case 'alphabetical':
      return () => 0;
    case 'relevance':
    case 'unread': {
      const rankByChannelId = sortData.rankByChannelIdByOrder[sortOrder];
      // Lower rank first.
      return compareByNumberWithMissingLast(
        (channel) => rankByChannelId?.get(channel.channelId),
        'ascending',
      );
    }
    case 'latestUpload':
      // Newest upload first.
      return compareByNumberWithMissingLast(
        (channel) => sortData.latestUploadAtByChannelId.get(channel.channelId) ?? undefined,
        'descending',
      );
  }
}

function compareByNumberWithMissingLast(
  readValue: (channel: SubscribedChannel) => number | undefined,
  direction: 'ascending' | 'descending',
): ChannelComparator {
  return (firstChannel, secondChannel) => {
    const firstValue = readValue(firstChannel);
    const secondValue = readValue(secondChannel);

    if (firstValue === undefined || secondValue === undefined) {
      return Number(firstValue === undefined) - Number(secondValue === undefined);
    }

    return direction === 'ascending' ? firstValue - secondValue : secondValue - firstValue;
  };
}
