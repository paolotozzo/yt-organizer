import type { ConfigContext, ExpoConfig } from 'expo/config';

const APP_IDENTIFIER = 'com.paolotozzo.ytorganizer';
const DARK_BACKGROUND_COLOR = '#0F0F12';

/** EAS project created with `eas init` (a public identifier, not a secret). */
const EAS_PROJECT_ID = 'a1ac9132-586b-4669-9973-364a2cfca2a7';

/**
 * OAuth client IDs from the Google Cloud project "ty-organizer" (Google Auth Platform > Clients).
 * They are public identifiers, not secrets: they ship inside every app binary. The app reads
 * them at runtime through `src/config/googleOAuthConfig.ts`. Android needs no ID here, because
 * Google matches the app by package name and signing certificate SHA-1.
 */
const GOOGLE_OAUTH_CLIENT_IDS = {
  webClientId: '1036670238058-qbs1dnuu6vsiankrgg5ra8atp1rk2dbq.apps.googleusercontent.com',
  iosClientId: '1036670238058-eg2rothg4eaeqgpo9nq9123cihkbjtlt.apps.googleusercontent.com',
};

/**
 * Google Sign-In on iOS needs the "reversed" iOS client ID registered as a URL scheme,
 * e.g. `com.googleusercontent.apps.1234-abcd` for client ID `1234-abcd.apps.googleusercontent.com`.
 */
function buildGoogleIosUrlScheme(iosClientId: string): string {
  const clientIdPrefix = iosClientId.replace('.apps.googleusercontent.com', '');
  return `com.googleusercontent.apps.${clientIdPrefix}`;
}

function buildExtraConfig(): ExpoConfig['extra'] {
  return {
    googleOAuth: GOOGLE_OAUTH_CLIENT_IDS,
    eas: { projectId: EAS_PROJECT_ID },
  };
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Channel Desk',
  owner: 'paolo.tozzo',
  slug: 'yt-organizer',
  scheme: 'ytorganizer',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  backgroundColor: DARK_BACKGROUND_COLOR,
  ios: {
    bundleIdentifier: APP_IDENTIFIER,
    supportsTablet: true,
  },
  android: {
    package: APP_IDENTIFIER,
    adaptiveIcon: {
      backgroundColor: DARK_BACKGROUND_COLOR,
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    'expo-system-ui',
    [
      '@react-native-google-signin/google-signin',
      { iosUrlScheme: buildGoogleIosUrlScheme(GOOGLE_OAUTH_CLIENT_IDS.iosClientId) },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: buildExtraConfig(),
});
