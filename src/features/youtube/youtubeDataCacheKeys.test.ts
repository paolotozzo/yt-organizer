import { describe, expect, it } from '@jest/globals';

import {
  buildCacheKey,
  findOutdatedCacheKeys,
  findUserCacheKeys,
  isCacheEntryFresh,
} from './youtubeDataCacheKeys';

describe('buildCacheKey', () => {
  it('includes the schema version, the user and the entry name', () => {
    expect(buildCacheKey('user-1', 'subscriptions', 3)).toBe('youtubeCache:v3:user-1:subscriptions');
  });
});

describe('findOutdatedCacheKeys', () => {
  it('returns cache keys from other versions and leaves everything else alone', () => {
    const storedKeys = [
      'youtubeCache:v1:user-1:subscriptions',
      'youtubeCache:v2:user-1:subscriptions',
      'youtubeCache:v12:user-1:subscriptions',
      'folderLibrary:user-1',
      'channelSortOrder:user-1',
      'latestUploadCache:user-1',
    ];

    expect(findOutdatedCacheKeys(storedKeys, 2)).toEqual([
      'youtubeCache:v1:user-1:subscriptions',
      'youtubeCache:v12:user-1:subscriptions',
      'latestUploadCache:user-1',
    ]);
  });
});

describe('findUserCacheKeys', () => {
  it("returns only that user's cache keys, never their folders", () => {
    const storedKeys = [
      'youtubeCache:v1:user-1:subscriptions',
      'youtubeCache:v1:user-1:latestUploads',
      'youtubeCache:v1:user-2:subscriptions',
      'folderLibrary:user-1',
    ];

    expect(findUserCacheKeys(storedKeys, 'user-1')).toEqual([
      'youtubeCache:v1:user-1:subscriptions',
      'youtubeCache:v1:user-1:latestUploads',
    ]);
  });
});

describe('isCacheEntryFresh', () => {
  const hour = 60 * 60 * 1000;

  it('is fresh up to the maximum age', () => {
    expect(isCacheEntryFresh({ storedAt: 0, value: 1 }, hour, hour)).toBe(true);
    expect(isCacheEntryFresh({ storedAt: 0, value: 1 }, hour + 1, hour)).toBe(false);
  });

  it('treats an entry from the future as stale', () => {
    expect(isCacheEntryFresh({ storedAt: 2 * hour, value: 1 }, hour, hour)).toBe(false);
  });
});
