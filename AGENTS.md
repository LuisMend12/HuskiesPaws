# Wanderlings: notes for AI coding agents (Cursor, Claude Code, Codex)

BigRed//Hacks 2026 project. Theme: **Navigation**. **Deadline: Sunday Oct 4, 8:30 AM** (Devpost).
Read [PLAN.md](PLAN.md) for scope and priorities, and [README.md](README.md) for the idea.

## Build in Cursor
The SpaceX track requires the project to be **built with Cursor**, and judges reward heavy use. Do new work in Cursor (Agent mode), keep `.cursor/rules/` current, and log key prompts in `CURSOR_LOG.md`.

## Layout
| Folder | What | Run |
|---|---|---|
| `server/` | Node server (no deps): serves the web app + `/api` for Grok, leaderboards, turf. Holds all secrets. | `npm start`, `npm test` |
| `prototype/` | Web app (HTML + ES modules, Mapbox) | Through `server/`, or `python serve.py` (no API) |
| `prototype/js/` | **Shared game logic, the source of truth:** `agents`, `rank`, `leaderboard`, `savings`, `nessie`, `pets`, `services`, `geo`, `art`, `config` | Plain JS, no DOM. Keep it that way. `npm test` in `prototype/`. |
| `mobile/` | Expo SDK 57 app (Expo Go) | `npx expo start` |
| `mobile/src/core/` | **Generated** copy of the shared logic | Never edit; change `prototype/js/` and run `npm run sync-core` in `mobile/` |
| `imessage-agent/` | Photon Spectrum iMessage agent | `npm run terminal` (no keys), `npm start` (Photon keys), `npm test` |
| `docs/` | Idea sheets (LaTeX), mobile migration plan | |

## Rules that bite
- **Secrets:** keys go in `.env` (git-ignored at the root and per folder). Never hardcode them or put them in browser or app bundles. Grok and real bank keys belong on a backend. `serve.py` only exposes `MAPBOXKEY`.
- **User-Agent:** Wikipedia and OpenStreetMap return 403 to generic clients. Node and React Native must call `setRequestHeaders({ "User-Agent": "Wanderlings/1.0 (...)" })` from `services.js`. Browsers must not, because it breaks CORS.
- **Facts come from tools:** agent memos only use data returned by Wikipedia or routing. Don't let an LLM invent place facts.
- **Immutable state updates** (spread, map, filter). Keep files under about 400 lines.
- After changing shared logic, check the web prototype, run `npm run sync-core` and `npx expo lint` in `mobile/`, and run `npm test` in `imessage-agent/`.

## Known gaps (from PLAN.md)
1. **Grok is wired up but untested live:** `server/` calls xAI TTS and Imagine, tested only against a fake. Needs `XAI_API_KEY`. The app falls back to browser speech and SVG art without it.
2. **Not deployed yet:** `render.yaml` is ready. Supabase storage is written but untested; file storage is the default.
3. **Nessie calls are untested.** The API was resetting connections. It uses plain HTTP, which store builds block.
4. The mobile app hasn't been run on a physical phone yet, and it doesn't have pets, turf or Grok yet.
5. iMessage sessions are kept in memory only.
