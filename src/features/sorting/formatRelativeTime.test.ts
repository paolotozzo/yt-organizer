import { describe, expect, it } from '@jest/globals';

import { formatTimeAgo } from './formatRelativeTime';

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
const now = 1_000 * DAY;

describe('formatTimeAgo', () => {
  it.each([
    [now - 30 * 1000, 'just now'],
    [now + MINUTE, 'just now'],
    [now - 5 * MINUTE, '5 minutes ago'],
    [now - DAY, '1 day ago'],
    [now - 13 * DAY, '1 week ago'],
    [now - 45 * DAY, '1 month ago'],
    [now - 800 * DAY, '2 years ago'],
  ])('formats %p as %p', (time, expected) => {
    expect(formatTimeAgo(time, now)).toBe(expected);
  });
});
