# Channel Desk (yt-organizer)

A React Native + Expo app to organize a YouTube channel and get more out of its content.

Current step: the entry point. Users sign in with Google and grant every YouTube permission
(the app is in Google's "Testing" mode; the scope list will be trimmed before publishing).

## Requirements

- Node.js 20+
- Xcode (for iOS) and/or Android Studio with an emulator or device (for Android)

Google Sign-In uses native code, so the app **does not run in Expo Go**. It runs as a
development build, which the commands below create.

## Setup

```sh
npm install
```

The Google OAuth client IDs live in `app.config.ts` (`GOOGLE_OAUTH_CLIENT_IDS`). They are public
identifiers, not secrets, so no environment setup is needed.

## Run

```sh
npm run ios       # builds and launches the iOS development build
npm run android   # builds and launches the Android development build
```

After the first native build, `npm start` is enough for JavaScript-only changes.
Rebuild with `npm run ios` / `npm run android` after adding native dependencies or
changing `app.config.ts`.

## Run on an Android phone (EAS development build)

This needs no Android Studio: Expo builds the APK in the cloud (free plan works).

```sh
npx eas-cli@latest login                                   # once, with your Expo account
npx eas-cli@latest build --profile development --platform android
```

The EAS project is already linked (`EAS_PROJECT_ID` in `app.config.ts`). When the build finishes, open its link on the phone,
install the APK (allow "install unknown apps" for your browser on MIUI), then run
`npm start` on the Mac and open the project from the development build.

EAS signs the APK with its own keystore, so its SHA-1 must be registered as an Android OAuth
client too. See it with `npx eas-cli@latest credentials -p android` (Keystore section).

## Google Cloud configuration

| Item | Value |
| --- | --- |
| Project | `ty-organizer` |
| Consent screen | "Channel Desk", External, Testing (test users only) |
| Bundle id / package | `com.paolotozzo.ytorganizer` |
| iOS client | `iosClientId` in `app.config.ts`, plus its reversed URL scheme |
| Web client | `webClientId` in `app.config.ts` (ID token audience) |
| Android clients | matched by package + SHA-1, no value needed in the app |

Android sign-in only works when the APK's signing certificate SHA-1 is registered on an
Android client. A local `npm run android` build is signed with Expo's default debug key
(`5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`), which has its own client.
EAS builds and Play Store releases use different keys: add their SHA-1s as new Android
clients when you get there. Error `DEVELOPER_ERROR` on Android almost always means a
SHA-1 or package mismatch.

## Scripts

| Command | What it does |
| --- | --- |
| `npm test` | Unit tests (business logic only) |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |

## Project structure

```
src/
  app/                 Expo Router screens (sign-in, home) and the root layout
  components/          Shared UI components
  config/              Runtime access to app config values
  features/auth/       Google sign-in, session state, YouTube scopes
  theme/               Dark color palette and spacing
```
