const HOUR = 60 * 60 * 1000;

/**
 * How long cached YouTube data is used before the app asks YouTube again. Pull to refresh
 * always fetches fresh data. Cached data is shown right away even when older; the newer
 * copy replaces it once it arrives.
 */
export const youtubeCacheMaxAge = {
  /** The subscription list (also carries the "new items" counts). */
  subscriptions: 6 * HOUR,
  /** YouTube's relevance and unread orders. */
  subscriptionRankings: 6 * HOUR,
  /** Each channel's newest upload, read from the free uploads feeds (one request each). */
  latestUploads: HOUR,
  /** On pull to refresh, latest uploads newer than this are not checked again. */
  latestUploadsOnRefresh: HOUR / 4,
  /** The first page of a channel's videos (older pages are not cached). */
  channelVideos: HOUR,
  /** The user's own playlists, offered when saving a video. */
  playlists: 6 * HOUR,
} as const;

export const youtubeCacheEntryNames = {
  subscriptions: 'subscriptions',
  subscriptionRanking: (order: string) => `subscriptionRanking:${order}`,
  latestUploads: 'latestUploads',
  channelVideos: (channelId: string) => `channelVideos:${channelId}`,
  playlists: 'playlists',
} as const;
