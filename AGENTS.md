# HuskiesPaws: notes for AI coding agents (Cursor, Claude Code, Codex)

The app was called **Wanderlings** while brainstorming; the `wanderlings:` storage prefix keeps that name on purpose (renaming them would wipe saved progress).

BigRed//Hacks 2026 project. Theme: **Navigation**. **Deadline: Sunday Oct 4, 8:30 AM** (Devpost).
Read [PLAN.md](PLAN.md) for scope and priorities, and [README.md](README.md) for the idea.

## Build in Cursor
The SpaceX track requires the project to be **built with Cursor**, and judges reward heavy use. Do new work in Cursor (Agent mode), keep `.cursor/rules/` current, and log key prompts in `CURSOR_LOG.md`.

## Layout
The product is the **phone app** (`mobile/`). The web app was dropped on Oct 3; don't add web code.

| Folder | What | Run |
|---|---|---|
| `server/` | Node server (no deps): `/api` for Grok, leaderboards, turf. Holds all secrets. No web pages. | `npm start`, `npm test` |
| `core/` | **Shared game logic, the source of truth:** `agents`, `rank`, `leaderboard`, `savings`, `nessie`, `pets`, `services`, `geo`, `art`, `config` | Plain JS, no DOM or React Native. Keep it that way. `npm test` in `core/`. |
| `mobile/` | Expo SDK 57 app (Expo Go) | `npx expo start` |
| `mobile/src/core/` | **Generated** copy of the shared logic | Never edit; change `core/` and run `npm run sync-core` in `mobile/` |
| `imessage-agent/` | Photon Spectrum iMessage agent | `npm run terminal` (no keys), `npm start` (Photon keys), `npm test` |
| `docs/` | Idea sheets (LaTeX), mobile migration plan | |

## Rules that bite
- **Secrets:** keys go in `.env` (git-ignored at the root and per folder). Never hardcode them or put them in the app bundle. Grok and real bank keys belong on a backend.
- **User-Agent:** Wikipedia and OpenStreetMap return 403 to generic clients. Node and React Native must call `setRequestHeaders({ "User-Agent": "HuskiesPaws/1.0 (...)" })` from `services.js`.
- **Facts come from tools:** agent memos only use data returned by Wikipedia or routing. Don't let an LLM invent place facts.
- **Immutable state updates** (spread, map, filter). Keep files under about 400 lines.
- After changing shared logic, run `npm test` in `core/`, then `npm run sync-core` and `npx expo lint` in `mobile/`, and run `npm test` in `imessage-agent/`.

## Known gaps (from PLAN.md)
1. **Grok is wired up but untested live:** `server/` calls xAI TTS and Imagine, tested only against a fake. Needs `XAI_API_KEY`. The phone app falls back to on-device speech and SVG art without it.
2. **Not deployed yet:** `render.yaml` is ready. Supabase storage is written but untested; file storage is the default.
3. **Nessie calls are untested.** The API was resetting connections. It uses plain HTTP, which store builds block.
4. The phone app runs on iPhone through Expo Go (`npm run tunnel`); Android/Google Maps still has issues. It doesn't have pets, turf or Grok yet. Those were built only in the removed web app: see `prototype/js/pets-ui.js`, `online.js`, `api.js`, `grok-art.js` and `voice.js` in git history before the web app was removed.
5. iMessage sessions are kept in memory only.
