import { describe, expect, it } from '@jest/globals';

import type { SubscribedChannel } from '@/features/subscriptions/subscribedChannel';

import { buildRankByChannelId, sortChannels, type ChannelSortData } from './channelSorting';

function buildChannel(channelId: string, title: string): SubscribedChannel {
  return { channelId, title, description: '', thumbnailUrl: null, newItemCount: 0 };
}

const alpha = buildChannel('alpha', 'Alpha');
const bravo = buildChannel('bravo', 'bravo');
const charlie = buildChannel('charlie', 'Charlie');
const delta = buildChannel('delta', 'Delta');
const channels = [delta, charlie, bravo, alpha];

const noSortData: ChannelSortData = {
  rankByChannelIdByOrder: {},
  latestUploadAtByChannelId: new Map(),
};

function idsOf(sortedChannels: SubscribedChannel[]): string[] {
  return sortedChannels.map((channel) => channel.channelId);
}

describe('sortChannels', () => {
  it('sorts alphabetically, ignoring case', () => {
    expect(idsOf(sortChannels(channels, 'alphabetical', noSortData))).toEqual([
      'alpha',
      'bravo',
      'charlie',
      'delta',
    ]);
  });

  it('follows the rank YouTube returned for relevance', () => {
    const sortData: ChannelSortData = {
      ...noSortData,
      rankByChannelIdByOrder: { relevance: buildRankByChannelId([charlie, alpha, delta, bravo]) },
    };

    expect(idsOf(sortChannels(channels, 'relevance', sortData))).toEqual([
      'charlie',
      'alpha',
      'delta',
      'bravo',
    ]);
  });

  it('puts unranked channels last, by title', () => {
    const sortData: ChannelSortData = {
      ...noSortData,
      rankByChannelIdByOrder: { unread: buildRankByChannelId([delta]) },
    };

    expect(idsOf(sortChannels(channels, 'unread', sortData))).toEqual([
      'delta',
      'alpha',
      'bravo',
      'charlie',
    ]);
  });

  it('puts the newest upload first and channels without uploads last', () => {
    const sortData: ChannelSortData = {
      ...noSortData,
      latestUploadAtByChannelId: new Map([
        ['alpha', 1_000],
        ['bravo', 3_000],
        ['charlie', null],
        ['delta', 2_000],
      ]),
    };

    expect(idsOf(sortChannels(channels, 'latestUpload', sortData))).toEqual([
      'bravo',
      'delta',
      'alpha',
      'charlie',
    ]);
  });

  it('does not mutate the input', () => {
    const input = [...channels];

    sortChannels(input, 'alphabetical', noSortData);

    expect(input).toEqual(channels);
  });
});
