# Wanderlings: ideas and plan

This file groups every idea from the brainstorms and the repo docs, adds the new **Eggs, Pets and Turf** idea, and sets a scope for the deadline (**Sunday 8:30 AM**).

**Status key:** **Built** means it works in the [prototype](prototype/). **Idea** means it's only in the docs. **New** means it's from the latest brainstorm.

## 1. New idea: Eggs, Pets and Turf

### How the loop works

1. **Walk** to earn steps and rank, as the prototype already does.
2. **Eggs:** an egg unlocks at walking milestones, and walking a set distance hatches it, like Pokémon GO eggs. The reveal shows the pet's rarity, like Roblox eggs: common, rare, epic, legendary.
3. **Pets** have a rarity and a power level, and they level up as you walk with them.
4. **Capture:** walk to a landmark and claim it with a pet. This builds on the camera capture that already exists.
5. **Hold:** the pet stays behind as the landmark's defender, and its owner earns bonus XP for every hour they keep it.
6. **Challenge (king of the hill):** another player who walks there can take the landmark if their pet is stronger.

### Design decisions

| Question | Proposal |
|---|---|
| How does a challenge work? | Your pet's power must beat the defender's. You must physically be within about 50 m (`CAPTURE_RADIUS_M`), so walking stays the core. |
| How do we stop one player holding everything? | **Decay:** a defender gets weaker over time unless its owner walks back to visit it. Also **cap** how many landmarks one player can hold, for example 3. |
| How is the XP boost calculated? | Hours held × rate, worked out whenever someone looks. No timers or background jobs. |

### Opinion

**Strengths**

- **It gives people a reason to walk to specific places again and again.** This is the strongest navigation hook so far.
- **It's very good for People's Choice.** If hackers fight over landmarks around PSB and Klarman on Saturday, they become players, and then voters.
- **Merge pets and agents into one thing.** The Wanderlings themselves hatch from eggs. Pip, Moss and Fern become classes (Scout, Storyteller, Pathfinder), plus a new **Guardian** class for defending. One creature system is simpler to build and easier to pitch.
- **Grok Imagine can draw each pet when it hatches,** so every player's pet is one of a kind. That's a core, non-gimmick use of the API the SpaceX track requires.

**Risks**

- **Scope:** this is basically Pokémon GO gyms. A full multiplayer version won't fit by Sunday, so we build a simplified one (see section 3).
- **It needs a real backend.** Turf only works if it's shared between players. The leaderboards are still sample data.
- **The Nessie savings must not buy eggs.** Loot boxes paid with banking money look like gambling, especially with Capital One judging. Eggs are earned only by walking.
- **Keep the pitch about navigation.** Present the turf map as "who explored where", not as a battle game, so the theme judges stay on board.

## 2. Every idea, grouped

### A. Wanderlings: the lead candidate

| Layer | Feature | Status |
|---|---|---|
| **Core loop** | Walk and bloom a flower trail | Built |
| | Agents: Pip explores, Moss tells stories, Fern guides | Built |
| | Postcards, walking routes, demo walk | Built |
| **Progression** | Ranks and points | Built |
| | Trails unlocked by rank | Built |
| | Eggs → pets, with rarity | Built: Pets tab, hatch reveal, Grok Imagine portraits |
| | Agents change based on the places you visit | Idea |
| | Daily quests and daily routes, rare seeds | Idea |
| | Fog of war over places you haven't been | Idea |
| **Territory and social** | Camera capture into an album | Built (camera view with a frame, not true AR) |
| | Capture and hold a landmark, with an XP boost | Built: simple turf (claim, power check, cap of 3, XP per hour held) |
| | Local, statewide and national leaderboards | Built and live through `server/` (sample data only without the server) |
| | Shared campus garden showing everyone's flowers | Idea |
| | Friends' agents meet when you walk near each other | Idea |
| **Impact** | Tag stairs, ramps and broken elevators | Idea |
| | Forager agent: finds water, food and benches | Idea |
| **Sponsor tracks** | Savings tree with Nessie (Capital One) | Built (Nessie calls untested) |
| | Agents text you in iMessage (Photon) | Built in [`imessage-agent/`](imessage-agent/) and tested in the terminal. Needs Photon keys. |
| | Desk garden on a SenseCAP or Raspberry Pi (Hardware) | Idea |
| **Grok (required)** | Voice memos, Imagine postcards and pet art, Grok chat for agents | Voice and Imagine built in `server/`. **Needs an `XAI_API_KEY`;** tested only against a fake xAI service. Grok chat not done. |

More detail: [docs/ideas/12-wanderlings.tex](docs/ideas/12-wanderlings.tex), [docs/opening-ceremony-notes.md](docs/opening-ceremony-notes.md) and [docs/mobile-migration.md](docs/mobile-migration.md).

### B. Other projects, kept as backups

| Group | Ideas | Take |
|---|---|---|
| **Space** (SpaceX track) | SkyPilot, Rover Route, OrbitWatch, Voyage Planner, StarFix, Launch Lens | Best fit for SpaceX's "real space data", but we'd start from zero. |
| **Walking and accessibility** | GuideVoice, Campus Wayfinder, HillSmart, AccessiMap, Haptic wearable | Strong on impact and theme. These overlap with Wanderlings' accessibility layer. |
| **Sponsor-focused** | Money GPS (Capital One), Meet in the Middle (Photon) | Easy cash tracks to add, but less memorable. |
| **Something different** | Learning Path GPS, PictureRoute, VoiceRover | Learning Path GPS is the most original, and it ties into Kleinberg's research. |

Full write-ups are in the [README](README.md), [docs/ideas/](docs/ideas/) and [docs/opening-ceremony-notes.md](docs/opening-ceremony-notes.md).

**Recommendation:** with about a day left and a working prototype, **commit to Wanderlings.** Everything else is a backup only.

## 3. Scope by Sunday 8:30 AM

| Priority | What | Why |
|---|---|---|
| **Must** | ✅ **Hook up Grok Voice and Grok Imagine** through a backend | Built in [`server/`](server/). Add `XAI_API_KEY` to `.env` to turn it on. |
| **Must** | ⏳ Backend (Supabase) and an HTTPS deploy | Backend built (file storage, or Supabase via [schema.sql](server/supabase/schema.sql), untested). Deploy is ready: [render.yaml](render.yaml), steps in [server/README.md](server/README.md). **Someone needs to create the Render service.** |
| **Must** | ⏳ A tested demo path and a backup video | Script and checklist in [docs/DEMO.md](docs/DEMO.md). The loop is tested in a browser. **Record the backup video Saturday night.** |
| **Should** | ✅ Eggs → pets: hatch by distance, with Imagine pet art | Built in the web app (not yet in the phone app) |
| **Should** | ✅ Simple turf: claim with a pet, power comparison, XP for hours held | Built (web app + server) |
| **Could** | Defender decay, a campus turf map, fog of war | Polish if there's time |
| **Could** | Enter the Photon track: add Photon keys to `imessage-agent/` and run it | Already built, so it's cheap. See [imessage-agent/README.md](imessage-agent/README.md). |
| **Won't (this weekend)** | Real AR, background tracking, hardware | Too risky for the time left |

**✅ Optional idea for the SpaceX judges (built):** while the **ISS is overhead** (live position and visibility footprint from wheretheiss.at), eggs that hatch are 3x as likely to be rare, and the pet is marked 🛰️ space-born.

> **Cursor reminder:** the prototype was built outside Cursor. Build the real project in Cursor from here on, with a `.cursor/rules/` file and a `CURSOR_LOG.md`, so it qualifies for the track.
