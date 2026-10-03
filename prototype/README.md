# Wanderlings prototype

A quick concept demo of [Wanderlings](../docs/ideas/12-wanderlings.tex): a walking game where AI agent companions scout real places for you.

> **This is a throwaway prototype, not the submission.** The Cursor track requires the project to be built with Cursor. Use this to test the idea, then build the real version in Cursor.

## How to run it

> **For the full app, run it through the HuskiesPaws server:** `cd server` then `npm start`, and open http://localhost:8765. The server adds **Grok Voice and Imagine**, **live leaderboards**, and **pets guarding landmarks (turf)**. See [server/README.md](../server/README.md). The steps below (`python serve.py`) still work, but without those features.

### What you need

- **Python 3**, just to run a small local web server. Check with `python --version`.
  - On Mac, use `python3` instead of `python` in the commands below.
- An internet connection. The app loads map tiles and Wikipedia data live.
- A modern browser such as Chrome, Edge, Firefox or Safari.
- A free **Mapbox access token** for the map. Sign up at [mapbox.com](https://account.mapbox.com/) and copy your **default public token**, which starts with `pk.`. Put it in a `.env` file at the **repo root** (git ignores it):

  ```
  MAPBOXKEY = pk.your-token-here
  ```

There's no `npm install` and no build step.

### Steps

1. **Open a terminal in the `prototype` folder.**

   ```bash
   cd big-red-hacks2026/prototype
   ```

2. **Start the local server.**

   ```bash
   python serve.py
   ```

   You should see `Serving Wanderlings at http://localhost:8765`. Leave this terminal open.

   `serve.py` works like `python -m http.server`, but also passes the Mapbox token from `.env` to the page. It only passes `MAPBOXKEY`, so other keys in `.env` never reach the browser.

3. **Open the app** at **http://localhost:8765**.

   If the map asks for a token instead, `serve.py` didn't find `MAPBOXKEY` in `.env`. You can also paste the token there and click **Show map**. That's saved in the browser, which is how the map works on hosts without `serve.py`, such as GitHub Pages.

4. **Stop the server** when you're done by pressing `Ctrl+C` in the terminal.

> **Why not just double-click `index.html`?** The app uses JavaScript modules, and browsers block those on `file://` pages. It has to be served over `http://`.

### Try the demo

1. Click **Explore**. Pip goes on an expedition and returns with a postcard and a spoken memo. Turn your volume up.
2. On the postcard, click **Take me there**. Fern plans a walking route and walks you there, and flowers bloom along your trail.
3. When you arrive, click **📸 Capture**. The camera opens with Pip in the frame. Snap the landmark, and it's saved as a postcard in your **Album** tab.
4. Open the **Ranks** tab, or click the rank badge at the top right. Watch your points go up, and switch between the **Local**, **Statewide** and **National** leaderboards. After your first rank-up, your trail changes from 🌱 sprouts to 🌼 meadow flowers. You can pick any unlocked trail under **Your trail**.
5. Open the **Savings** tab. The walk you just took counted as an ~$8 ride you skipped, so your tree has sprouted. Optionally, connect a Capital One Nessie key there.
6. Click **Tell a story**. Moss reads the history of the nearest landmark.
7. Click **Demo walk** to take a quick walk somewhere new, then click **Explore** again from there.
8. Optional: click **Use my location** to make your real walk bloom (see the phone notes below).

Your progress (steps, landmarks, album, agent levels) is saved in the browser. To start over before a demo, use **Ranks → Reset my progress**.

The map starts at the Physical Sciences Building at Cornell. To start somewhere else, change `DEFAULT_CENTER` in `js/config.js`.

### Running it on your phone

Phone browsers only share location over **HTTPS** or on **localhost**. Opening `http://<your-laptop-ip>:8765` from a phone loads the app, but **Use my location** won't work there. Everything else will. For real GPS walking on a phone, either:

- deploy the folder to any static host with HTTPS (GitHub Pages, Netlify or Vercel), or
- use a tunnel such as `npx localtunnel --port 8765` or `ngrok http 8765`, which gives you an HTTPS link.

### Troubleshooting

| Problem | Fix |
|---|---|
| `python: command not found` | Try `python3` or `py`. Otherwise, install Python 3. |
| `Address already in use` | Port 8765 is taken. Use another port, such as `python serve.py 8800`, and open that port. |
| The page is blank or buttons don't work | Make sure you opened `http://localhost:...` and not the file directly. Check the browser console (F12) for errors. |
| The map asks for a token | Check that `.env` is at the repo root, has a line `MAPBOXKEY = pk.…`, and that you started the app with `python serve.py`. Or paste the token into the form. To change it later, clear the site's data in the browser, or run `localStorage.removeItem("wanderlings:mapboxToken")` in the console and reload. |
| The map stays blank after adding a token | The token is wrong, or it's restricted to other URLs. Check the console (F12) for a Mapbox error. No internet connection, or a network that blocks `api.mapbox.com`, also causes this. |
| "Pip got lost (network problem)" | Wikipedia didn't respond. Wait a moment and try again. |
| The route is a straight line | The walking-route server was unavailable, so the app fell back to a straight line. It's still usable. |
| No sound | Unmute the tab. Some browsers only speak after you've clicked something on the page. |
| The Capture button is grayed out | You need to be at a landmark Pip found. Use **Take me there** first. |
| The camera doesn't open | Allow camera access in the browser. The camera only works on localhost or HTTPS. Without it, capture uses the Wikipedia photo. |
| You want a clean slate for a demo | **Ranks → Reset my progress**. This keeps your Nessie connection. |
| "Couldn't connect to Nessie" | Check the key. Nessie may also be down or blocked on this network. Savings keep working in demo mode. |
| A walk didn't add savings | Walks under 300 m don't count as a skipped ride. |

## What works

- **Pip (Scout):** finds a nearby place you haven't visited, using Wikipedia's geo search. Pip "travels" there (the timer scales with distance), then returns with a postcard, the place's real photo and facts, and a spoken memo.
- **Moss (Storyteller):** reads the history of the nearest landmark aloud.
- **Fern (Pathfinder):** plans a real walking route to Pip's discovery and walks you there. Your trail blooms with flowers along the way.
- **Demo walk:** a sped-up walk, for showing the app indoors.
- **Use my location:** live GPS, so your real walk blooms. It needs HTTPS or localhost. On the first location fix, the app also looks up your city, state and country for the leaderboards.
- Agents level up and get a flower hat at level 2.

Agents only say facts returned by their tools (Wikipedia and routing data), and every postcard links to its source.

### Ranks and leaderboards

You earn points like this:

| Action | Points |
|---|---|
| Every 10 steps (estimated as distance ÷ 0.75 m) | 1 |
| A landmark found by Pip | 50 |
| A landmark captured in your album | 100 |

Ranks go 🌱 Seedling (0) → 🌿 Sprout (100) → 🌷 Bud (300) → 🌸 Blossom (700) → 🌳 Grove (1,500) → 🌲 Ancient Oak (3,000). One full loop (explore, walk there, capture) is enough for your first rank-up.

**Each rank unlocks a new trail,** meaning the flowers that bloom behind you and the color of your path:

| Rank | Trail | Flowers |
|---|---|---|
| 🌱 Seedling | Sprout Path | 🌱 🌿 ☘️ |
| 🌿 Sprout | Meadow | 🌼 🌸 🌷 🌻 |
| 🌷 Bud | Rose Garden | 🌹 🌷 🥀 |
| 🌸 Blossom | Cherry Blossom | 🌸 💮 |
| 🌳 Grove | Forest Floor | 🍄 🍀 🌰 🍂 |
| 🌲 Ancient Oak | Starlight | ✨ 🌟 💫 |

By default (**Auto**), your trail upgrades the moment you rank up, even in the middle of a walk. Under **Ranks → Your trail**, you can pin any trail you've unlocked. Locked trails show the rank you need. When you switch trails, the path you already walked keeps its old flowers.

The leaderboards show **Local** (your city), **Statewide** and **National**. **The other players are sample data:** they're generated the same way every time for each region, and they become real once there's a backend.

### Walk instead of ride: savings tree (Capital One track)

Every walk over **300 m** counts as a rideshare trip you didn't take. The app estimates the fare you avoided and moves it into savings, and that money **grows your tree** in the **Savings** tab: 🌰 Seed → 🌱 Sprout ($5) → 🌿 Sapling ($20) → 🌳 Young tree ($50) → 🌸 Blooming tree ($100) → 🍎 Fruit tree ($250).

- **The fare is an estimate.** Uber has no public pricing API, so `js/savings.js` uses an UberX-style formula: base fare, booking fee, per mile and per minute, with an $8 minimum. You can tune the numbers there.
- **Capital One Nessie:** in **Savings → Capital One Nessie**, paste your Nessie API key and click **Connect**. The app creates a Nessie customer with a checking account and a savings account. Each walk then sends a **transfer from checking to savings**, and the trip list shows **✓ Nessie** next to synced walks.
- **Without a key, or if Nessie is down,** savings are kept in the app (demo mode) and the trip shows **local**.

> ⚠️ **The Nessie calls in `js/nessie.js` are untested.** Nessie was resetting every connection while this was built. They follow Nessie's documented endpoints, but confirm them with the Capital One team. If the browser blocks the requests (CORS), the mobile app won't have that problem.
>
> The key is stored in the browser for this demo only, since Nessie is a sandbox of fake data. A real banking app must keep keys on a server.

### AR-style capture

You can capture a landmark when you're within 50 m of one Pip found. The web version shows a live camera viewfinder with your agent bobbing in the frame. It then combines the photo, the agent and the place name into a postcard and saves it to your album. Without a camera, such as on a desktop, it uses the landmark's Wikipedia photo instead.

This isn't true AR yet: the agent is drawn on top of the camera feed, not placed in 3D space. Real AR needs a native app (see [docs/mobile-migration.md](../docs/mobile-migration.md)).

## Code layout (ready for mobile)

The game logic is plain JavaScript with no browser-specific code, so it can be copied straight into a React Native / Expo app. Only the screen and device code gets rewritten.

| Moves to mobile as-is (pure logic) | Rewritten for mobile (screens and device) |
|---|---|
| `js/agents.js`: agents and memos | `js/app.js`, `js/views.js`, `index.html`, `styles.css`: the screens |
| `js/rank.js`: points, ranks and trail unlocks |
| `js/savings.js`: fare estimates and tree stages |
| `js/nessie.js`: Capital One Nessie client (`fetch`) | `js/map.js`: Mapbox GL JS, replaced by `react-native-maps` |
| `js/leaderboard.js`: leaderboard building | `js/capture.js`: the camera, replaced by `expo-camera` or AR |
| `js/geo.js`: distances and math | `js/storage.js`: localStorage, replaced by AsyncStorage |
| `js/config.js`: settings | `js/voice.js`: browser speech, replaced by the Grok Voice API |
| `js/services.js`: API calls (`fetch` works in React Native) | |

## Placeholders to replace with Grok (required for the track)

| Placeholder | File | Replace with |
|---|---|---|
| Browser speech (`speechSynthesis`) | `js/voice.js` | **Grok Voice API** |
| Illustrated SVG postcard | `js/art.js` (`postcardSvg`) | **Grok Imagine** illustration |
| Template memo text | `js/agents.js` | Grok chat with tool calls, for agent personality |

Call Grok from a small backend that holds the API key. Never put the key in browser code.

## Data sources

- Places and facts: Wikipedia geosearch and the page summary API
- Walking routes: routing.openstreetmap.de (OSRM foot profile). If it's unavailable, the app falls back to a straight line.
- Your region, for leaderboards: OpenStreetMap Nominatim, called once per session
- Banking: Capital One Nessie (mock data), when connected
- Map: Mapbox GL JS with the Mapbox Standard style (needs a public access token)
