# Cursor log

## 2026-10-03 — Drop Nessie; Grok deploy is for the phone

**Prompt (summary).** Deploy the server for Grok on the mobile app. Do not use Nessie. Update READMEs.

**Decisions.** Removed `/api/bank`, `core/nessie.js`, and Render `NESSIE_API_KEY`. Phone saves drop leftover bank keys. Docs describe Render + `EXPO_PUBLIC_API_URL` as the Grok path for Expo.

## 2026-10-03 — Tell a story used Google speech, not ElevenLabs

**Prompt (summary).** Tell a story sounded like Google Maps / Google TTS; use ElevenLabs instead.

**Decisions.** Android still draws the trail with Google Maps; that is not the story voice. `expo-speech` (Google on Android) was the fallback because Expo's Cloudflare tunnel never reached `/api/voice`. `npm run tunnel` now also tunnels port 8765 and sets `EXPO_PUBLIC_API_URL`. Moss requests omit a Grok voice id so the server stays on ElevenLabs.

## 2026-10-03 — Landmark / 3D freeze

**Prompt (summary).** The app freezes when opening a landmark or the AR/3D squad view.

**Decisions.** Unmount the garden map before creating an expo-gl canvas (two GL views at once). Defer the 3D canvas ~80ms, start 3D on the field (AR is opt-in), drop 3D to 12 fps, and slow device-motion updates.

## 2026-10-03 — README and repository cleanup (Codex)

Prompt: create a README and ignore irrelevant files. Rewrote the root README
with current mobile setup, backend integrations, development checks, and the
paw-trail preview. Expanded root ignore rules for secrets, dependencies, caches,
local settings, and render intermediates. Removed ignored files from Git's index
while retaining local copies and final promo artifacts. Work performed in Codex.

## 2026-10-03 — Photon daily places and steps

**Prompt (summary).** Photon should update the user about places they passed and how many steps they walked today.

**Decisions.** Shared `core/dayLog.js` is the source of truth (local calendar day, max steps + union of places). The phone writes `POST /api/day` after walks and arrivals (`EXPO_PUBLIC_PHOTON_PHONE` links the iMessage number). Pip texts a tally on new landmarks or step milestones (1k / 2.5k / 5k / 10k…), and answers `"today"` / `"steps"`. iMessage `"arrived"` also logs estimated steps from the route. Place names still come from the map, not the LLM.

## 2026-10-03 — Bug-hunt tests

**Prompt (summary).** Add more tests and try to find as many bugs as possible.

**Caught and fixed.**

- `walkingMinutes(0)` reported 1 minute.
- `rankFor` / `treeStage` with scores below the first threshold produced `-Infinity` progress.
- File store crashed on `db.json` with `null` collections.
- iMessage treated “come here” as arriving (`\bhere\b`).
- Local turf cap and XP boost counted dead holdings; server already ignored them.

**Tests added.** `core/test/invariants.test.js`, `server/test/invariants.test.js`, `imessage-agent/test/routing.test.js`, `mobile/test/pets-and-turf.test.mjs`.

## 2026-10-03 — ElevenLabs for Moss story voice

**Prompt (summary).** Use the ElevenLabs API key for storytelling voice.

**Decisions.**

- Key stays in gitignored root `.env` (`ELEVENLABS_API_KEY`); never in the Expo bundle. Server already routes `agent: "storyteller"` to ElevenLabs (`eleven_flash_v2_5`) and Pip/Fern to Grok Voice.
- Phone `fetchVoice` now posts `{ text, agent, voice }` so Squad → Tell a story hits ElevenLabs instead of Grok `rex`.
- On-device `expo-speech` remains the fallback when `EXPO_PUBLIC_API_URL` is unset or `/api/voice` fails.

## 2026-10-03 — Paw-trail GIF on `presentation` (Codex)

Prompt: make a quick GIF using the OneTake skills repository. User selected the
paw-trail concept from three options. Installed the requested skill, composed a
10-second animation with the app's artwork and palette, and rendered a looping
GIF plus a 1080p MP4 in `docs/demo-gif/`. OneTake verification passed; the encoded
GIF contact sheet was inspected. This work was performed in Codex, not Cursor.

## 2026-10-03 — Code review fixes on `presentation` (Codex)

**Prompt.** Review the complete repository, then fix the nine reported findings on the presentation branch.

