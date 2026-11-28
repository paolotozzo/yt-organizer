# Channel Desk (yt-organizer)

A React Native + Expo app to organize a YouTube channel and get more out of its content.

Users sign in with Google and grant every YouTube permission (the app is in Google's
"Testing" mode; the scope list will be trimmed before publishing).

## Features

**Organized inbox.** The home screen lists the user's YouTube subscriptions
(Data API `subscriptions.list`, `mine=true`) under topic folders they create:

- Create, rename and delete folders. Deleting a folder only takes it off its channels.
- A channel can be in several topics. Select channels and tap "Topics…" (or the folder
  button on a channel's page): like Gmail labels, a box is checked when every selected
  channel has that topic, shows a dash when only some do, and Done applies the changes.
  "Remove" inside a topic takes the channels out of that topic only.
- Drag folders to reorder them (long press the row, or touch the handle).
- Pin folders to keep them on top, and pin channels to the top of a folder.
- Channels with no topic stay visible under "Unassigned"; pull down to refresh.
- Tap a channel to see its videos (uploads playlist plus `videos.list` for length and views,
  2 quota units per 20 videos); tap a video to open it in YouTube. Long press a channel to
  start selecting.
- Save a video from the button beside it. **Your lists** are kept on the phone: free and
  instant, and tapping a list again takes the video out. **YouTube playlists** are listed below
  them (`playlistItems.insert`, 50 quota units each). Watch later isn't offered: YouTube no
  longer lets apps add to it. Open your lists from the bookmark button on the inbox, where you
  can also rename or delete a list and remove videos from it.
- Sort channels by **Relevance** or **Unread** (YouTube's own orders from `subscriptions.list`),
  **Latest upload** (each channel's public uploads feed, `youtube.com/feeds/videos.xml`, which
  costs no quota; the uploads playlist via `playlistItems.list`, 1 unit, only when a feed
  fails), or **A to Z**. Rows show YouTube's "new items" count.

## Caching YouTube data

Data from YouTube is cached on the device (AsyncStorage, per Google account), so the app opens
instantly and spends little quota. Cache ages are set in `src/features/youtube/youtubeCachePolicy.ts`:

| Data | Reused for |
| --- | --- |
| Subscription list and "new" counts | 6 hours (shown at once even when older, then replaced) |
| Relevance and unread rankings | 6 hours |
| Latest upload per channel | 1 hour (15 minutes on pull to refresh) |
| First page of a channel's videos | 1 hour, then kept while the channel's free uploads feed shows no new video |
| Your playlists (for saving videos) | 6 hours |

- **Pull to refresh** always asks YouTube again.
- **Clear cached data** (tap your avatar) deletes all cached YouTube data and reloads it.
  Folders and the sort choice are kept.
- **Changing a data shape or the requested fields?** Bump `YOUTUBE_CACHE_SCHEMA_VERSION` in
  `src/features/youtube/youtubeDataCacheKeys.ts`. On the next launch every entry from an older
  version is deleted, so stale shapes are never read.

YouTube has no folder API, so folders are stored **on the device** (AsyncStorage, one
library per Google account). They are not synced between devices yet.

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
  app/                 Expo Router screens and layouts
    (inbox)/           Signed-in screens: the inbox and a folder's contents
  components/          Shared UI components
  config/              Runtime access to app config values
  features/auth/       Google sign-in, session state, YouTube scopes
  features/subscriptions/  Fetching the user's subscriptions from the YouTube Data API
  features/folders/    Folder library rules (pure, unit tested) and on-device storage
  features/sorting/    Channel sort orders and latest-upload checks
  features/youtube/    Shared YouTube Data API client and the versioned on-device cache
  features/videos/     A channel's video list: API, formatting, the video card and save sheet
  features/playlists/  The user's YouTube playlists and adding videos to them
  features/savedLists/ Video lists kept on the phone (pure, unit tested) behind a store
  features/inbox/      Inbox state provider and its UI components
  theme/               Dark color palette and spacing
```
