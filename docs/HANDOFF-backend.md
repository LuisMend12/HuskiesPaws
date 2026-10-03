# Handoff: presentation → backend (updated Sat Oct 3, ~4:45 PM)

**For:** Luis and his coding agent, working on the `backend` branch. Read [SPLIT.md](../SPLIT.md) and [AGENTS.md](../AGENTS.md) first; this file adds what changed and what the screens now expect.

## 1. Get up to date (do this first)

```bash
git checkout backend
git pull
git merge main            # brings in everything below
cd mobile && npm install  # REQUIRED: new packages (Nunito font, splash screen, cloudflared,
                          # three + @react-three/fiber + expo-gl/expo-asset/expo-file-system)
npx expo start --clear    # once, to drop Metro's old cache
```

- **`npm run tunnel` changed.** Expo's built-in ngrok tunnel is broken: it fails with `Cannot read properties of undefined (reading 'body')` because Expo's shared ngrok account is full (`ERR_NGROK_108`). `npm run tunnel` now runs [`mobile/scripts/tunnel.mjs`](../mobile/scripts/tunnel.mjs), a free Cloudflare quick tunnel. Scan the new QR code each time; the address changes per run.
- After pulling, the app has:
  - a new look (logo colors, Nunito, floating map controls, pop-up status messages)
  - rank **leagues** with wood-and-grass badges
  - a **Pets** tab and **hatch reveal**, on sample data until 4.1 lands
  - a **Squad** tab (replaces `AgentList`): squad pets with statuses and class actions; Pip, Moss and Fern show as starter pets
  - a **tilted map** with pets standing on it: the squad follows you, the exploring pet **walks to its place and back**, guards stand on landmarks with HP bars (three **sample rival guards** near PSB until 4.3 lands)
  - **landmarks** as food (dog-food bag, tuna can or treat jar) on rings (grey free, green yours, coral rival); tap one (or pick it from **Landmarks nearby** at the bottom of the Squad tab) for the 3D landmark screen, with an AR toggle: claim it, or challenge the guard in a head-bashing battle with HP bars
  - **postcards** drawn with the pet who found the place (or the Grok picture), and your squad pet in the **capture** frame instead of the old blob creature
  - a **🐾 3D** button on the map: your squad walks around in 3D over the camera (React Three Fiber). It loads three.js only when opened; `mobile/src/components/threePolyfill.js` must stay the first import in `Pet3D.js` and `SquadView.js` (three 0.186 crashes on React Native without it)
- **How sample data switches off:** every screen reads through `petsView(state)` in `mobile/src/components/fakeData.js`. When `state.pets`, `state.egg`, `state.squad` or `state.turf` is defined (even `[]` / `null`), the real value is used instead of the sample.

## 2. What presentation changed in backend-owned files

| File | Change | Why |
|---|---|---|
| `core/rank.js` | `RANKS` is now **5 leagues × 3 divisions**: Bronze III → Crystal I (thresholds 0, 100, 200 / 300, 450, 600 / 800, 1100, 1400 / 1800, 2300, 2800 / 3500, 4200, 5000 XP). New exports `LEAGUES`, `leagueOf`. Each rank has `id`, `name`, `emoji`, `league`, `division` (3 = III … 1 = I), `min`, `trail`. One trail per league, so `TRAILS.length === 5`. | Agreed with Abdullah: Clash of Clans-style leagues |
| `core/test/core.test.js` | Rank assertions updated; egg-tier test added | Matches the leagues and egg tiers |
| `core/pets.js` | `PET_SPECIES`, `EGG_TIERS`, `rollEggTier`, `eggTierOf`, `hatchMetersOf`; `maybeNewEgg` adds `tier`; `hatchEgg` uses tier odds and adds `species` | Agreed with Abdullah: rarer long eggs, more animals |
| `mobile/src/core/rank.js` | Re-synced (`npm run sync-core`) | Generated copy |
| `mobile/src/game/game.js`, `state.js` | `runExpedition` sets `expedition: { agentId, from, to: { lat, lon }, startedAt, durationMs }` while a pet is out, and clears it in `finally` (new `expedition: null` in `INITIAL_STATE`) | The map walks the exploring pet to the place and back. If you rework expeditions as `game.runPet`, keep setting `expedition` |
| `mobile/src/game/game.js` | The "heading toward" status adds "back in about N s"; `discovery` also stores `agentName`. The Squad tab runs agents as `runAgent({ ...agent, name: pet.name })` so messages use the pet's name | Return time; your Scout might be Nova, not Pip. `game.runPet` should do the same |
| `mobile/src/game/game.js` | `checkRankUp`: only a league change (`rank.division === 3`) says "League up! New trail unlocked"; division changes say "Rank up!" | The old message claimed a new trail on every rank-up |

