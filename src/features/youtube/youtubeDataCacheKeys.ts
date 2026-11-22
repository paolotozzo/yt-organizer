/**
 * Bump this whenever cached YouTube data changes shape: a new field on SubscribedChannel,
 * different `part`s requested, a changed cache format, and so on. On the next launch every
 * entry stored under an older version is deleted, so the app never reads stale shapes.
 *
 * Only YouTube data lives in this cache. The user's own folders are stored separately and
 * are never cleared by a version bump.
 */
export const YOUTUBE_CACHE_SCHEMA_VERSION = 1;

const CACHE_KEY_PREFIX = 'youtubeCache';

/** Prefixes of YouTube data stored before this cache existed, deleted like old versions. */
const LEGACY_KEY_PREFIXES = ['latestUploadCache:'];

export type CachedEntry<Value> = {
  /** When the value was fetched from YouTube, in epoch milliseconds. */
  storedAt: number;
  value: Value;
};

export function buildCacheKey(
  userId: string,
  entryName: string,
  schemaVersion: number = YOUTUBE_CACHE_SCHEMA_VERSION,
): string {
  return `${CACHE_KEY_PREFIX}:v${schemaVersion}:${userId}:${entryName}`;
}

/** Cache keys written by another schema version, which must be deleted. */
export function findOutdatedCacheKeys(
  storedKeys: readonly string[],
  currentSchemaVersion: number = YOUTUBE_CACHE_SCHEMA_VERSION,
): string[] {
  const currentVersionPrefix = `${CACHE_KEY_PREFIX}:v${currentSchemaVersion}:`;

  return storedKeys.filter(
    (key) =>
      (key.startsWith(`${CACHE_KEY_PREFIX}:`) && !key.startsWith(currentVersionPrefix)) ||
      LEGACY_KEY_PREFIXES.some((legacyPrefix) => key.startsWith(legacyPrefix)),
  );
}

/** Every cache key of one user, in any schema version. */
export function findUserCacheKeys(storedKeys: readonly string[], userId: string): string[] {
  return storedKeys.filter((key) => {
    const [prefix, , keyUserId] = key.split(':');
    return prefix === CACHE_KEY_PREFIX && keyUserId === userId;
  });
}

export function isCacheEntryFresh(
  entry: CachedEntry<unknown>,
  now: number,
  maxAgeMilliseconds: number,
): boolean {
  const age = now - entry.storedAt;
  // A negative age means the phone clock moved backwards: treat the entry as stale.
  return age >= 0 && age <= maxAgeMilliseconds;
}
