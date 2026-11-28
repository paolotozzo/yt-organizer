/** A video uploaded by a channel, with what the video list shows about it. */
export type ChannelVideo = {
  videoId: string;
  title: string;
  thumbnailUrl: string | null;
  /** Publish time in epoch milliseconds. */
  publishedAt: number;
  /** Null for live streams and premieres, which have no fixed length yet. */
  durationSeconds: number | null;
  /** Null when the channel hides its view counts. */
  viewCount: number | null;
  liveStatus: 'none' | 'live' | 'upcoming';
};

/** One page of a channel's uploads, newest first, plus the token for the next page. */
export type ChannelVideosPage = {
  videos: ChannelVideo[];
  nextPageToken: string | null;
};

export function buildVideoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

/** Checks data read back from the cache before trusting it as a page of videos. */
export function isChannelVideosPage(value: unknown): value is ChannelVideosPage {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    Array.isArray(candidate.videos) &&
    candidate.videos.every(isChannelVideo) &&
    (candidate.nextPageToken === null || typeof candidate.nextPageToken === 'string')
  );
}

function isChannelVideo(value: unknown): value is ChannelVideo {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.videoId === 'string' &&
    typeof candidate.title === 'string' &&
    (candidate.thumbnailUrl === null || typeof candidate.thumbnailUrl === 'string') &&
    typeof candidate.publishedAt === 'number' &&
    (candidate.durationSeconds === null || typeof candidate.durationSeconds === 'number') &&
    (candidate.viewCount === null || typeof candidate.viewCount === 'number') &&
    (candidate.liveStatus === 'none' ||
      candidate.liveStatus === 'live' ||
      candidate.liveStatus === 'upcoming')
  );
}