Please pull before editing these.

## 3. Don't edit these (presentation owns them)

`mobile/src/components/**`, `mobile/src/theme.js`, and the layout and styles in `mobile/App.js`. If you need a new tab or modal in `App.js`, ask in chat; presentation adds the line. **`TrailMap.js` included:** presentation is about to add pets on the map there, and will also add `tracksViewChanges={false}` to the flower markers (likely part of the Android map slowness). Send findings from your Android map work instead of editing it.

## 4. Tasks, in priority order

### 4.1 Pets and eggs (the screens are waiting on this)

The Pets tab, Squad tab, map and hatch modal already read these through `petsView()` in `mobile/src/components/fakeData.js`. While `state.pets` is `undefined` they show sample data; as soon as it exists (even `[]`), the real data shows.

**Changed since the first version of this file (agreed with Abdullah):**
- **Several eggs at once** (`eggs` list) instead of one `egg`. The Pets tab lists every egg with its own progress bar.
- **No "active pet".** You tap pets in the Pets tab to put them in or take them out of your **squad** (`squad`, see 4.4). Drop `activePetId` / `setActivePet`.
- **Species:** pets aren't all huskies. Add `species` to each pet.

**Add to `INITIAL_STATE` / `SAVED_DEFAULTS` in `mobile/src/game/state.js`:**

```js
pets: [],           // saved. [{ id, name, species, rarity, petClass, color, basePower, hatchedAtWalked, spaceBorn, art }]
                    //   what core/pets.js hatchEgg() returns, plus species; art = FULL image URL or null
eggs: [],           // saved. [{ id, startWalked, tier }] eggs you carry (from maybeNewEgg); all fill up as you walk
eggsReceived: 0,    // saved. eggs handed out so far
squad: [],          // saved. see 4.4
hatching: null,     // NOT saved. the pet that just hatched; while set, the hatch animation shows
issOverhead: false, // NOT saved. true while the ISS is overhead (shows a banner)
```

Also add `pets`, `eggs`, `eggsReceived` and `squad` to `RESETTABLE_KEYS` (and give back the starter pets after a reset, see 4.4).

**`core/pets.js` (already done by presentation, tested):**
- `PET_SPECIES` (husky, shiba, cat, bunny, fox, bear); `hatchEgg()` now sets `species`. Starter pets are huskies.
- **Egg tiers** `EGG_TIERS`: Meadow egg 300 m (60% of eggs), Forest egg 600 m (30%), Crystal egg 1 km (10%); longer eggs use better rarity odds (Crystal: 12% legendary). `maybeNewEgg()` gives a `tier`, `hatchEgg()` uses the tier's odds, `hatchMetersOf(egg)` / `eggProgress` / `metersToHatch` use the tier's distance. Eggs without a tier work as before.
- **Still yours:** carry up to **5** eggs and let **every carried egg fill up at once** as you walk (`maybeNewEgg` still checks for a single `egg`; give it the list).

**Add to the object `createGame()` returns (`mobile/src/game/game.js`):**

| Action | Does |
|---|---|
| `game.setSquad(ids)` | sets `squad` (the screens already enforce the size), persists |
| `game.closeHatch()` | sets `hatching: null` |

The screens call these when they exist and fall back to `game.set(...)` until then.

**Logic** (port from the web version in git history: `git show bfe74e7^:prototype/js/pets-ui.js`, function `tick`):
- After walking (`walking.stepTo`, or after `walkAlong` finishes), call a `tickPets()`:
  - For the first egg with `eggProgress(egg, walked) >= 1`: `hatchEgg(egg, walked, Math.random, { issOverhead })`, prepend to `pets`, remove the egg, set `hatching: pet`, add it to `squad` if there's a free slot, persist, speak "Your egg hatched! Meet …". One hatch at a time: skip while `hatching` is set.
  - Then hand out a new egg if earned and fewer than 5 are carried: `eggsReceived + 1`, status "🥚 You found an egg!".
- ISS: `getIssPosition()` from `core/services.js` every 60 s; `issOverhead = issIsOverhead(iss, position, distanceMeters)`.
- **Never** let Nessie money buy eggs (see PLAN.md: it would look like gambling).

