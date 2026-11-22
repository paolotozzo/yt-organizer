import { describe, expect, it } from '@jest/globals';

import {
  findChannelsNeedingCheck,
  parseStoredLatestUploadCache,
  updateLatestUploadCache,
  type LatestUploadCache,
} from './latestUploadCache';

const HOUR = 60 * 60 * 1000;
const now = 100 * HOUR;

const cache: LatestUploadCache = {
  fresh: { checkedAt: now - HOUR, latestUploadAt: 5 },
  stale: { checkedAt: now - 10 * HOUR, latestUploadAt: 7 },
};

describe('findChannelsNeedingCheck', () => {
  it('returns channels never checked or checked too long ago', () => {
    expect(findChannelsNeedingCheck(cache, ['fresh', 'stale', 'new'], now, 6 * HOUR)).toEqual([
      'stale',
      'new',
    ]);
  });
});

describe('updateLatestUploadCache', () => {
  it('overwrites old checks and forgets unsubscribed channels', () => {
    const updatedCache = updateLatestUploadCache(
      cache,
      { stale: { checkedAt: now, latestUploadAt: 9 } },
      new Set(['stale']),
    );

    expect(updatedCache).toEqual({ stale: { checkedAt: now, latestUploadAt: 9 } });
  });
});

describe('parseStoredLatestUploadCache', () => {
  it('round-trips valid data and drops malformed entries', () => {
    const stored = JSON.stringify({
      ...cache,
      broken: { checkedAt: 'yesterday' },
      noUploads: { checkedAt: 1, latestUploadAt: null },
    });

    expect(parseStoredLatestUploadCache(stored)).toEqual({
      ...cache,
      noUploads: { checkedAt: 1, latestUploadAt: null },
    });
  });

  it('returns an empty cache for missing or corrupt data', () => {
    expect(parseStoredLatestUploadCache(null)).toEqual({});
    expect(parseStoredLatestUploadCache('[1,2]')).toEqual({});
    expect(parseStoredLatestUploadCache('{oops')).toEqual({});
  });
});
