# How we split the work

We're down to **one product: the phone app** (`mobile/`). The web app is gone. The shared game logic lives in [`core/`](core/), and the server is only an API.

We split **by layer**: one person builds what the app *does*, the other builds what it *looks like* and how we *present* it.

**Deadline: Sunday Oct 4, 8:30 AM on Devpost.** Feature freeze Sunday around 5 AM.

| Branch | Owner | Focus |
|---|---|---|
| `backend` | _(name)_ | Server, game logic and state: every feature works, even if it looks plain |
| `presentation` | _(name)_ | Screens, styling, animation, and the pitch: demo video, screenshots, Devpost |

## Who owns which files

| `backend` owns | `presentation` owns |
|---|---|
| `server/`, `render.yaml` | `mobile/src/components/` (every screen and modal) |
| `core/` (then `npm run sync-core`) | `mobile/src/theme.js`, `mobile/assets/` |
| `mobile/src/game/` (state, store, actions, walking) | Layout and styles in `mobile/App.js` |
| `mobile/src/api.js` (new), `mobile/src/voice.js`, `mobile/src/storage.js` | `docs/DEMO.md`, `docs/screenshots/`, the pitch deck, Devpost text |
| `imessage-agent/` | The README's "TODO" sections (screenshots, Cursor section) |

**How a feature moves between us:**

1. **`backend`** adds the state and actions, plus a *plain, unstyled* component that proves it works. Merges to `main`.
2. **`presentation`** takes over that component file and makes it look good. Merges to `main`.
3. Once a component is handed over, `backend` doesn't edit its file. Ask in chat instead.

Do it **one feature at a time** (order below). If we run out of time, everything we have looks finished.

## The agreement: what each screen gets

The presentation side codes against this list from the start, using **fake data** until the real thing lands. These names are a proposal; settle them in the first 15 minutes, then change them only by telling each other.

| Screen | Reads from `state` | Calls on `game` | Order |
|---|---|---|---|
| **Pets tab** | `pets` (`[{ id, name, rarity, petClass, color, basePower, art }]`), `egg` (`{ startWalked }` or `null`), `progress.walked`, `progress.steps` | `game.hatchEgg()`, `game.setActivePet(id)` | 1 |
| **Hatch reveal** (modal) | `hatching` (the new pet, or `null`) | `game.closeHatch()` | 1 |
| **Turf** (on the map + a panel) | `turf` (`[{ landmarkId, title, lat, lon, ownerName, pet, heldSince }]`), `capturable` | `game.claimTurf(landmarkId)` | 2 |
| **Leaderboards** (in Ranks) | `leaderboard` (`{ scope, rows: [{ name, score, isYou }] }`), `scope` | `game.set({ scope })` | 3 |
| **Grok art** (postcards, pet portraits) | `discovery.image`, `pet.art` (image URL or `null`, use SVG art from `core/art.js` when it's `null`) | none | 4 |

Already working, so `presentation` can polish these right away: the map (`TrailMap`), squad (`AgentList`), ranks, savings, album, postcard and capture.

Use the helpers in `core/pets.js` for display numbers: `eggProgress`, `metersToHatch`, `petLevel`, `petPower`, `rarityOf`, `colorOf`.

## `backend` checklist

1. **Deploy first** (Render → New → Blueprint, enter `XAI_API_KEY`). Post the `https://…onrender.com` URL in the group chat.
2. **Test Grok live:** `/api/health` should say `"grok":true`. Try voice and Imagine with the real key.
3. **`mobile/src/api.js`:** one small client for `/api/*`. Base URL from `EXPO_PUBLIC_API_URL`, no keys in the app, and return `null` when the server can't be reached so screens fall back to sample data.
4. **Features in order:** pets and eggs → turf → live leaderboards → Grok voice and art. Each one: state + actions + plain component, then merge.
5. **Android map** (Google Maps issues; see AGENTS.md). Stop after about 30 minutes. We demo on the iPhone.
6. If there's time: Supabase, Photon keys for `imessage-agent/`.

## `presentation` checklist

1. **Polish what already works:** map, squad, ranks, savings, album, postcard and capture screens. Settle colors and type in `theme.js`.
2. **Build the Pets tab and hatch reveal on fake data** right away, following the agreement above. Swap in real state when `backend` merges it.
3. **Style each feature** as `backend` hands it over: turf, leaderboards, Grok art.
4. **The pitch:** draft the demo script in [docs/DEMO.md](docs/DEMO.md), take screenshots as screens get finished, write Devpost and the deck, and record the **backup video** at the freeze.

## Shared files: talk first

- `mobile/App.js`: `backend` adds a new tab or modal (one line each); `presentation` owns its layout and styles. Say "I'm editing App.js" in chat first.
- `README.md`, `PLAN.md`
- `CURSOR_LOG.md`: both of us log key Cursor prompts here (SpaceX track). Only add to the end.

## Git workflow

```bash
git checkout backend              # or: git checkout presentation
git pull                          # your branch's latest
git merge main                    # pick up the other person's merged work

# ...work, commit small and often...

git push
```

Every **1–2 hours** (or whenever a feature step is done), merge into `main`:

```bash
git checkout main
git pull
git merge backend                 # or presentation
# run the checks below, then:
git push
git checkout backend              # back to your branch
```

**Checks before merging to `main`:**

| You changed | Run |
|---|---|
| `core/` | `npm test` in `core/`, then `npm run sync-core` in `mobile/` |
| `server/` | `npm test` in `server/` |
| `mobile/` | `npx expo lint` in `mobile/`, and open the app on a phone |
| `imessage-agent/` | `npm test` in `imessage-agent/` |

`main` must always run. That's what we demo from.

## Checkpoints

| When | Goal |
|---|---|
| **Saturday evening** | Server deployed with Grok on. The agreement settled. Existing screens polished. |
| **Around 11 PM** | Pets and hatch reveal working *and* styled, merged into `main` |
| **Around 3 AM** | Turf and leaderboards done the same way |
| **Sunday ~5 AM** | **Feature freeze.** Grok art if it's in. Record the backup video, final screenshots, Devpost |
| **Sunday 8:30 AM** | Submitted |
