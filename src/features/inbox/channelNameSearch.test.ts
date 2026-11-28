import { describe, expect, it } from '@jest/globals';

import { filterChannelsByName, normalizeForSearch } from './channelNameSearch';

const channels = [
  { title: 'Café Tech' },
  { title: 'BBC News' },
  { title: 'Huberman Lab' },
  { title: 'The Tech Lab' },
];

function titlesMatching(query: string): string[] {
  return filterChannelsByName(channels, query).map((channel) => channel.title);
}

describe('normalizeForSearch', () => {
  it('drops accents, case and surrounding spaces', () => {
    expect(normalizeForSearch('  Crème BRÛLÉE ')).toBe('creme brulee');
  });
});

describe('filterChannelsByName', () => {
  it('keeps every channel for an empty or blank query', () => {
    expect(titlesMatching('')).toHaveLength(4);
    expect(titlesMatching('   ')).toHaveLength(4);
  });

  it('matches part of a name, ignoring case and accents', () => {
    expect(titlesMatching('bbc')).toEqual(['BBC News']);
    expect(titlesMatching('cafe')).toEqual(['Café Tech']);
    expect(titlesMatching('CAFÉ')).toEqual(['Café Tech']);
  });

  it('needs every word, in any order, and keeps the original order', () => {
    expect(titlesMatching('lab tech')).toEqual(['The Tech Lab']);
    expect(titlesMatching('lab')).toEqual(['Huberman Lab', 'The Tech Lab']);
  });

  it('returns nothing when no name matches', () => {
    expect(titlesMatching('geopolitics')).toEqual([]);
  });
});
