import { describe, expect, it } from '@jest/globals';

import type { SubscribedChannel } from '@/features/subscriptions/subscribedChannel';

import {
  createEmptyFolderLibrary,
  createFolder,
  findFolder,
  moveChannelsToFolder,
  setChannelPinned,
  type TopicFolder,
} from './folderLibrary';
import { countChannelsPerFolder, getFolderContents, getUnassignedChannels } from './folderViews';

function buildChannel(channelId: string, title: string): SubscribedChannel {
  return { channelId, title, description: '', thumbnailUrl: null, newItemCount: 0 };
}

const subscribedChannels = [
  buildChannel('zeta', 'Zeta Science'),
  buildChannel('alpha', 'alpha tech'),
  buildChannel('mid', 'Mid Health'),
  buildChannel('beta', 'Beta News'),
];

const libraryWithTechFolder = setChannelPinned(
  moveChannelsToFolder(
    createFolder(createEmptyFolderLibrary(), { id: 'tech', name: 'Tech' }),
    ['zeta', 'alpha', 'mid', 'unsubscribed'],
    'tech',
  ),
  'tech',
  'mid',
  true,
);
const techFolder = findFolder(libraryWithTechFolder, 'tech') as TopicFolder;

function titlesOf(channels: SubscribedChannel[]): string[] {
  return channels.map((channel) => channel.title);
}

describe('getFolderContents', () => {
  it('lists pinned channels first and keeps the given order for the rest', () => {
    const contents = getFolderContents(libraryWithTechFolder, techFolder, subscribedChannels);

    expect(titlesOf(contents.pinnedChannels)).toEqual(['Mid Health']);
    expect(titlesOf(contents.otherChannels)).toEqual(['Zeta Science', 'alpha tech']);
  });

  it('skips assigned channels the user no longer subscribes to', () => {
    const contents = getFolderContents(libraryWithTechFolder, techFolder, subscribedChannels);
    const channelIds = [...contents.pinnedChannels, ...contents.otherChannels].map(
      (channel) => channel.channelId,
    );

    expect(channelIds).not.toContain('unsubscribed');
  });
});

describe('getUnassignedChannels', () => {
  it('returns only channels in no folder', () => {
    expect(titlesOf(getUnassignedChannels(libraryWithTechFolder, subscribedChannels))).toEqual([
      'Beta News',
    ]);
  });
});

describe('countChannelsPerFolder', () => {
  it('counts only subscribed channels', () => {
    expect(countChannelsPerFolder(libraryWithTechFolder, subscribedChannels).get('tech')).toBe(3);
  });
});
