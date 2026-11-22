/** A channel the signed-in user is subscribed to on YouTube. */
export type SubscribedChannel = {
  channelId: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  /** New uploads since the user last visited the channel, as YouTube counts them. */
  newItemCount: number;
};

export function compareChannelsByTitle(
  firstChannel: SubscribedChannel,
  secondChannel: SubscribedChannel,
): number {
  return firstChannel.title.localeCompare(secondChannel.title, undefined, {
    sensitivity: 'base',
  });
}

/** Checks data read back from the cache before trusting it as a channel list. */
export function isSubscribedChannelList(value: unknown): value is SubscribedChannel[] {
  return Array.isArray(value) && value.every(isSubscribedChannel);
}

function isSubscribedChannel(value: unknown): value is SubscribedChannel {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.channelId === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.description === 'string' &&
    (candidate.thumbnailUrl === null || typeof candidate.thumbnailUrl === 'string') &&
    typeof candidate.newItemCount === 'number'
  );
}
