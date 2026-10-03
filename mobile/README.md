# HuskiesPaws mobile app (Expo)

The mobile version of [HuskiesPaws](../README.md): walk, and your trail blooms. AI agents scout real places, you climb local, statewide and national ranks, you capture landmarks as postcards, and every ride you skip grows your savings tree through Capital One Nessie.

> **Built outside Cursor.** The Cursor track requires the project to be built with Cursor. Treat this as a head start: open the folder in Cursor and keep building there.

## Run it on your phone (Expo Go)

You need:

- **Node.js 18 or newer** on your laptop
- The **Expo Go** app on your phone, from the App Store or Google Play. The app uses **Expo SDK 57**. If Expo Go says the project is incompatible, update Expo Go.

### Steps

1. **Open a terminal in the `mobile` folder.** If your terminal is already at the repo root (the `big-red-hacks2026` folder), just run `cd mobile`. The prompt should end in `\big-red-hacks2026\mobile>` before you go on. If you run `npx expo start` anywhere else, it fails with `The expected package.json path ... does not exist`.

2. **Install dependencies.** You only need this the first time, and again after someone changes `package.json`.

   ```bash
   npm install
   ```

3. **Start the app with a tunnel.** On venue or public Wi-Fi, such as `Cornell-Visitor`, always use the tunnel:

   ```bash
   npm run tunnel
   ```

   This runs [`scripts/tunnel.mjs`](scripts/tunnel.mjs): a free **Cloudflare quick tunnel** (no account), then Expo pointed at it.

   - Wait for **Tunnel ready**. The QR code's address should look like `exp://….trycloudflare.com`. The first load takes about 30 seconds.
   - The address changes every time you start it, so scan the new QR code each time.
   - **Why not `expo start --tunnel`?** Expo's built-in tunnel uses one ngrok account shared by every Expo user. When it's full, it fails with `CommandError: TypeError: Cannot read properties of undefined (reading 'body')` (ngrok error `ERR_NGROK_108`). The old way is still there as `npm run tunnel:ngrok`.

4. **Scan the QR code.** On iPhone, use the Camera app. On Android, scan from inside Expo Go. Allow **location, camera and motion** access when the app asks.

No API keys are needed.

### Why the tunnel?

Without `--tunnel`, the phone connects straight to your laptop's local address, such as `exp://10.x.x.x:8081`. On public Wi-Fi that usually fails with **"request timed out"**, for two reasons:

- **Guest networks** usually stop devices on the network from talking to each other.
- **Windows Firewall** blocks Node on "Public" networks if you didn't allow it the first time it ran.

The tunnel goes through the internet instead, so neither one matters. Reloads are a little slower.

Plain `npx expo start`, without the tunnel, is fine on a **home network** where the phone and laptop are on the same Wi-Fi. Avoid opening the firewall for Node on Public networks: it lets anyone on that network reach your dev server.

### Other ways to run it

- **No phone?** `npx expo start --android` opens an Android emulator, if you have Android Studio installed. Running on iOS needs a Mac.
- **While it's running:** shake the phone to open Expo's developer menu, where **Reload** restarts the app. Errors show on the phone and in the terminal. Saved code changes reload on the phone automatically.

### If it won't open

| What you see | Fix |
|---|---|
| Loading spins forever, "Could not connect to development server", or "request timed out" | The network blocks it. Use `npm run tunnel`. |
| "Project is incompatible with this version of Expo Go" | Update Expo Go from the app store. The project needs SDK 57. |
| `The expected package.json path ... does not exist` | You're in the wrong folder. `cd mobile` first (step 1). |
| `npx` isn't recognized in PowerShell, or "running scripts is disabled" | Run the commands in **Command Prompt** instead, or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once. |
| The QR code shows an address like `172.21.…` or `10.195.…` | Your laptop has several network adapters (WSL, VPN). Use `npm run tunnel`. |
| A red error screen on the phone | Take a photo of it and share it with the team. That's a code bug, not a setup problem. |

## Try it

1. **Squad → Explore.** Pip scouts a real nearby place and returns with a postcard and a spoken memo.
2. **Take me there.** With **demo mode** on (the default, good for indoor judging), the walk is simulated and the trail blooms. With demo mode off, actually walk there; Fern notices when you're within 40 m.
3. **📸 Capture.** The camera opens with Pip in the frame. Snap a photo, then **Save to album**.
4. **Ranks:** see your points, the trail picker and the leaderboards. **Savings:** see your tree and the rides you skipped.
5. **📍 Live location:** turns on real GPS and the phone's **step counter**, so your actual walk blooms and real steps count toward your rank.

## What's native here (vs. the old web prototype, now removed)

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
src/core/               shared game logic, GENERATED from ../core (don't edit here)
src/game/state.js       initial state, saved fields, derived values
src/game/store.js       tiny state store (getState / setState / useStore)
src/game/game.js        game actions: agents, guided walks, capture, savings, Nessie
src/game/walking.js     movement: simulated walks, GPS, step counter, blooms, trails
src/components/         TrailMap, AgentList, RanksPanel, SavingsPanel, AlbumPanel, PostcardModal, CaptureModal
src/storage.js          AsyncStorage
src/voice.js            speech (placeholder for Grok Voice)
```

**Shared logic:** the agents, ranks, trails, leaderboards, savings, Nessie client and art live in [`../core/`](../core/). After changing them, run `npm run sync-core` to copy them into `src/core/`.

## Checks

```bash
npx expo-doctor     # config and dependency check
npx expo lint       # ESLint
npx expo export --platform android --platform ios   # bundles the app; catches import and syntax errors
```

Run all three before pushing changes to the phone app. The export writes to `dist/`, which git ignores.

The app now runs on a real phone through Expo Go with `npm run tunnel`. Still test the full loop (explore, walk there, capture) on both iPhone and Android before the demo.

## Known limits and next steps

- **Grok isn't used yet (required for the Cursor track).** Voice uses `expo-speech`, and postcards are SVG art. Add a small backend that holds the Grok key and calls Grok Voice and Grok Imagine. Never put the key in the app.
- **Nessie uses plain HTTP.** Expo Go allows that. A store build needs cleartext HTTP enabled for `api.nessieisreal.com` (Android `usesCleartextTraffic` via `expo-build-properties`, and an iOS App Transport Security exception). The Nessie calls are also **untested**, since the API was resetting connections during development.
- **Leaderboards use sample players** until there's a backend (for example Supabase). See [docs/mobile-migration.md](../docs/mobile-migration.md).
- **Android step counting** only works while the app is open. Background tracking and **true AR** (ViroReact) need a development build (`npx expo run:android` or EAS).
- **Many flowers on the map** can slow older phones down. The map keeps only the newest 150 flowers.
