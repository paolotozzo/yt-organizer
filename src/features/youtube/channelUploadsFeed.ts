/**
 * YouTube publishes a public Atom feed of each channel's 15 newest uploads. It needs no
 * sign-in and costs no API quota, but it is not part of the official API, so callers should
 * fall back to the Data API when it fails.
 */
export function buildChannelUploadsFeedUrl(channelId: string): string {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
}

/** The newest video in a channel's uploads feed. */
export type FeedUpload = {
  videoId: string;
  /** Publish time in epoch milliseconds. */
  publishedAt: number;
};

const ENTRY_PATTERN = /<entry\b[\s\S]*?<\/entry>/g;
const VIDEO_ID_PATTERN = /<yt:videoId>([^<]+)<\/yt:videoId>/;
const PUBLISHED_PATTERN = /<published>([^<]+)<\/published>/;

/**
 * The newest video in a channel uploads feed, or null when the feed has no videos. Only
 * `<entry>` elements count: the feed's own `<published>` is the date the channel was created.
 */
export function findLatestUpload(feedXml: string): FeedUpload | null {
  let latestUpload: FeedUpload | null = null;

  for (const [entryXml] of feedXml.matchAll(ENTRY_PATTERN)) {
    const upload = parseEntry(entryXml);

    if (upload && (latestUpload === null || upload.publishedAt > latestUpload.publishedAt)) {
      latestUpload = upload;
    }
  }

  return latestUpload;
}

function parseEntry(entryXml: string): FeedUpload | null {
  const videoId = VIDEO_ID_PATTERN.exec(entryXml)?.[1]?.trim();
  const publishedAt = Date.parse(PUBLISHED_PATTERN.exec(entryXml)?.[1]?.trim() ?? '');

  return videoId && !Number.isNaN(publishedAt) ? { videoId, publishedAt } : null;
}

/** Thrown when the feed can't be read, so the caller can ask the Data API instead. */
export class ChannelUploadsFeedError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ChannelUploadsFeedError';
  }
}

/**
 * The channel's newest upload according to its feed. A channel without uploads has no feed
 * (404), which counts as no upload.
 */
export async function fetchLatestUploadFromFeed(channelId: string): Promise<FeedUpload | null> {
  let response: Response;

  try {
    response = await fetch(buildChannelUploadsFeedUrl(channelId), {
      headers: { Accept: 'application/atom+xml' },
    });
  } catch (error) {
    throw new ChannelUploadsFeedError('Could not reach the uploads feed.', { cause: error });
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new ChannelUploadsFeedError(`The uploads feed answered HTTP ${response.status}.`);
  }

  return findLatestUpload(await response.text());
}
