import { fetchYoutubeResource } from '@/features/youtube/youtubeApiClient';

import type { SubscribedChannel } from './subscribedChannel';

/** The orders subscriptions.list can return. "relevance" is YouTube's engagement ranking. */
export type SubscriptionListOrder = 'alphabetical' | 'relevance' | 'unread';

/** The largest page size subscriptions.list allows. */
const MAX_RESULTS_PER_PAGE = 50;

/** Stops a misbehaving API from paginating forever (200 pages = 10,000 subscriptions). */
const MAX_PAGE_COUNT = 200;

type YoutubeThumbnail = { url?: string };

type YoutubeSubscriptionResource = {
  snippet?: {
    title?: string;
    description?: string;
    resourceId?: { channelId?: string };
    thumbnails?: { default?: YoutubeThumbnail; medium?: YoutubeThumbnail; high?: YoutubeThumbnail };
  };
  contentDetails?: { newItemCount?: number };
};

type YoutubeSubscriptionListResponse = {
  items?: YoutubeSubscriptionResource[];
  nextPageToken?: string;
};

/**
 * Fetches every channel the signed-in user subscribes to (subscriptions.list with
 * `mine=true`), following page tokens until the last page. Channels come back in the
 * requested `order`. Costs one quota unit per 50 channels.
 */
export async function fetchAllSubscribedChannels(
  accessToken: string,
  order: SubscriptionListOrder,
): Promise<SubscribedChannel[]> {
  const channelsById = new Map<string, SubscribedChannel>();
  let pageToken: string | undefined;
  let pageCount = 0;

  do {
    const page = await fetchYoutubeResource<YoutubeSubscriptionListResponse>(
      accessToken,
      'subscriptions',
      buildPageQuery(order, pageToken),
    );

    for (const subscription of page.items ?? []) {
      const channel = toSubscribedChannel(subscription);

      if (channel && !channelsById.has(channel.channelId)) {
        channelsById.set(channel.channelId, channel);
      }
    }

    pageToken = page.nextPageToken;
    pageCount += 1;
  } while (pageToken && pageCount < MAX_PAGE_COUNT);

  return [...channelsById.values()];
}

function buildPageQuery(
  order: SubscriptionListOrder,
  pageToken: string | undefined,
): Record<string, string> {
  return {
    part: 'snippet,contentDetails',
    mine: 'true',
    order,
    maxResults: String(MAX_RESULTS_PER_PAGE),
    ...(pageToken ? { pageToken } : {}),
  };
}

function toSubscribedChannel(subscription: YoutubeSubscriptionResource): SubscribedChannel | null {
  const snippet = subscription.snippet;
  const channelId = snippet?.resourceId?.channelId;

  if (!snippet || !channelId) {
    return null;
  }

  const thumbnails = snippet.thumbnails;

  return {
    channelId,
    title: snippet.title ?? 'Untitled channel',
    description: snippet.description ?? '',
    thumbnailUrl: thumbnails?.medium?.url ?? thumbnails?.default?.url ?? thumbnails?.high?.url ?? null,
    newItemCount: subscription.contentDetails?.newItemCount ?? 0,
  };
}
