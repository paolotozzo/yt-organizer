import { describe, expect, it } from '@jest/globals';

import { calculateScopeCoverage, normalizeScope } from './scopeCoverage';
import type { YoutubeScope } from './youtubeScopes';

const manageScope: YoutubeScope = {
  url: 'https://www.googleapis.com/auth/youtube',
  label: 'Manage',
};
const readonlyScope: YoutubeScope = {
  url: 'https://www.googleapis.com/auth/youtube.readonly',
  label: 'Read only',
};
const analyticsScope: YoutubeScope = {
  url: 'https://www.googleapis.com/auth/yt-analytics.readonly',
  label: 'Analytics',
};

const requestedScopes = [manageScope, readonlyScope, analyticsScope];

describe('normalizeScope', () => {
  it('expands a short scope name to the full Google scope URL', () => {
    expect(normalizeScope('youtube.readonly')).toBe(
      'https://www.googleapis.com/auth/youtube.readonly',
    );
  });

  it('keeps a full scope URL unchanged', () => {
    expect(normalizeScope('https://www.googleapis.com/auth/youtube')).toBe(
      'https://www.googleapis.com/auth/youtube',
    );
  });

  it('trims whitespace and upgrades http to https', () => {
    expect(normalizeScope('  http://www.googleapis.com/auth/youtube ')).toBe(
      'https://www.googleapis.com/auth/youtube',
    );
  });
});

describe('calculateScopeCoverage', () => {
  it('reports complete coverage when every requested scope was granted', () => {
    const coverage = calculateScopeCoverage(requestedScopes, [
      manageScope.url,
      readonlyScope.url,
      analyticsScope.url,
    ]);

    expect(coverage.isComplete).toBe(true);
    expect(coverage.missingScopes).toEqual([]);
    expect(coverage.grantedScopes).toEqual(requestedScopes);
  });

  it('lists the scopes the user unticked on the consent screen', () => {
    const coverage = calculateScopeCoverage(requestedScopes, [manageScope.url]);

    expect(coverage.isComplete).toBe(false);
    expect(coverage.grantedScopes).toEqual([manageScope]);
    expect(coverage.missingScopes).toEqual([readonlyScope, analyticsScope]);
  });

  it('matches granted scopes returned as short names', () => {
    const coverage = calculateScopeCoverage(requestedScopes, [
      'youtube',
      'youtube.readonly',
      'yt-analytics.readonly',
    ]);

    expect(coverage.isComplete).toBe(true);
  });

  it('ignores granted scopes that were not requested', () => {
    const coverage = calculateScopeCoverage([manageScope], [
      manageScope.url,
      'openid',
      'https://www.googleapis.com/auth/userinfo.email',
    ]);

    expect(coverage.grantedScopes).toEqual([manageScope]);
    expect(coverage.isComplete).toBe(true);
  });

  it('treats an empty grant as nothing covered', () => {
    const coverage = calculateScopeCoverage(requestedScopes, []);

    expect(coverage.isComplete).toBe(false);
    expect(coverage.missingScopes).toEqual(requestedScopes);
  });
});
