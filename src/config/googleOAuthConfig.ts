import Constants from 'expo-constants';

export type GoogleOAuthConfig = {
  webClientId: string;
  iosClientId: string;
};

/**
 * Reads the Google OAuth client IDs that `app.config.ts` embeds under `extra.googleOAuth`,
 * so the IDs are defined in a single place for both the native config and the JS code.
 */
function readGoogleOAuthConfig(): GoogleOAuthConfig {
  const googleOAuth = Constants.expoConfig?.extra?.googleOAuth as
    | Partial<GoogleOAuthConfig>
    | undefined;

  if (!googleOAuth?.webClientId || !googleOAuth.iosClientId) {
    throw new Error('Google OAuth client IDs are missing from extra.googleOAuth in app.config.ts.');
  }

  return {
    webClientId: googleOAuth.webClientId,
    iosClientId: googleOAuth.iosClientId,
  };
}

export const googleOAuthConfig = readGoogleOAuthConfig();
