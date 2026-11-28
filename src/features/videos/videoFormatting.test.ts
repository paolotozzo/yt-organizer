import { describe, expect, it } from '@jest/globals';

import { formatCompactCount, formatDuration, parseIsoDuration } from './videoFormatting';

describe('parseIsoDuration', () => {
  it.each([
    ['PT5M37S', 337],
    ['PT1H11M11S', 4271],
    ['PT45S', 45],
    ['PT2H', 7200],
    ['P1DT2H3M4S', 93784],
  ])('parses %p as %p seconds', (isoDuration, expectedSeconds) => {
    expect(parseIsoDuration(isoDuration)).toBe(expectedSeconds);
  });

  it('returns null for live streams and malformed values', () => {
    expect(parseIsoDuration('P0D')).toBeNull();
    expect(parseIsoDuration('')).toBeNull();
    expect(parseIsoDuration('5 minutes')).toBeNull();
  });
});

describe('formatDuration', () => {
  it.each([
    [7, '0:07'],
    [337, '5:37'],
    [3600, '1:00:00'],
    [4271, '1:11:11'],
  ])('formats %p seconds as %p', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});

describe('formatCompactCount', () => {
  it.each([
    [0, '0'],
    [938, '938'],
    [1_000, '1K'],
    [1_049, '1K'],
    [938_412, '938K'],
    [6_612_000, '6.6M'],
    [9_990_000, '9.9M'],
    [12_400_000, '12M'],
    [2_100_000_000, '2.1B'],
  ])('formats %p as %p', (count, expected) => {
    expect(formatCompactCount(count)).toBe(expected);
  });
});
