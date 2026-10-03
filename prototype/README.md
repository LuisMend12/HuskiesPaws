# Wanderlings prototype

A quick concept demo of [Wanderlings](../docs/ideas/12-wanderlings.tex): a walking game where AI agent companions scout real places for you.

> **This is a throwaway prototype, not the submission.** The Cursor track requires the project to be built with Cursor. Use this to test the idea, then build the real version in Cursor.

## How to run it

### What you need

- **Python 3**, just to run a small local web server. Check with `python --version`.
  - On Mac, use `python3` instead of `python` in the commands below.
- An internet connection. The app loads map tiles and Wikipedia data live.
- A modern browser such as Chrome, Edge, Firefox or Safari.

No API keys, no `npm install` and no build step.

### Steps

1. **Open a terminal in the `prototype` folder.**

   ```bash
   cd big-red-hacks2026/prototype
   ```

2. **Start the local server.**

   ```bash
   python -m http.server 8765
   ```

   You should see `Serving HTTP on :: port 8765`. Leave this terminal open.

3. **Open the app** at **http://localhost:8765**.

4. **Stop the server** when you're done by pressing `Ctrl+C` in the terminal.

> **Why not just double-click `index.html`?** The app uses JavaScript modules, and browsers block those on `file://` pages. It has to be served over `http://`.

### Try the demo

1. Click **Explore**. Pip goes on an expedition and returns with a postcard and a spoken memo. Turn your volume up.
2. On the postcard, click **Take me there**. Fern plans a walking route and walks you there, and flowers bloom along your trail.
3. Click **Tell a story**. Moss reads the history of the nearest landmark.
4. Click **Demo walk** to take a quick walk somewhere new, then click **Explore** again from there.
5. Optional: click **Use my location** to make your real walk bloom (see the phone notes below).

The map starts at the Physical Sciences Building at Cornell. To start somewhere else, change `DEFAULT_CENTER` in `js/config.js`.

### Running it on your phone

Phone browsers only share location over **HTTPS** or on **localhost**. Opening `http://<your-laptop-ip>:8765` from a phone loads the app, but **Use my location** won't work there. Everything else will. For real GPS walking on a phone, either:

- deploy the folder to any static host with HTTPS (GitHub Pages, Netlify or Vercel), or
- use a tunnel such as `npx localtunnel --port 8765` or `ngrok http 8765`, which gives you an HTTPS link.

### Troubleshooting

| Problem | Fix |
|---|---|
| `python: command not found` | Try `python3` or `py`. Otherwise, install Python 3. |
| `Address already in use` | Port 8765 is taken. Use another port, such as `python -m http.server 8800`, and open that port. |
| The page is blank or buttons don't work | Make sure you opened `http://localhost:...` and not the file directly. Check the browser console (F12) for errors. |
| The map is gray and has no tiles | No internet connection, or map tiles are blocked on this network. |
| "Pip got lost (network problem)" | Wikipedia didn't respond. Wait a moment and try again. |
| The route is a straight line | The walking-route server was unavailable, so the app fell back to a straight line. It's still usable. |
| No sound | Unmute the tab. Some browsers only speak after you've clicked something on the page. |

## What works

- **Pip (Scout):** finds a nearby place you haven't visited, using Wikipedia's geo search. Pip "travels" there (the timer scales with distance), then returns with a postcard, the place's real photo and facts, and a spoken memo.
- **Moss (Storyteller):** reads the history of the nearest landmark aloud.
- **Fern (Pathfinder):** plans a real walking route to Pip's discovery and walks you there. Your trail blooms with flowers along the way.
- **Demo walk:** a sped-up walk, for showing the app indoors.
- **Use my location:** live GPS, so your real walk blooms. It needs HTTPS or localhost.
- Agents level up and get a flower hat at level 2.

Agents only say facts returned by their tools (Wikipedia and routing data), and every postcard links to its source.

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
- Map tiles: OpenStreetMap
