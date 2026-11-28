/**
 * A channel's uploads live in a playlist whose id is the channel id with "UC" replaced by
 * "UU". Reading it is far cheaper than search.list (1 quota unit instead of 100).
 */
export function getUploadsPlaylistId(channelId: string): string | null {
  return channelId.startsWith('UC') ? `UU${channelId.slice(2)}` : null;
}
