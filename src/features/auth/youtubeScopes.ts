/**
 * Every OAuth scope offered by the YouTube Data, Analytics and Reporting APIs.
 *
 * While the app is in Google's "Testing" mode we request all of them, so features can be
 * explored freely. Before publishing, trim this list to the scopes the shipped features use.
 */
export type YoutubeScope = {
  url: string;
  label: string;
};

export const YOUTUBE_SCOPES: readonly YoutubeScope[] = [
  {
    url: 'https://www.googleapis.com/auth/youtube',
    label: 'Manage your YouTube account',
  },
  {
    url: 'https://www.googleapis.com/auth/youtube.readonly',
    label: 'View your YouTube account',
  },
  {
    url: 'https://www.googleapis.com/auth/youtube.force-ssl',
    label: 'Edit and delete videos, ratings, comments and captions',
  },
  {
    url: 'https://www.googleapis.com/auth/youtube.upload',
    label: 'Upload and manage videos',
  },
  {
    url: 'https://www.googleapis.com/auth/youtubepartner',
    label: 'View and manage assets and associated content',
  },
  {
    url: 'https://www.googleapis.com/auth/youtubepartner-channel-audit',
    label: 'View private channel information for partner audits',
  },
  {
    url: 'https://www.googleapis.com/auth/youtube.channel-memberships.creator',
    label: 'See your channel members and their levels',
  },
  {
    url: 'https://www.googleapis.com/auth/youtube.third-party-link.creator',
    label: 'Manage links between your channel and third-party sites',
  },
  {
    url: 'https://www.googleapis.com/auth/yt-analytics.readonly',
    label: 'View YouTube Analytics reports',
  },
  {
    url: 'https://www.googleapis.com/auth/yt-analytics-monetary.readonly',
    label: 'View YouTube Analytics revenue reports',
  },
];

export const YOUTUBE_SCOPE_URLS: readonly string[] = YOUTUBE_SCOPES.map((scope) => scope.url);
