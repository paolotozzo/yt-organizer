import { fetchYoutubeResource, YoutubeApiError } from '@/features/youtube/youtubeApiClient';
import { getUploadsPlaylistId } from '@/features/youtube/uploadsPlaylist';

import type { ChannelVideo, ChannelVideosPage } from './channelVideo';
import { parseIsoDuration } from './videoFormatting';

/** Videos per page. Each page costs 2 quota units: one for the playlist, one for details. */
const VIDEOS_PER_PAGE = 20;

type YoutubeThumbnail = { url?: string };
type YoutubeThumbnails = {
  medium?: YoutubeThumbnail;
  high?: YoutubeThumbnail;
  standard?: YoutubeThumbnail;
  maxres?: YoutubeThumbnail;
  default?: YoutubeThumbnail;
};

type PlaylistItemListResponse = {
  items?: { contentDetails?: { videoId?: string } }[];
  nextPageToken?: string;
};

type VideoResource = {
  id?: string;
  snippet?: {
    title?: string;
    publishedAt?: string;
    liveBroadcastContent?: string;
    thumbnails?: YoutubeThumbnails;
  };
  contentDetails?: { duration?: string };
  statistics?: { viewCount?: string };
};

type VideoListResponse = { items?: VideoResource[] };

/**
 * One page of the channel's uploads, newest first: the ids come from the uploads playlist,
 * then videos.list adds duration, view count and live status for the whole page at once.
 */
export async function fetchChannelVideosPage(
  accessToken: string,
  channelId: string,
  pageToken: string | null,
): Promise<ChannelVideosPage> {
  const uploadsPlaylistId = getUploadsPlaylistId(channelId);

  if (!uploadsPlaylistId) {
    return { videos: [], nextPageToken: null };
  }

  const playlistPage = await fetchUploadsPlaylistPage(accessToken, uploadsPlaylistId, pageToken);
  const videoIds = (playlistPage.items ?? [])
    .map((item) => item.contentDetails?.videoId)
    .filter((videoId): videoId is string => Boolean(videoId));

  return {
    videos: await fetchVideoDetails(accessToken, videoIds),
    nextPageToken: playlistPage.nextPageToken ?? null,
  };
}

async function fetchUploadsPlaylistPage(
  accessToken: string,
  uploadsPlaylistId: string,
  pageToken: string | null,
): Promise<PlaylistItemListResponse> {
  try {
    return await fetchYoutubeResource<PlaylistItemListResponse>(accessToken, 'playlistItems', {
      part: 'contentDetails',
      playlistId: uploadsPlaylistId,
      maxResults: String(VIDEOS_PER_PAGE),
      ...(pageToken ? { pageToken } : {}),
    });
  } catch (error) {
    // A channel that never uploaded has no uploads playlist.
    if (error instanceof YoutubeApiError && error.httpStatus === 404) {
      return {};
    }

    throw error;
  }
}

async function fetchVideoDetails(accessToken: string, videoIds: string[]): Promise<ChannelVideo[]> {
  if (videoIds.length === 0) {
    return [];
  }

  const response = await fetchYoutubeResource<VideoListResponse>(accessToken, 'videos', {
    part: 'snippet,contentDetails,statistics',
    id: videoIds.join(','),
    maxResults: String(videoIds.length),
  });
  const videosById = new Map(
    (response.items ?? [])
      .map(toChannelVideo)
      .filter((video): video is ChannelVideo => video !== null)
      .map((video) => [video.videoId, video]),
  );

  // videos.list doesn't promise to keep the requested order, and skips private or deleted
  // videos, so rebuild the playlist order from the ids.
  return videoIds
    .map((videoId) => videosById.get(videoId))
    .filter((video): video is ChannelVideo => video !== undefined);
}

function toChannelVideo(resource: VideoResource): ChannelVideo | null {
  const publishedAt = Date.parse(resource.snippet?.publishedAt ?? '');

  if (!resource.id || !resource.snippet || Number.isNaN(publishedAt)) {
    return null;
  }

  const viewCount = Number(resource.statistics?.viewCount);

  return {
    videoId: resource.id,
    title: resource.snippet.title ?? 'Untitled video',
    thumbnailUrl: pickThumbnailUrl(resource.snippet.thumbnails),
    publishedAt,
    durationSeconds: parseIsoDuration(resource.contentDetails?.duration ?? ''),
    viewCount: Number.isFinite(viewCount) ? viewCount : null,
    liveStatus: toLiveStatus(resource.snippet.liveBroadcastContent),
  };
}

/** "high" (480x360) is sharp enough for a full-width phone card and always present. */
function pickThumbnailUrl(thumbnails: YoutubeThumbnails | undefined): string | null {
  return (
    thumbnails?.high?.url ??
    thumbnails?.standard?.url ??
    thumbnails?.medium?.url ??
    thumbnails?.default?.url ??
    null
  );
}

function toLiveStatus(liveBroadcastContent: string | undefined): ChannelVideo['liveStatus'] {
  if (liveBroadcastContent === 'live' || liveBroadcastContent === 'upcoming') {
    return liveBroadcastContent;
  }

  return 'none';
}
