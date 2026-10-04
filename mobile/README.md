# HuskiesPaws mobile app (Expo)

The mobile version of [HuskiesPaws](../README.md): walk, and your trail blooms. AI agents scout real places, you climb local, statewide and national ranks, and you capture landmarks as postcards. Grok Voice, Grok Imagine, and Moss's ElevenLabs stories run through the backend — never from keys inside the app.

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

   This runs [`scripts/tunnel.mjs`](scripts/tunnel.mjs): a free **Cloudflare quick tunnel** (no account) for Expo, then Expo pointed at it. Optional: a second tunnel for a local API on `:8765` if that server is already running.

   - Wait until the terminal says **Metro is up** (not only **Tunnel hostname**). Then scan the QR. The first load takes about 30 seconds.
   - The address changes every time you start it. **Never scan a QR or trycloudflare link from an earlier run** — that is Cloudflare **530 / error 1033** (tunnel hostname exists, laptop is gone).
   - If you still see 1033: Ctrl+C, wait a few seconds, run `npm run tunnel` again, and scan the **new** QR. Close other `expo start` / tunnel windows so port 8081 is free.
   - **Why not `expo start --tunnel`?** Expo's built-in tunnel uses one ngrok account shared by every Expo user. When it's full, it fails with `CommandError: TypeError: Cannot read properties of undefined (reading 'body')` (ngrok error `ERR_NGROK_108`). The old way is still there as `npm run tunnel:ngrok`.

4. **Scan the QR code.** On iPhone, use the Camera app. On Android, scan from inside Expo Go. Allow **location, camera and motion** access when the app asks.

No API keys are needed for Expo Go or the garden map tiles (OpenFreeMap is free and has no registration).

For live leaderboards, shared turf, Grok memos/postcards, and Pip’s daily walk texts, set `EXPO_PUBLIC_API_URL` in `mobile/.env` to the backend HTTPS origin (the Render URL after you deploy) and restart Expo. `npm run tunnel` keeps that URL if it is already set; otherwise it tunnels a local `server/` on port 8765. Set `EXPO_PUBLIC_PHOTON_PHONE` to the same E.164 number as the iMessage agent's `DEMO_PHONE_NUMBER`. Put `XAI_API_KEY` and `ELEVENLABS_API_KEY` on the backend only. There is no Nessie / banking flow.

The app refreshes territory every 15 seconds while active and immediately on resume. Offline territory claims are allowed only in demo mode with no API URL; connection errors do not grant local territory.

After pulling the audio change, run `npm install`. Existing development builds must be rebuilt to include `expo-audio`; Expo Go includes it. Regression checks: `npm test`, `npx expo lint`, and `npx expo export --platform android --platform ios`.

## iOS garden map (development build)

