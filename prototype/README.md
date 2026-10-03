# Wanderlings prototype

A quick concept demo of [Wanderlings](../docs/ideas/12-wanderlings.tex): a walking game where AI agent companions scout real places for you.

> **This is a throwaway prototype, not the submission.** The Cursor track requires the project to be built with Cursor. Use this to test the idea, then build the real version in Cursor.

## Run it

ES modules don't load from `file://`, so serve the folder:

```bash
cd prototype
python -m http.server 8765
# open http://localhost:8765
```

No API keys needed.

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
