# HuskiesPaws

<p align="center"><img src="docs/logo/huskiespaws-logo.svg" alt="HuskiesPaws logo" width="560"></p>

**Walk somewhere new. Bloom a trail. Hatch a pet.**

HuskiesPaws turns everyday walks into an adventure. Pip scouts real nearby places,
Moss tells their stories, and Fern plans the walking route. Steps bloom a flower
trail and hatch pets.

Built for [BigRed//Hacks 2026](https://bigredhacks2026.devpost.com/) at Cornell,
October 2–4, around the theme **Navigation**. Team: **Luis Mendez and Abdullah Rashid**.
The product is the Expo phone app; the backend serves APIs. There is no web frontend.

## Preview

![Paw-trail promo](docs/demo-gif/huskiespaws.gif)

[1080p video](docs/demo-gif/huskiespaws.mp4) · [Demo walkthrough](docs/DEMO.md)

The animation illustrates the walking loop; it is not a screen recording.

## Features

| Feature | What it does |
|---|---|
| Agent squad | Pip, Moss, and Fern scout, tell stories, and guide walks using Wikipedia and routing data. Place facts come from tools. |
| Blooming trails | Walking leaves flowers on the map; ranks unlock trail styles. |
| Demo and GPS walks | Simulate an indoor judging walk or use live location and supported phone step sensors while the app is open. |
| Postcards | Capture nearby landmarks and save them in an album. Optional Grok Imagine illustrates discoveries and pets. |
| Eggs, pets, and turf | Earn eggs by walking, hatch pets, and guard landmarks. Stronger pets can take turf. Eggs come from walking only. |
| ISS rarity | Live ISS position boosts rare hatch odds when overhead. |
| Leaderboards | Local, statewide, and national rankings through the backend; sample rankings without a configured API. |
| Voice | Server-generated audio (Grok Voice for Pip and Fern, ElevenLabs for Moss) with on-device speech fallback. |
| iMessage | Photon Spectrum agent shares the squad and reports today's steps and places passed. |

## Quick start

Requires **Node.js 22.9+**, npm, and Expo Go compatible with **Expo SDK 57**.
Run from the repository root:

```bash
git clone https://github.com/LuisMend12/big-red-hacks2026.git
cd big-red-hacks2026
npm --prefix mobile ci
npm --prefix mobile run start:go
```

Scan the QR code in Expo Go and allow location, camera, and motion permissions
when requested. On venue Wi-Fi, use `npm --prefix mobile run tunnel` instead.
The app runs without backend credentials using local art, on-device speech, and
sample or demo features. Live rankings, shared turf, and Grok voice/art need the API.

In PowerShell, use `npm.cmd` and `npx.cmd` if script execution policy blocks npm.

## Backend setup (for the phone app)

The Expo app does not hold Grok or ElevenLabs keys. Deploy or run `server/` and
point the phone at it with `EXPO_PUBLIC_API_URL`. There is no Nessie / banking
integration.

Copy the safe templates before adding settings. Keep existing environment files
if already configured.

```bash
Copy-Item server/.env.example server/.env
Copy-Item mobile/.env.example mobile/.env
npm --prefix server start
```

The server has no npm dependencies. Check `http://localhost:8765/api/health`.
The API serves `/api/*` and generated `/images/*`; it does not serve web pages.

The server reads root `.env` and `server/.env` if they exist. You only need one of
those files. A Node warning about `.env not found` meant the other copy was missing;
the server still starts. Locally `GROK_API_KEY` is accepted as an alias for
`XAI_API_KEY`.

| Server variable | Purpose |
|---|---|
| `XAI_API_KEY` | Grok Voice (Pip, Fern) and Grok Imagine (postcards, pet art) |
| `ELEVENLABS_API_KEY` | Moss's story voice |
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | Persistent shared storage instead of local JSON |
| `PORT` | API port, default `8765` (Render sets this for you) |

In `mobile/.env`, set `EXPO_PUBLIC_API_URL` to the backend origin (no trailing
slash, no `/api`). A physical phone needs a reachable HTTPS URL: `localhost` on
the phone means the phone itself. Restart Expo after environment changes.
`npm run tunnel` keeps a URL already set in `EXPO_PUBLIC_API_URL`.

**Never put private keys in `EXPO_PUBLIC_*` variables or the app bundle.**
Environment files are ignored; safe `.env.example` templates remain versioned.

### Deploy Grok for the phone (Render)

Phones on other networks cannot reach your laptop, so host the API with HTTPS.

1. Get an xAI key at [console.x.ai](https://console.x.ai).
2. Push this repo to GitHub (`https://github.com/LuisMend12/big-red-hacks2026`).
3. In [Render](https://render.com): **New → Blueprint**, pick this repo. It reads
   [`render.yaml`](render.yaml).
4. Paste the xAI key as **`XAI_API_KEY`**. Add `ELEVENLABS_API_KEY` for Moss.
   Do not add a Nessie key.
5. Open `https://huskiespaws-….onrender.com/api/health`. You want `"grok": true`.
6. Put that origin in `mobile/.env` as `EXPO_PUBLIC_API_URL` and restart Expo.

Free Render sleeps after about 15 minutes idle; wake `/api/health` before a demo.
Without Supabase, file storage resets on each deploy.

## Maps and development builds

Expo Go uses Apple Maps on iOS and Google Maps on Android through
`react-native-maps`. The tilted MapLibre garden map uses OpenFreeMap and requires
an **iOS development build**, gated by `canUseNativeMapLibre()`.

On a Mac with Xcode, run `npx expo run:ios` inside `mobile/`. For cloud builds, use
the development profile in [mobile/eas.json](mobile/eas.json). Install the client,
then start Expo with `--dev-client`. Rebuild existing clients after native
plugin or dependency changes, including `expo-audio`.

See [mobile/README.md](mobile/README.md) for maps, tunnels, and troubleshooting.

## Optional iMessage agent

```bash
npm --prefix imessage-agent ci
npm --prefix imessage-agent run terminal
```

Terminal mode needs no Photon keys. For live iMessage, copy
[imessage-agent/.env.example](imessage-agent/.env.example) to the package's `.env`,
configure Photon, and run `npm --prefix imessage-agent start`.

To link phone walks to Pip, match the phone's `EXPO_PUBLIC_PHOTON_PHONE` with the
agent's `DEMO_PHONE_NUMBER` (E.164), and point `HUSKIESPAWS_API_URL` at the same API
as the phone. Commands include `explore`, `story`, `take me there`, `arrived`,
and `today`. See [the agent guide](imessage-agent/README.md).

## Project layout

| Path | Purpose |
|---|---|
| [mobile/](mobile/) | Expo phone app |
| [core/](core/) | Shared plain JavaScript game rules and services; source of truth |
| [mobile/src/core/](mobile/src/core/) | Generated copy of shared logic; do not edit directly |
| [mobile/src/map/](mobile/src/map/) | iOS garden map |
| [server/](server/) | Secrets, Grok, audio, images, rankings, and turf APIs for the phone |
| [imessage-agent/](imessage-agent/) | Photon Spectrum and terminal agent |
| [docs/](docs/) | Demo, design notes, branding, and promo artifacts |
| [render.yaml](render.yaml) | Render deployment blueprint |

The earlier name was **Wanderlings**. Keep the `wanderlings:` storage prefix to
preserve saved progress.

## Development and checks

```bash
npm --prefix core test
npm --prefix server test
npm --prefix mobile test
npm --prefix mobile run lint
npm --prefix imessage-agent test
```

After changing shared logic, test `core/`, run
`npm --prefix mobile run sync-core`, lint mobile, and test the iMessage agent.
Commit shared source and its generated mobile copy together. Keep core free of
DOM and React Native, use immutable state updates, and keep files around 400 lines.
Wikipedia and OpenStreetMap requests need the identifying User-Agent set through
`setRequestHeaders` in `core/services.js`.

Keep shared [Cursor rules](.cursor/rules/) current and record substantial work in
[CURSOR_LOG.md](CURSOR_LOG.md). Scope and agent guidance: [PLAN.md](PLAN.md),
[AGENTS.md](AGENTS.md).

## Deployment and current limits

- Deploy the API with [render.yaml](render.yaml) so the **phone app** can use
  Grok. Set `EXPO_PUBLIC_API_URL` to the HTTPS origin.
- Default storage is `server/data/db.json`. Ephemeral hosting does not preserve
  it across redeploys. For Supabase, apply
  [server/supabase/schema.sql](server/supabase/schema.sql), including updates to
  existing databases, before enabling that store.
- Live xAI, ElevenLabs, and Supabase integrations need verification with real
  credentials. Mock tests do not establish live-service availability.
- Android maps have known rough edges. Garden maps need an iOS development build.
- No background walking tracking or true AR. iMessage sessions are in memory and
  reset when the process restarts.

See [server/README.md](server/README.md) for API and hosting details.

## Credits and licensing

Place data: Wikipedia and OpenStreetMap contributors. Garden tiles: OpenFreeMap,
OpenMapTiles, and OpenStreetMap. ISS data: wheretheiss.at. Typeface: Nunito.

No root project license is specified. `mobile/LICENSE` contains the Expo template
license. Promo tooling includes OneTake's **PolyForm Noncommercial 1.0.0** license
in [docs/demo-gif/ONETAKE-LICENSE](docs/demo-gif/ONETAKE-LICENSE).
