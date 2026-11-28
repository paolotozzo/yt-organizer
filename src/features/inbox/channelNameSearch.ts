import type { SubscribedChannel } from '@/features/subscriptions/subscribedChannel';

const COMBINING_DIACRITICAL_MARKS = /[̀-ͯ]/g;

/** Lower case without accents, so "cafe" finds "Café" and "BBC" finds "bbc news". */
export function normalizeForSearch(text: string): string {
  return text.normalize('NFD').replace(COMBINING_DIACRITICAL_MARKS, '').toLowerCase().trim();
}

function splitIntoSearchWords(query: string): string[] {
  return normalizeForSearch(query).split(/\s+/).filter(Boolean);
}

/**
 * The channels whose name contains every word of the query, anywhere and in any order, keeping
 * their order. An empty query keeps every channel.
 */
export function filterChannelsByName<Channel extends Pick<SubscribedChannel, 'title'>>(
  channels: readonly Channel[],
  query: string,
): Channel[] {
  const searchWords = splitIntoSearchWords(query);

  if (searchWords.length === 0) {
    return [...channels];
  }

  return channels.filter((channel) => {
    const normalizedTitle = normalizeForSearch(channel.title);
    return searchWords.every((searchWord) => normalizedTitle.includes(searchWord));
  });
}