**Grok portraits:** after hatching, ask the server for a portrait and set `pet.art` to the **absolute** URL (`${EXPO_PUBLIC_API_URL}/images/x.png`). The screens show the image as is. Please update `petPrompt` in `server/src/grok.js` to match the in-app look: *"a chunky rounded-cube {species} in the style of a Roblox simulator pet, big glossy ice-blue eyes, {color} fur, {class accessory}, soft studio lighting, plain light background"*. Accessories: Scout = leaf sprout on the head, Storyteller = red scarf, Pathfinder = explorer hat, Guardian = small shield. Add `species` to the `/api/imagine` pet request and its validation.

### 4.2 XP rules (agreed with Abdullah)

- **XP comes from walking** (10 steps = 1 XP) **plus a bonus per camera capture** (keep `landmarkCaptured` points).
- **Remove the XP for Pip finding a landmark** (`landmarkFound` points → 0). Keep counting `landmarksFound`; it just stops giving XP.
- **Turf boost:** walking XP is multiplied by **1 + 0.1 × landmarks you currently hold** (max 1.3× with the cap of 3). It applies only to XP earned *while* holding, so it can't be computed from total steps afterwards. Suggestion: accumulate walking XP as steps arrive (`progress.walkXp += addedSteps / 10 * xpBoost`) and have `scoreFor` use it.
- Expose **`xpBoost`** in state (e.g. `1.2`); presentation shows it next to the XP pill.
- The leaderboard uses the same score.

### 4.3 Turf (claim → hold → HP)

Server (`server/src/turf.js`, `routes.js`, `validate.js`, both stores):
- **Replace `heldXp` / `XP_PER_HOUR_HELD`** with **pet HP**: a guard starts at `maxHp`, loses HP over time, and refills when its owner walks back to the landmark (claims it again within `CAPTURE_RADIUS_M`). Compute HP when read (no timers or background jobs). At 0 HP the landmark is free and the boost ends. A stronger pet capturing it also ends the boost.
- Return `hp` and `maxHp` per turf entry.
- **Store and return `pet.color`, `pet.species` and `pet.spaceBorn`** (validate `color` against `PET_COLORS`, `species` against `PET_SPECIES`). Presentation draws each guard pet on the map and needs them.

App state:

```js
turf: [{ landmarkId, title, lat, lon, ownerName, mine, claimedAt, hp, maxHp,
         pet: { id, name, species, rarity, petClass, color, spaceBorn, power, art } }],
xpBoost: 1,         // 1 + 0.1 × turf.filter((t) => t.mine).length
```

**The landmark screen is built** (`mobile/src/components/LandmarkView.js`, opened by tapping a food bag on the map or a row in the Squad tab's "Landmarks nearby"; the open one is `state.landmarkOpen`, a UI-only field you don't need to save): it picks a squad pet, plays a head-bashing battle when it's a challenge, and shows the result. It calls **`await game.claimTurf(landmarkId, petId)` and needs it to return `{ result, won, message }`** (`result` is the server's `claimed` / `reinforced` / `captured` / `defended` / `capped`; `won` true when you hold the landmark afterwards). Until `claimTurf` exists it applies the same rules on the phone (`landmarks.js` `claimLocally`) and writes `state.turf` locally (not saved); your real `turf` replaces that. Fights need you within 150 m, except in demo mode.

