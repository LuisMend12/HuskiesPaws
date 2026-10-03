# HuskiesPaws server

One small Node server (no dependencies) that:

- **serves the web app** (`../prototype/`), the same way `python serve.py` does, and
- **holds the secrets** behind a small API, so keys never reach the browser:

| Endpoint | What it does |
|---|---|
| `POST /api/voice` | **Grok Voice:** text-to-speech for agent memos. Returns audio. |
| `POST /api/imagine` | **Grok Imagine:** postcard illustrations and pet portraits. Prompts are built here from fixed templates (the browser can't send its own), and each image is generated once and cached. |
| `POST /api/score`, `GET /api/leaderboard` | Live **local / statewide / national** leaderboards |
| `GET /api/turf`, `POST /api/turf/claim` | **Turf:** guard landmarks with pets. A stronger pet takes over; holding earns XP per hour. |
| `GET /api/health` | Shows whether Grok is on and which storage is in use |

Without the server, the web app still works: it uses browser speech, SVG art and sample leaderboards, and turf is off.

## Run it locally

You need Node.js 22.9 or newer.

```bash
cd big-red-hacks2026/server
npm start
```

Open **http://localhost:8765**. The startup line shows what's on:

```
HuskiesPaws running at http://localhost:8765
  Grok: on · storage: file · map: Mapbox
```

Settings come from the **repo-root `.env`** (the same file `serve.py` uses) or `server/.env`. See [.env.example](.env.example):

| Setting | Needed for |
|---|---|
| `XAI_API_KEY` | Grok Voice and Grok Imagine. Get it at console.x.ai. |
| `MAPBOXKEY` | The map (a public `pk.` token) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | Optional. Without them, data is saved in `server/data/db.json`. |

## Deploy with HTTPS (Render, free)

Phones only allow GPS and the camera on HTTPS sites, so deploy before testing on phones.

1. Push the repo to GitHub.
2. In [Render](https://render.com): **New → Blueprint**, then pick this repo. It reads [`render.yaml`](../render.yaml).
3. Fill in `XAI_API_KEY` and `MAPBOXKEY` when asked. Add the Supabase values too if you set it up.
4. Open the `https://huskiespaws-….onrender.com` link it gives you. Check `/api/health` first.

Notes on the free plan:
- It **sleeps after about 15 minutes idle**, and the first visit takes about a minute to wake. Open it a few minutes before judging.
- Its **disk resets on every deploy**. Without Supabase, leaderboards, turf and cached images start fresh each time.

## Supabase (optional, keeps data across redeploys)

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query**, paste [supabase/schema.sql](supabase/schema.sql), and click **Run**.
3. Copy the **Project URL** and the **service_role** key from **Project Settings → API** into `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.

The service-role key is a full-access key. It stays on the server; row-level security blocks direct browser access. **The Supabase code hasn't been tested against a live project yet,** so check `/api/health` (it should say `"storage":"supabase"`) and post a score after setting it up.

## Protecting the Grok budget

- Per-IP limits (20 voice and 6 images per minute) and a daily cap for the whole server (1,000 voice, 200 images). Tune them in `.env`.
- Images are cached, so each place or pet is only drawn once.
- Only fixed prompt templates are used, so the key can't be used to generate arbitrary images.

## Tests

```bash
npm test
```

These run the real server against a **fake xAI service**. They check that the Grok requests match xAI's documented format, plus caching, rate limits, validation, leaderboards (player IDs are never exposed), the turf rules, and path-traversal protection.

**Not verified:** calls to the real xAI API (no key was available), and Supabase.

## Files

```
src/index.js            settings from env, picks storage, starts the server
src/app.js              routing, /env.js, static files, errors
src/routes.js           the API handlers
src/grok.js             xAI client and prompt templates
src/turf.js             turf rules (claim, defend, capture, cap of 3, XP per hour)
src/validate.js         input validation for every endpoint
src/rateLimit.js        per-IP and daily limits
src/store/fileStore.js  JSON file storage (default)
src/store/supabaseStore.js  Supabase storage
supabase/schema.sql     tables for Supabase
```