**Execution.** These fixes were made through Codex workspace tools. Cursor Agent was not available to control from this session; this entry does not count them as Cursor usage.

**Changes.** Empty Supabase write responses; database revision checks for concurrent territory claims; ownership-checked guard recall; live leaderboard rows; Grok memo playback and postcard requests; online failures kept separate from local demo claims; foreground territory refresh and HP expiry; server-only Nessie credentials and transfer deduplication; reset cancellation and stale-result guards.

**Setup.** Re-run `server/supabase/schema.sql` for existing Supabase projects. Configure `NESSIE_API_KEY` on the backend and `EXPO_PUBLIC_API_URL` on the phone. Audio uses SDK-compatible `expo-audio`; rebuild existing development clients after installing the new native module.

**Validation.** Core, server, iMessage and mobile regression suites; Expo lint; JS module compilation with TypeScript; Android and iOS Hermes exports. Native playback and the live banking/Supabase services still need device/service verification.

Key prompts and implementation decisions for the SpaceX / Cursor track.

## 2026-10-03 — Story TTS: ElevenLabs + Grok Voice (`story-voice`)

Prompt: set up ElevenLabs, then use TTS for storytelling and Grok so some agents tell those stories.

Decision: facts still come only from Wikipedia. **Moss** narrates with **ElevenLabs**. **Pip and Fern** tell the same nearby-place story in their own framing, spoken with **Grok Voice** (`ara` / `eve`) via `POST /v1/tts`. If only one key is set, every agent uses that provider. Phone sends `{ text, agent, voice }` to `/api/voice`. iMessage: `"story"` is Moss; `"pip story"` / `"fern story"` use Grok.


## 2026-10-03 — Stylized iOS 3D garden map (`3d-map`)

**Prompt (summary).** Build a tilted, playful geographic 3D map for the iOS Expo app, inspired by location-based games like Pikmin Bloom, without copying Niantic assets. Prefer OSM vector tiles + MapLibre if Expo SDK 57 allows it. Keep Android and Expo Go on the existing map. Do not add a web app. Do not edit `mobile/src/core/`.

**Decisions.**

- Renderer: `@maplibre/maplibre-react-native` **11.4.1** (New Architecture only; matches Expo SDK 57 / RN 0.86). Official docs: not available in Expo Go; Expo config plugin + a **development build**.
- Tiles/style: **OpenFreeMap Liberty** (`https://tiles.openfreemap.org/styles/liberty`). Free, no API key, OpenMapTiles schema. The advertised `/styles/3d` URL 404s; Liberty already includes a `building-3d` fill-extrusion layer. Colors are recast in `mobile/src/map/gardenStyle.js` (soft green land, parks, pale roads, blue water, quieter labels). Attribution via MapLibre + a caption (OSM / OpenMapTiles / OpenFreeMap).
- Fallback: `react-native-maps` Apple Maps on iOS in Expo Go, Google Maps on Android. This is a tilted platform map, not a custom stylized 3D renderer.
- MapLibre is imported only after `canUseNativeMapLibre()` (iOS and not Expo Go), via a dynamic `import()` in `GardenMapGate.js`, so Expo Go does not load the native module.
- Camera: pitch ~56°, follow the player until a manual pan (`userInteraction` on `onRegionDidChange`). Recenter re-enables follow. Route preview / expeditions pull the camera back once.
- Toggle: iOS development builds get **🌿 Garden** / **🗺️ Map**. Preference saved as `wanderlings:mapRenderer`.
- iOS bundle id `com.huskiespaws.app`. `expo-dev-client` + `eas.json` development profiles for device/simulator builds. Windows cannot run `expo run:ios` locally; use EAS or a Mac.
- No Unity, no paid tile keys, no secrets in the bundle.

## Earlier work (other branches)

Backend pets/turf/leaderboards and branding were implemented on other branches (`backend`, branding merge on `main`). This log file was created on `3d-map` because `origin/main` did not include it yet.

## 2026-10-03 — Implement docs/HANDOFF-backend.md on `backend`

Prompt: implement the backend handoff (pets/eggs, walking XP with turf boosts, turf HP decay, live leaderboards, mobile API client). Do not deploy, merge, or push. Branch was `photon-setup`; switched to `backend` without merging `main`.

Worked in Cursor Agent on `backend`: `core/rank.js` leagues + `walkXp`, server turf HP, `mobile/src/api.js`, game state/actions, plain `PetsTurfProbe`.
