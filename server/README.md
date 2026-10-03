# HuskiesPaws server

One small Node server (no dependencies) that backs the phone app (`../mobile/`). It **holds the secrets** behind a small API, so keys never ship inside the app:

| Endpoint | What it does |
|---|---|
| `POST /api/voice` | **Grok Voice:** text-to-speech for agent memos. Returns audio. |
| `POST /api/imagine` | **Grok Imagine:** postcard illustrations and pet portraits. Prompts are built here from fixed templates (the app can't send its own), and each image is generated once and cached. |
| `POST /api/score`, `GET /api/leaderboard` | Live **local / statewide / national** leaderboards |
| `GET /api/turf`, `POST /api/turf/claim`, `POST /api/turf/recall` | **Turf:** claim with a stronger pet, recall your guard, and earn a walking XP boost while holding. Guards decay over time. |
| `POST /api/bank/connect`, `POST /api/bank/transfer` | Nessie sandbox accounts and walk transfers using the server's key. |
| `GET /api/health` | Shows whether Grok is on and which storage is in use |

Without a configured API URL, the phone uses on-device speech, SVG art and sample leaderboards. Local turf is available in demo mode only. When an API URL is configured, a failed claim remains unconfirmed; it never grants local ownership.

## Run it locally

You need Node.js 22.9 or newer.

```bash
cd big-red-hacks2026/server
npm start
```

Check **http://localhost:8765/api/health**. The startup line shows what's on:

```
HuskiesPaws running at http://localhost:8765
  Grok: on · storage: file
```

Settings come from the **repo-root `.env`** or `server/.env`. See [.env.example](.env.example):

| Setting | Needed for |
|---|---|
| `XAI_API_KEY` | Grok Voice and Grok Imagine. Get it at console.x.ai. |
| `NESSIE_API_KEY` | Optional Nessie sandbox banking. Kept on the backend; the phone's Connect savings button needs no key. HTTPS only, with no insecure redirect fallback. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | Optional. Without them, data is saved in `server/data/db.json`. |

## Deploy with HTTPS (Render, free)

Phones on other networks can't reach your laptop, so deploy before testing turf, leaderboards and Grok on phones.

1. Push the repo to GitHub.
2. In [Render](https://render.com): **New → Blueprint**, then pick this repo. It reads [`render.yaml`](../render.yaml).
3. Fill in `XAI_API_KEY` when asked. Add the Supabase values too if you set it up.
4. Open `https://huskiespaws-….onrender.com/api/health` to check it's up. That base URL is what the phone app calls.

Notes on the free plan:
- It **sleeps after about 15 minutes idle**, and the first visit takes about a minute to wake. Open it a few minutes before judging.
- Its **disk resets on every deploy**. Without Supabase, leaderboards, turf and cached images start fresh each time.

## Supabase (optional, keeps data across redeploys)

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query**, paste [supabase/schema.sql](supabase/schema.sql), and click **Run**.
3. Copy the **Project URL** and the **service_role** key from **Project Settings → API** into `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.

**Existing projects:** re-run the updated schema before restarting the server. It adds the private bank tables and `turf_snapshot`, `commit_turf`, `recall_guard` and `reserve_transfer` functions. Territory decisions are computed from a consistent snapshot and committed only if the database revision still matches, including the three-landmark ownership cap. RPC execution is restricted to `service_role`.

Bank setup reuses the server's saved account mapping. Each transfer reserves its trip ID before contacting Nessie. Completed transfers can be read again safely; pending transfers need reconciliation after an uncertain response and are never automatically sent twice. As with scores and turf, player IDs currently act as capabilities rather than authenticated accounts; this remains a sandbox demo.

The service-role key is a full-access key. It stays on the server; row-level security blocks direct access from clients. **The Supabase code hasn't been tested against a live project yet,** so check `/api/health` (it should say `"storage":"supabase"`) and post a score after setting it up.

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
