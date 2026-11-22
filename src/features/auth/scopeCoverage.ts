import type { YoutubeScope } from './youtubeScopes';

/**
 * Google's consent screen lets people untick individual permissions, so a successful
 * sign-in does not guarantee every requested scope was granted. This describes which
 * of the requested scopes the user actually granted.
 */
export type ScopeCoverage = {
  grantedScopes: YoutubeScope[];
  missingScopes: YoutubeScope[];
  isComplete: boolean;
};

const GOOGLE_SCOPE_URL_PREFIX = 'https://www.googleapis.com/auth/';

/**
 * Google returns granted scopes either as full URLs or, on some platforms, as short names
 * (e.g. "youtube.readonly"). Normalising both to the full URL makes them comparable.
 */
export function normalizeScope(scope: string): string {
  const trimmedScope = scope.trim();

  if (trimmedScope.startsWith('https://') || trimmedScope.startsWith('http://')) {
    return trimmedScope.replace(/^http:\/\//, 'https://');
  }

  return `${GOOGLE_SCOPE_URL_PREFIX}${trimmedScope}`;
}

export function calculateScopeCoverage(
  requestedScopes: readonly YoutubeScope[],
  grantedScopeStrings: readonly string[],
): ScopeCoverage {
  const normalizedGrantedScopes = new Set(grantedScopeStrings.map(normalizeScope));

  const grantedScopes = requestedScopes.filter((scope) =>
    normalizedGrantedScopes.has(normalizeScope(scope.url)),
  );
  const missingScopes = requestedScopes.filter(
    (scope) => !normalizedGrantedScopes.has(normalizeScope(scope.url)),
  );

  return {
    grantedScopes,
    missingScopes,
    isComplete: missingScopes.length === 0,
  };
}
