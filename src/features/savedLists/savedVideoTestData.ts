import type { SavedVideo } from './savedVideoLists';

/** A saved video for tests; only the id varies. */
export function buildSavedVideo(videoId: string): SavedVideo {
  return {
    videoId,
    title: `Video ${videoId}`,
    thumbnailUrl: null,
    publishedAt: 1_700_000_000_000,
    durationSeconds: 600,
    viewCount: 1000,
    liveStatus: 'none',
    channelId: 'UCchannel',
    channelTitle: 'Some channel',
    channelThumbnailUrl: null,
    savedAt: 1_800_000_000_000,
  };
}
