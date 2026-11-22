/** A channel the signed-in user is subscribed to on YouTube. */
export type SubscribedChannel = {
  channelId: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
};

export function compareChannelsByTitle(
  firstChannel: SubscribedChannel,
  secondChannel: SubscribedChannel,
): number {
  return firstChannel.title.localeCompare(secondChannel.title, undefined, {
    sensitivity: 'base',
  });
}
