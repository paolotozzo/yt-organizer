/**
 * YouTube publishes a public Atom feed of each channel's 15 newest uploads. It needs no
 * sign-in and costs no API quota, but it is not part of the official API, so callers should
 * fall back to the Data API when it fails.
 */
export function buildChannelUploadsFeedUrl(channelId: string): string {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
}

const ENTRY_PATTERN = /<entry\b[\s\S]*?<\/entry>/g;
const PUBLISHED_PATTERN = /<published>([^<]+)<\/published>/;

/**
 * The publish time of the newest video in a channel uploads feed, or null when the feed has
 * no videos. Only `<entry>` elements count: the feed's own `<published>` is the date the
 * channel was created.
 */
export function findLatestPublishedTime(feedXml: string): number | null {
  let latestPublishedTime: number | null = null;

  for (const [entryXml] of feedXml.matchAll(ENTRY_PATTERN)) {
    const publishedTime = Date.parse(PUBLISHED_PATTERN.exec(entryXml)?.[1]?.trim() ?? '');

    if (
      !Number.isNaN(publishedTime) &&
      (latestPublishedTime === null || publishedTime > latestPublishedTime)
    ) {
      latestPublishedTime = publishedTime;
    }
  }

  return latestPublishedTime;
}

/** Thrown when the feed can't be read, so the caller can ask the Data API instead. */
export class ChannelUploadsFeedError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ChannelUploadsFeedError';
  }
}

/**
 * Publish time of the channel's newest upload according to its feed. A channel without
 * uploads has no feed (404), which counts as no upload.
 */
export async function fetchLatestUploadTimeFromFeed(channelId: string): Promise<number | null> {
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

  return findLatestPublishedTime(await response.text());
}
