const YOUTUBE_DATA_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

type YoutubeErrorResponse = {
  error?: { message?: string; errors?: { reason?: string }[] };
};

/** An error whose message is safe to show to the user as is. */
export class YoutubeApiError extends Error {
  /** YouTube's machine-readable reason, e.g. "quotaExceeded" or "playlistNotFound". */
  readonly reason: string | undefined;
  readonly httpStatus: number | undefined;

  constructor(
    message: string,
    options?: { cause?: unknown; reason?: string; httpStatus?: number },
  ) {
    super(message, { cause: options?.cause });
    this.name = 'YoutubeApiError';
    this.reason = options?.reason;
    this.httpStatus = options?.httpStatus;
  }
}

/**
 * Calls a YouTube Data API v3 resource, e.g. `fetchYoutubeResource(token, 'subscriptions',
 * { part: 'snippet', mine: 'true' })`, and returns the parsed JSON body.
 */
export async function fetchYoutubeResource<ResponseBody>(
  accessToken: string,
  resourcePath: string,
  queryParameters: Record<string, string>,
): Promise<ResponseBody> {
  const url = `${YOUTUBE_DATA_API_BASE_URL}/${resourcePath}?${new URLSearchParams(queryParameters)}`;
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

  return (await response.json()) as ResponseBody;
}

async function toYoutubeApiError(response: Response): Promise<YoutubeApiError> {
  const errorBody = await readErrorBody(response);
  const reason = errorBody.error?.errors?.[0]?.reason;
  const errorDetails = {
    cause: errorBody.error?.message ?? `HTTP ${response.status}`,
    reason,
    httpStatus: response.status,
  };

  return new YoutubeApiError(describeFailure(response.status, reason, errorDetails.cause), errorDetails);
}

function describeFailure(httpStatus: number, reason: string | undefined, cause: string): string {
  if (httpStatus === 401) {
    return 'Your Google session expired. Sign out and sign in again.';
  }

  switch (reason) {
    case 'quotaExceeded':
    case 'dailyLimitExceeded':
      return 'The YouTube API quota is used up for today. Try again tomorrow.';
    case 'accessNotConfigured':
      return 'The YouTube Data API is not enabled for this app in Google Cloud.';
    case 'insufficientPermissions':
    case 'ACCESS_TOKEN_SCOPE_INSUFFICIENT':
      return 'The app is missing YouTube access. Sign out, sign in again and allow every permission.';
    case 'subscriptionForbidden':
      return 'Your subscriptions are not accessible for this account.';
    default:
      return `YouTube returned an error (${cause}).`;
  }
}

async function readErrorBody(response: Response): Promise<YoutubeErrorResponse> {
  try {
    return (await response.json()) as YoutubeErrorResponse;
  } catch {
    return {};
  }
}
