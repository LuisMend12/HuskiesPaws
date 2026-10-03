# Wanderlings mobile app (Expo)

The mobile version of [Wanderlings](../README.md): walk, and your trail blooms. AI agents scout real places, you climb local, statewide and national ranks, you capture landmarks as postcards, and every ride you skip grows your savings tree through Capital One Nessie.

> **Built outside Cursor.** The Cursor track requires the project to be built with Cursor. Treat this as a head start: open the folder in Cursor and keep building there.

## Run it on your phone (Expo Go)

You need Node.js 18 or newer, and the latest **Expo Go** app on your phone (from the App Store or Google Play). This project uses **Expo SDK 57**.

**At the hackathon, use tunnel mode.** Guest Wi-Fi (like Cornell-Visitor) blocks phones from reaching your laptop, so the normal mode times out. Tunnel mode serves the app through a public HTTPS link that works on any network, even cellular:

```bash
cd big-red-hacks2026/mobile
npm install
npm run tunnel
```

Wait for **"Tunnel ready."**, then scan the QR code. On iPhone, use the Camera app. On Android, scan from inside Expo Go. The first load takes about 30 seconds.

On a home network where the phone and laptop share Wi-Fi, `npx expo start` (no tunnel) also works and is faster.

- **No phone?** `npx expo start --android` opens an Android emulator, if you have Android Studio installed. Running on iOS needs a Mac.

### If it won't open

| What you see | Fix |
|---|---|
| Loading spins forever, "Could not connect to development server", or a timeout | The network blocks it. Use `npm run tunnel`. |
| "Project is incompatible with this version of Expo Go" | Update Expo Go from the app store. The project needs SDK 57. |
| `npx` isn't recognized in PowerShell, or "running scripts is disabled" | Run the commands in **Command Prompt** instead, or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once. |
| Tunnel says ngrok is missing | Run `npm install` again in `mobile/`. `@expo/ngrok` is a dev dependency. |
| A red error screen on the phone | Take a photo of it and send it over. That's a code bug, not a setup problem. |
| The QR code shows an address like `172.21.…` or `10.195.…` | Your laptop has several network adapters (WSL, VPN). Use `npm run tunnel`. |

No API keys are needed. Allow location, camera and motion access when the app asks.

## Try it

1. **Squad → Explore.** Pip scouts a real nearby place and returns with a postcard and a spoken memo.
2. **Take me there.** With **demo mode** on (the default, good for indoor judging), the walk is simulated and the trail blooms. With demo mode off, actually walk there; Fern notices when you're within 40 m.
3. **📸 Capture.** The camera opens with Pip in the frame. Snap a photo, then **Save to album**.
4. **Ranks:** see your points, the trail picker and the leaderboards. **Savings:** see your tree and the rides you skipped.
5. **📍 Live location:** turns on real GPS and the phone's **step counter**, so your actual walk blooms and real steps count toward your rank.

## What's native here (vs. the web prototype)

| Feature | Web prototype | This app |
|---|---|---|
| Steps | Estimated from distance | **Real step counter** (`expo-sensors` Pedometer) |
| Map | Leaflet | `react-native-maps` (Apple Maps / Google Maps) |
| Capture | Browser camera | `expo-camera` and `react-native-view-shot` |
| Voice | Browser speech | `expo-speech` |
| Saved progress | localStorage | AsyncStorage |
| Nessie | May be blocked by CORS | No CORS limits on a phone |

## Code layout

```
App.js                  main screen: map, controls, tabs, modals
src/core/               shared game logic, GENERATED from ../prototype/js (don't edit here)
src/game/state.js       initial state, saved fields, derived values
src/game/store.js       tiny state store (getState / setState / useStore)
src/game/game.js        game actions: agents, guided walks, capture, savings, Nessie
src/game/walking.js     movement: simulated walks, GPS, step counter, blooms, trails
src/components/         TrailMap, AgentList, RanksPanel, SavingsPanel, AlbumPanel, PostcardModal, CaptureModal
src/storage.js          AsyncStorage
src/voice.js            speech (placeholder for Grok Voice)
```

**Shared logic:** the agents, ranks, trails, leaderboards, savings, Nessie client and art live in `prototype/js/`. After changing them, run `npm run sync-core` to copy them into `src/core/`.

## Checks

```bash
npx expo-doctor     # config and dependency check
npx expo lint       # ESLint
npx expo export --platform android --platform ios   # bundles the app; catches import and syntax errors
```

All three passed when this was set up. **The app hasn't been run on a physical phone yet,** so test the full loop on a real device first.

## Known limits and next steps

- **Grok isn't used yet (required for the Cursor track).** Voice uses `expo-speech`, and postcards are SVG art. Add a small backend that holds the Grok key and calls Grok Voice and Grok Imagine. Never put the key in the app.
- **Nessie uses plain HTTP.** Expo Go allows that. A store build needs cleartext HTTP enabled for `api.nessieisreal.com` (Android `usesCleartextTraffic` via `expo-build-properties`, and an iOS App Transport Security exception). The Nessie calls are also **untested**, since the API was resetting connections during development.
- **Leaderboards use sample players** until there's a backend (for example Supabase). See [docs/mobile-migration.md](../docs/mobile-migration.md).
- **Android step counting** only works while the app is open. Background tracking and **true AR** (ViroReact) need a development build (`npx expo run:android` or EAS).
- **Many flowers on the map** can slow older phones down. The map keeps only the newest 150 flowers.