Action: `game.claimTurf(landmarkId, petId)` (a squad pet chooses to guard, with `petPower(pet, walked)`; it becomes `"defending"`; set `status` to the server's message). Ship a plain component that proves it works; presentation will restyle it.

**Agreed after play-testing (Abdullah):**
- **Range:** claiming or fighting needs you **within 150 m, also in demo mode**. Out of range, the landmark screen shows **🚶 Walk there**: it calls `game.walkTo(place)` if it exists, else it borrows `guideToDiscovery` (sets `discovery` to the landmark and calls it); in demo mode the walk is simulated and the screen reopens. Please add `game.walkTo({ id, title, lat, lon })` (a guided walk to any place, without a postcard).
- **HP after fights stays and heals slowly:** 10 HP per minute, for pets and guards. A pet that loses drops to 0 and is **resting** until it's back to 50 HP; a pet that wins starts guarding with the HP it had left. **Decay** still applies to guards, as a falling *maximum*: `maxHp = 100 - 10 × hours since the owner last visited`, so an unvisited guard heals up to a lower ceiling each hour and leaves at 0.
  - State the screens read: `petHp: { [petId]: { hp, hpAt } }` (pets not at full HP; `hpAt` = ms timestamp), and `hp`, `maxHp`, `hpAt` on each turf entry. The app works out current HP as `min(maxHp, hp + minutes since hpAt × 10)` (`hpNow` in `mobile/src/components/landmarks.js`).
- **Recall:** taking a guarding pet out of the squad (Pets tab) calls it back and frees its landmark. Please add `game.recallGuard(petId)`; until then the app does it locally (`recallLocally`).
- **XP boost shown:** the rank pill shows `×1.2 XP` from `state.xpBoost` (or `1 + 0.1 × landmarks you hold`).
- **Foods:** each landmark shows a dog-food bag, a tuna can or a jar of treats, picked from its id on the phone. Nothing to store.

### 4.4 Squad, statuses and starter pets (agreed with Abdullah)

**Pip, Moss and Fern become your 3 starter pets:** common pets every new player starts with (and gets back after a progress reset), instead of a separate agent system. Suggested: add `STARTER_PETS` to `core/pets.js`:

| Name | Class | Color | Rarity | basePower |
|---|---|---|---|---|
| Pip | Scout | cinnamon | common | 12 |
| Moss | Storyteller | midnight | common | 12 |
| Fern | Pathfinder | mint | common | 12 |

Each pet's class decides its action: Scout = Explore (today's `runExpedition`), Storyteller = Tell a story, Pathfinder = Guide me, Guardian = no action (defends better). Keep `AGENTS` for their voices (`voice`, `grokVoice`) and memo text, looked up by class.

**Squad size:** 3 slots, 4 at Gold, 5 at Crystal (`rank.league`). Eggs add pets to your collection; you choose who's in the squad.

**Statuses** (one per pet):

| `status` | Meaning | Rules |
|---|---|---|
| `"with-you"` | Follows you | Only squad pets that are with you gain levels from walking |
| `"exploring"` | On an expedition | Busy until it returns |
| `"defending"` | Guarding a landmark | **Still uses its squad slot** (the balance lever: more landmarks = bigger XP boost but fewer pets with you) |
| `"resting"` | Lost its landmark or hit 0 HP | Must walk 200 m with you before it can defend again |

**Class perks:** Scout expeditions 30% shorter; Storyteller +50% story XP; Pathfinder +0.05× walking XP while with you; Guardian 1.5× max HP.

**HP:** `maxHp` 100 (Guardian 150), −10 HP per hour, refilled by visiting. An unvisited landmark falls after ~10 h (Guardian ~15 h).

**State the screens read:**

```js
squad: ["pet-…", "pet-…", "pet-…"], // saved. pet ids in the squad, in order
// each pet in `pets` also gets:
status: "with-you",                  // "with-you" | "exploring" | "defending" | "resting"
restMeters: 0,                       // while resting: meters still to walk
squadSize: 3,                        // derived from the league
```

Actions: `game.setSquad(ids)` (the Pets tab is the picker), `game.runPet(petId)` (the class action). Until these exist, the screens use the first 3 pets as the squad and treat every pet as `"with-you"`.

### 4.5 Grok postcards

When Pip (or any Scout) finds a place, ask `/api/imagine` for a postcard and set **`discovery.image`** to the **absolute** URL. `PostcardModal` shows it in place of the drawn scene; until then it draws the place with the finder pet. The finder is matched by `discovery.agentName` (already set in `runExpedition`), so keep setting it to the pet's name in `runPet`.

### 4.6 Live leaderboards

`state.leaderboard = { scope, rows: [{ position, name, score, isYou }] }` from `/api/leaderboard`. When it's `null` (offline), presentation keeps using `core/leaderboard.js` sample rows. Tell presentation when it lands; `RanksPanel.js` switches over then.

### 4.7 `mobile/src/api.js`

Base URL from `EXPO_PUBLIC_API_URL`, no keys in the app, return `null` on any network failure so screens fall back to sample data.

## 5. Before merging into `main`

| You changed | Run |
|---|---|
| `core/` | `npm test` in `core/`, then `npm run sync-core` in `mobile/`, and `npm test` in `imessage-agent/` |
| `server/` | `npm test` in `server/` |
| `mobile/` | `npx expo lint` and `npx expo export --platform ios --platform android` in `mobile/`, then open it on a phone with `npm run tunnel` |

Post in chat when a piece lands (pets state, turf state, leaderboard), so presentation can switch that screen to real data.
