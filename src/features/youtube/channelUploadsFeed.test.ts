import { describe, expect, it } from '@jest/globals';

import { buildChannelUploadsFeedUrl, findLatestUpload } from './channelUploadsFeed';

function buildFeed(entryPublishedTimes: string[]): string {
  const entries = entryPublishedTimes
    .map(
      (publishedAt, index) => `
  <entry>
    <id>yt:video:video${index}</id>
    <yt:videoId>video${index}</yt:videoId>
    <title>Video ${index}</title>
    <published>${publishedAt}</published>
    <updated>2030-01-01T00:00:00+00:00</updated>
  </entry>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns="http://www.w3.org/2005/Atom">
  <yt:channelId>UCabc</yt:channelId>
  <title>Some channel</title>
  <published>2010-03-04T05:06:07+00:00</published>${entries}
</feed>`;
}

describe('findLatestUpload', () => {
  it('returns the newest entry, ignoring the channel creation date', () => {
    const feed = buildFeed(['2026-11-20T10:00:00+00:00', '2026-11-27T08:30:00+00:00']);

    expect(findLatestUpload(feed)).toEqual({
      videoId: 'video1',
      publishedAt: Date.parse('2026-11-27T08:30:00Z'),
    });
  });

  it('returns null for a feed without videos', () => {
    expect(findLatestUpload(buildFeed([]))).toBeNull();
  });

  it('skips entries whose date cannot be read', () => {
    const feed = buildFeed(['not a date', '2026-11-01T00:00:00+00:00']);

    expect(findLatestUpload(feed)).toEqual({
      videoId: 'video1',
      publishedAt: Date.parse('2026-11-01T00:00:00Z'),
    });
  });
});

describe('buildChannelUploadsFeedUrl', () => {
  it('points at the public feed of the channel', () => {
    expect(buildChannelUploadsFeedUrl('UCabc_123')).toBe(
      'https://www.youtube.com/feeds/videos.xml?channel_id=UCabc_123',
    );
  });
});
