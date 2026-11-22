/**
 * When each channel last uploaded, as checked through the YouTube API. Checking costs one
 * quota unit per channel, so results are kept and only re-checked once they are stale.
 */
export type LatestUploadCheck = {
  /** When the app asked YouTube, in epoch milliseconds. */
  checkedAt: number;
  /** Publish time of the newest upload in epoch milliseconds, or null if there is none. */
  latestUploadAt: number | null;
};

export type LatestUploadCache = Record<string, LatestUploadCheck>;

/** Channels never checked, or last checked longer than `maxAgeMilliseconds` ago. */
export function findChannelsNeedingCheck(
  cache: LatestUploadCache,
  channelIds: readonly string[],
  now: number,
  maxAgeMilliseconds: number,
): string[] {
  return channelIds.filter((channelId) => {
    const check = cache[channelId];
    return !check || now - check.checkedAt > maxAgeMilliseconds;
  });
}

/**
 * Adds fresh checks to the cache and drops channels the user no longer subscribes to, so the
 * stored cache doesn't grow forever.
 */
export function updateLatestUploadCache(
  cache: LatestUploadCache,
  freshChecks: LatestUploadCache,
  subscribedChannelIds: ReadonlySet<string>,
): LatestUploadCache {
  const mergedCache: LatestUploadCache = { ...cache, ...freshChecks };

  return Object.fromEntries(
    Object.entries(mergedCache).filter(([channelId]) => subscribedChannelIds.has(channelId)),
  );
}

/** Checks data read back from the cache before trusting it. */
export function isLatestUploadCache(value: unknown): value is LatestUploadCache {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every(isLatestUploadCheck)
  );
}

function isLatestUploadCheck(value: unknown): value is LatestUploadCheck {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.checkedAt === 'number' &&
    (candidate.latestUploadAt === null || typeof candidate.latestUploadAt === 'number')
  );
}
