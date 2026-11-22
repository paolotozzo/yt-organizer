import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
  type User as GoogleUser,
} from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

import { googleOAuthConfig } from '@/config/googleOAuthConfig';

import type { AuthSession } from './authSession';
import { calculateScopeCoverage } from './scopeCoverage';
import { YOUTUBE_SCOPES, YOUTUBE_SCOPE_URLS } from './youtubeScopes';

export type GoogleSignInResult =
  | { status: 'signedIn'; session: AuthSession }
  | { status: 'cancelled' };

/** An error whose message is safe to show to the user as is. */
export class GoogleAuthError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'GoogleAuthError';
  }
}

let isGoogleSignInConfigured = false;

/**
 * Must run before any other Google Sign-In call. Safe to call more than once.
 *
 * `offlineAccess` makes Google also return a server auth code, which a future backend can
 * exchange for a refresh token to work with the channel while the app is closed.
 */
export function configureGoogleSignIn(): void {
  if (isGoogleSignInConfigured) {
    return;
  }

  GoogleSignin.configure({
    webClientId: googleOAuthConfig.webClientId,
    iosClientId: googleOAuthConfig.iosClientId,
    scopes: [...YOUTUBE_SCOPE_URLS],
    offlineAccess: true,
  });
  isGoogleSignInConfigured = true;
}

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  try {
    await ensurePlayServicesAvailable();
    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      return { status: 'cancelled' };
    }

    return { status: 'signedIn', session: buildAuthSession(response.data) };
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
      return { status: 'cancelled' };
    }

    throw toGoogleAuthError(error);
  }
}

/** Restores the session of a user who signed in on a previous launch, without any UI. */
export async function restorePreviousGoogleSession(): Promise<AuthSession | null> {
  if (!GoogleSignin.hasPreviousSignIn()) {
    return null;
  }

  try {
    const response = await GoogleSignin.signInSilently();
    return response.type === 'success' ? buildAuthSession(response.data) : null;
  } catch (error) {
    console.warn('Could not restore the previous Google session', error);
    return null;
  }
}

export async function signOutOfGoogle(): Promise<void> {
  await GoogleSignin.signOut();
}

/**
 * Returns a fresh access token for calling the YouTube APIs.
 * The native SDK caches the token and refreshes it when it expires.
 */
export async function getGoogleAccessToken(): Promise<string> {
  const tokens = await GoogleSignin.getTokens();
  return tokens.accessToken;
}

async function ensurePlayServicesAvailable(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
}

function buildAuthSession(googleUser: GoogleUser): AuthSession {
  const { user, scopes } = googleUser;

  return {
    user: {
      id: user.id,
      displayName: user.name ?? user.email,
      email: user.email,
      photoUrl: user.photo,
    },
    scopeCoverage: calculateScopeCoverage(YOUTUBE_SCOPES, scopes),
  };
}

function toGoogleAuthError(error: unknown): GoogleAuthError {
  if (!isErrorWithCode(error)) {
    return new GoogleAuthError('Something went wrong while signing in. Please try again.', {
      cause: error,
    });
  }

  switch (error.code) {
    case statusCodes.IN_PROGRESS:
      return new GoogleAuthError('A sign-in is already in progress.', { cause: error });
    case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
      return new GoogleAuthError(
        'Google Play Services is missing or out of date on this device.',
        { cause: error },
      );
    default:
      return new GoogleAuthError(`Google sign-in failed (${error.code}). Please try again.`, {
        cause: error,
      });
  }
}
