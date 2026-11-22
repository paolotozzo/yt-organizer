import { compareChannelsByTitle, type SubscribedChannel } from './subscribedChannel';

const SUBSCRIPTIONS_ENDPOINT = 'https://www.googleapis.com/youtube/v3/subscriptions';

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
};

type YoutubeSubscriptionListResponse = {
  items?: YoutubeSubscriptionResource[];
  nextPageToken?: string;
};

type YoutubeErrorResponse = {
  error?: { message?: string; errors?: { reason?: string }[] };
};

/** An error whose message is safe to show to the user as is. */
export class YoutubeApiError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'YoutubeApiError';
  }
}

/**
 * Fetches every channel the signed-in user subscribes to (subscriptions.list with
 * `mine=true`), following page tokens until the last page. Sorted by title.
 */
export async function fetchAllSubscribedChannels(
  accessToken: string,
): Promise<SubscribedChannel[]> {
  const channelsById = new Map<string, SubscribedChannel>();
  let pageToken: string | undefined;
  let pageCount = 0;

  do {
    const page = await fetchSubscriptionsPage(accessToken, pageToken);

    for (const subscription of page.items ?? []) {
      const channel = toSubscribedChannel(subscription);

      if (channel) {
        channelsById.set(channel.channelId, channel);
      }
    }

    pageToken = page.nextPageToken;
    pageCount += 1;
  } while (pageToken && pageCount < MAX_PAGE_COUNT);

  return [...channelsById.values()].sort(compareChannelsByTitle);
}

async function fetchSubscriptionsPage(
  accessToken: string,
  pageToken: string | undefined,
): Promise<YoutubeSubscriptionListResponse> {
  const url = buildSubscriptionsPageUrl(pageToken);
  let response: Response;

  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    });
  } catch (error) {
    throw new YoutubeApiError('Could not reach YouTube. Check your connection and try again.', {
      cause: error,
    });
  }

  if (!response.ok) {
    throw await toYoutubeApiError(response);
  }

  return (await response.json()) as YoutubeSubscriptionListResponse;
}

function buildSubscriptionsPageUrl(pageToken: string | undefined): string {
  const searchParams = new URLSearchParams({
    part: 'snippet',
    mine: 'true',
    order: 'alphabetical',
    maxResults: String(MAX_RESULTS_PER_PAGE),
  });

  if (pageToken) {
    searchParams.set('pageToken', pageToken);
  }

  return `${SUBSCRIPTIONS_ENDPOINT}?${searchParams.toString()}`;
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
  };
}

async function toYoutubeApiError(response: Response): Promise<YoutubeApiError> {
  const errorBody = await readErrorBody(response);
  const reason = errorBody.error?.errors?.[0]?.reason;
  const cause = errorBody.error?.message ?? `HTTP ${response.status}`;

  if (response.status === 401) {
    return new YoutubeApiError('Your Google session expired. Sign out and sign in again.', {
      cause,
    });
  }

  if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') {
    return new YoutubeApiError('The YouTube API quota is used up for today. Try again tomorrow.', {
      cause,
    });
  }

  if (reason === 'accessNotConfigured') {
    return new YoutubeApiError(
      'The YouTube Data API is not enabled for this app in Google Cloud.',
      { cause },
    );
  }

  if (reason === 'insufficientPermissions' || reason === 'ACCESS_TOKEN_SCOPE_INSUFFICIENT') {
    return new YoutubeApiError(
      'The app is missing YouTube access. Sign out, sign in again and allow every permission.',
      { cause },
    );
  }

  if (reason === 'subscriptionForbidden') {
    return new YoutubeApiError('Your subscriptions are not accessible for this account.', {
      cause,
    });
  }

  return new YoutubeApiError(`YouTube could not load your subscriptions (${cause}).`, { cause });
}

async function readErrorBody(response: Response): Promise<YoutubeErrorResponse> {
  try {
    return (await response.json()) as YoutubeErrorResponse;
  } catch {
    return {};
  }
}