The tilted **garden map** is a MapLibre Native vector map styled from [OpenFreeMap Liberty](https://openfreemap.org/) (OpenStreetMap data, OpenMapTiles schema). It is **not in Expo Go**. Official MapLibre docs require a custom native binary.

Attribution (required): **OpenFreeMap · OpenMapTiles · OpenStreetMap**. MapLibre draws the style attribution; the app also shows a caption. There is **no API key** and no paid tile account.

This is a custom stylized 3D renderer (extruded buildings from the Liberty `building-3d` layer, recast land/park/road/water colors, tilted follow camera). The Expo Go iOS map is still **Apple Maps** with pitch — a platform map, not that renderer. Android stays on `react-native-maps` / Google Maps.

### On a Mac (local iPhone or simulator)

1. `cd mobile` and `npm install`
2. Connect an iPhone (Developer Mode on) or use the Simulator
3. `npx expo run:ios`  
   First run compiles native code (MapLibre plugin + `expo-dev-client`). Installs the **HuskiesPaws** dev client, not Expo Go.
4. After that, `npx expo start` and open the project in the installed dev client.

Windows cannot compile iOS locally.

### From Windows / EAS (install on a physical iPhone)

You need an [Expo](https://expo.dev) account and an Apple Developer account for a device build.

```bash
cd mobile
npm install
npx eas-cli@latest login
npx eas-cli@latest build --platform ios --profile development
```

Install the build from the EAS page (QR / link) on the iPhone. Then on the laptop:

```bash
cd mobile
npx expo start --dev-client
```

Open the project in the **HuskiesPaws** development client (not Expo Go). On guest Wi-Fi: `npm run tunnel -- --dev-client`.

A simulator IPA: `--profile development-simulator` (install on a Mac simulator only).

### In the app

- **🌿 Garden** / **🗺️ Map** (iOS development build only): switch renderers. Saved as `wanderlings:mapRenderer`.
- **Crosshair**: recenter and resume follow. Panning the garden map pauses follow until you recenter.

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
| Cloudflare 530 / Error 1033 on trycloudflare.com | That hostname is from a **dead** tunnel (old QR, laptop slept, or Metro was not up yet). Ctrl+C, run `npm run tunnel` again, wait for **Metro is up**, scan the **new** QR. |
| Loading spins forever, "Could not connect to development server", or "request timed out" | The network blocks LAN. Use `npm run tunnel`. Wait for Metro before scanning. |
| "Project is incompatible with this version of Expo Go" | Update Expo Go from the app store. The project needs SDK 57. |
| `The expected package.json path ... does not exist` | You're in the wrong folder. `cd mobile` first (step 1). |
| `npx` isn't recognized in PowerShell, or "running scripts is disabled" | Run the commands in **Command Prompt** instead, or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once. |
| The QR code shows an address like `172.21.…` or `10.195.…` | Your laptop has several network adapters (WSL, VPN). Use `npm run tunnel`. |
| A red error screen on the phone | Take a photo of it and share it with the team. That's a code bug, not a setup problem. |

## Try it

1. **Squad → Explore.** Pip scouts a real nearby place and returns with a postcard and a spoken memo.
2. **Take me there.** With **demo mode** on (the default, good for indoor judging), the walk is simulated and the trail blooms. With demo mode off, actually walk there; Fern notices when you're within 40 m.
3. **📸 Capture.** The camera opens with Pip in the frame. Snap a photo, then **Save to album**.
4. **Ranks:** see your points, the trail picker and the leaderboards.
5. **📍 Live location:** turns on real GPS and the phone's **step counter**, so your actual walk blooms and real steps count toward your rank.

## What's native here (vs. the old web prototype, now removed)

| Feature | Web prototype | This app |
|---|---|---|
| Steps | Estimated from distance | **Real step counter** (`expo-sensors` Pedometer) |
| Map | Leaflet | `react-native-maps` on Android and in Expo Go; iOS development builds can use MapLibre + OpenFreeMap (garden map) |
| Capture | Browser camera | `expo-camera` and `react-native-view-shot` |
| Voice | Browser speech | Server audio (`/api/voice`) with `expo-speech` fallback |
| Saved progress | localStorage | AsyncStorage |

## Code layout

```
App.js                  main screen: map, controls, tabs, modals
src/core/               shared game logic, GENERATED from ../core (don't edit here)
src/game/state.js       initial state, saved fields, derived values
src/game/store.js       tiny state store (getState / setState / useStore)
src/game/game.js        game actions: agents, guided walks, capture, pets, turf
src/game/walking.js     movement: simulated walks, GPS, step counter, blooms, trails
src/components/         StandardTrailMap + MapPets, TrailMap switcher, SquadPanel, PetsPanel + PetArt + HatchModal,
                        RanksPanel, AlbumPanel, PostcardModal, CaptureModal, MapControls, StatusToast, ui
src/map/                iOS garden map: MapLibre + OpenFreeMap (not loaded in Expo Go)
src/storage.js          AsyncStorage (`wanderlings:` prefix)
src/voice.js            speech (placeholder for Grok Voice)
```

**Shared logic:** the agents, ranks, trails, leaderboards, pets and art live in [`../core/`](../core/). After changing them, run `npm run sync-core` to copy them into `src/core/`.

## Checks

```bash
npx expo-doctor     # config and dependency check
npx expo lint       # ESLint
npx expo export --platform android --platform ios   # bundles the app; catches import and syntax errors
```

Run all three before pushing changes to the phone app. The export writes to `dist/`, which git ignores.

The app now runs on a real phone through Expo Go with `npm run tunnel`. Still test the full loop (explore, walk there, capture) on both iPhone and Android before the demo.

## Known limits and next steps

- **Grok Voice and Imagine** need the backend (`XAI_API_KEY`) and `EXPO_PUBLIC_API_URL` on the phone. Without them, memos use on-device speech and postcards use SVG art. Deploy steps are in the [root README](../README.md) and [server/README.md](../server/README.md).
- **Leaderboards use sample players** until there's a backend (for example Supabase). See [docs/mobile-migration.md](../docs/mobile-migration.md).
- **Android step counting** only works while the app is open. Background tracking and **true AR** (ViroReact) need a development build (`npx expo run:android` or EAS).
- **Garden 3D map is iOS + development build only.** Expo Go keeps Apple Maps. Visual QA on a real iPhone is still outstanding on Windows (no local `expo run:ios`).
- **Many flowers on the map** can slow older phones down. The map keeps only the newest 150 flowers.
