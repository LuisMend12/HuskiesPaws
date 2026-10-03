# Big Red Hacks 2026

Our project repo for [Big Red Hacks](https://bigredhacks2026.devpost.com/) 2026, Cornell's annual hackathon.

> **Status:** Brainstorming. **Target: SpaceX track (built with Cursor).** Score the ideas below and pick one by Saturday morning.

## Key facts from the opening ceremony

- **Theme: Navigation.** *"What do we build next to change how we navigate in the next 100 years?"*
- **Deadline: Sunday 8:30 AM** on [Devpost](https://bigredhacks2026.devpost.com/). Judging starts at 9:00 AM. Finalist demos are at 11:30 AM in Baker 200.
- **Team registration:** Friday by 11:59 PM.
- **Don't miss:** the SpaceX Cursor Workshop, **Friday 9:30 PM, GSH 132**. Workshops also earn raffle tickets.
- **Help:** use `#technical-inquiries` on Discord or find an organizer (black "STAFF" shirt).

## Our target: SpaceX track, "Make it Legendary"

> Real space data goes in and a legendary project comes out.

| Requirement | What it means for us |
|---|---|
| **Built with Cursor** (required) | Write the whole project in Cursor. *"The more you use Cursor, the more likely you are to win."* |
| **Grok Imagine or Grok Voice API** (required) | At least one must be a core feature, not a gimmick. |
| **Real space data** | Use public datasets: NASA, JPL, CelesTrak, star catalogs, and so on. |
| Grok Bot for planning (bonus) | Use Grok Bot for task planning and team coordination, and take screenshots. |
| **Prize** | A Cursor mechanical keyboard for every member of the winning team. Every entrant goes into a raffle for a Cursor Owala water bottle. |

**Stack prizes:** A space project that fits the **Navigation** theme can also compete for the **Big Red Track** (best fit to the theme). Depending on what we build, it can also enter **Software**, **Design** (best UI/UX) and **People's Choice**.

### Showing judges we used Cursor heavily

- Use **Cursor Agent** for scaffolding, features and refactors. Use **Tab** autocomplete everywhere else.
- Commit a `.cursor/rules/` file with project conventions. It shows deliberate, structured Cursor use.
- Keep a `CURSOR_LOG.md`: a short list of the key prompts and what they built. Screenshot the best moments.
- Commit small and often, so git history shows steady progress.
- In the Devpost writeup and the demo, include a **"How we built it with Cursor"** section.

---

## SpaceX / Cursor track ideas

Every idea here uses real space data, a Grok API and the Navigation theme.

### 1. ⭐ SkyPilot: voice-guided stargazing navigator *(recommended)*
Point your phone at the sky and ask out loud: *"Where's the ISS?"*, *"Which bright thing is that?"*, *"When does the next Starlink train pass over Ithaca?"* Grok Voice answers and talks you onto the target: *"Turn left 30°, raise your phone a bit… there."*
- **Space data:** live ISS position and satellite orbits (CelesTrak TLEs plus `satellite.js`), planet positions (JPL Horizons or an astronomy library), a bright-star catalog
- **Grok:** **Voice API** for the conversational guide. **Imagine** for a "what you'd see through a telescope" picture of the target.
- **Navigation angle:** It guides your eyes across the sky with voice and an on-screen arrow. An audio-only mode helps low-vision users, which matches one of the theme prompts.
- **MVP:** A web app using phone compass and tilt sensors that finds the ISS and 5 planets with voice guidance
- **Stretch:** Pass alerts, AR overlay, haptic "warmer/colder" vibration
- **Why it can win:** The live demo is memorable: you can walk judges outside or point the phone at the ceiling. It's strong on theme, voice and design.

### 2. Rover Route: AI path planning on real Mars terrain
Pick a start point and a destination on real Mars elevation data. The app plans a safe rover route that avoids steep slopes and rough terrain, the same way rover drivers plan drives. Grok Voice acts as Mission Control and narrates the drive. Grok Imagine renders a "rover camera" view at each waypoint.
- **Space data:** Mars elevation and terrain maps (NASA PDS and HiRISE elevation models), real Perseverance or Curiosity routes for comparison
- **Grok:** **Imagine** for waypoint views, **Voice** for mission control
- **Navigation angle:** It directly answers the prompt *"How do you train AI to better navigate the world?"*
- **MVP:** A 2D heightmap, A* pathfinding with a slope cost, the route on a map and narrated waypoints
- **Stretch:** A 3D terrain view in three.js, and a comparison of your route to the real rover's path

### 3. OrbitWatch: space-traffic control for satellites
A 3D globe of thousands of real satellites and pieces of debris. It flags close approaches between objects, and Grok Voice delivers a "flight director" briefing: *"Three high-risk approaches in the next 24 hours…"*
- **Space data:** CelesTrak TLEs (active satellites and debris), propagated with `satellite.js`
- **Grok:** **Voice** briefings and a voice query mode: *"Show me everything Starlink over Europe."*
- **Navigation angle:** Navigating crowded orbits is a real problem for the next 100 years.
- **MVP:** A CesiumJS or three.js globe with live satellites, simple close-approach detection and a spoken briefing
- **Stretch:** Suggest an avoidance maneuver for a chosen satellite

### 4. Voyage Planner: plan a trip across the solar system
Pick an origin and destination (Earth to Mars, Earth to Europa). The app computes a transfer orbit, shows the travel time, the fuel needed (delta-v) and the next launch windows, and animates the trajectory. Grok Imagine makes a "postcard" for each leg, and Grok Voice is your ship's AI.
- **Space data:** JPL Horizons planet positions, real mission trajectories (Voyager, New Horizons) to replay
- **Grok:** **Imagine** postcards, **Voice** ship AI
- **Navigation angle:** It's interplanetary navigation, and it teaches orbital mechanics while you plan.
- **MVP:** Transfer orbits between planets, launch-window finder, 2D orbit animation
- **Stretch:** Gravity-assist routes, and comparing your plan to real missions

### 5. StarFix: navigate without GPS, like a spacecraft
Spacecraft and sailors find their orientation by recognizing star patterns. Take a photo of the night sky (or upload one), and StarFix matches the stars against a catalog to work out where the camera is pointing and roughly where you are on Earth. Grok Voice walks you through the result.
- **Space data:** Hipparcos or Yale Bright Star catalog, real star-tracker methods
- **Grok:** **Voice** for an explanation like *"You're facing northeast, about 42°N…"*. **Imagine** for a labeled sky chart.
- **Navigation angle:** Navigation when GPS is unavailable, as on Mars, in a war zone or deep in space
- **MVP:** Upload a sky photo, identify stars and show the pointing direction (you can use an existing star-matching library and focus on the UX)
- **Stretch:** Live camera mode, and a latitude estimate from Polaris
- **Risk:** This is the hardest one technically. Prototype the star-matching step early.

### 6. Launch Lens: a voice companion for SpaceX launches
Ask *"What's launching this week, and where will it go?"* The app shows past and upcoming launches, rocket recoveries and ground tracks on a map, and you can explore them by voice. Grok Imagine generates mission-patch-style art for each launch.
- **Space data:** launch schedule and past-launch data (Launch Library 2 API), ground tracks from orbit data
- **Grok:** **Voice** Q&A, **Imagine** mission art
- **Navigation angle:** Weaker on theme. Ground tracks and recovery-ship navigation help a bit.
- **MVP:** Launch timeline, ground-track map, voice Q&A
- **Note:** This is the easiest to build but the least original. Keep it as a fallback.

---

## Cursor track ideas without space

The hard requirements are only **Cursor** and **Grok Imagine or Voice**. Space data is how SpaceX frames the track, so a non-space project is allowed but may score a little lower with their judges. Each idea has a full sheet in [docs/ideas/](docs/ideas/).

| Idea | Pitch | Best for |
|---|---|---|
| **GuideVoice** | A voice and camera walking guide for blind and low-vision users | Top non-space pick; demos live indoors |
| **Campus Wayfinder** | Voice-guided indoor directions inside PSB and Klarman | Live demo, People's Choice |
| **HillSmart** | Routes that avoid Ithaca's hills and stairs, with voice guidance | A practical, relatable pick |
| **VoiceRover** | A Raspberry Pi robot car you drive by voice | Hardware track too, if motors are available |
| **PictureRoute** | Directions as illustrated landmark cards, made with Grok Imagine | Design track |
| **Wanderlings** | Pikmin Bloom with AI agents: walk to make your trail bloom, and send agent companions to scout real places. They return with Grok Imagine postcards and Grok Voice memos. | People's Choice, Design, and Photon if agents text you |

## ⭐ Wanderlings: the current front-runner

**Pikmin Bloom meets AI agents.** Walk, and your trail blooms on the map. Send agent companions to scout real places. Climb the ranks, and capture landmarks as postcards, Pokémon Go style.

| Feature | What it does |
|---|---|
| 🤖 **Agent squad** | **Pip (Scout)** finds places you've never been. **Moss (Storyteller)** tells their history. **Fern (Pathfinder)** walks you there. Agents only report facts from real data (Wikipedia and maps). |
| 🏆 **Ranks** | Points come from steps walked, landmarks found and landmarks captured. The ranks run 🌱 Seedling → 🌿 Sprout → 🌷 Bud → 🌸 Blossom → 🌳 Grove → 🌲 Ancient Oak. |
| 🌍 **Leaderboards** | **Local** (your city), **Statewide** and **National** rankings, based on your GPS location. |
| 🌸 **Custom trails** | Each rank unlocks a new trail with its own flowers and path color, such as Rose Garden, Cherry Blossom, Forest Floor and Starlight. Your trail upgrades when you rank up, or you can pick any trail you've unlocked. |
| 💰 **Walk-instead-of-ride savings** | Each walk over 300 m counts as an Uber you skipped. The estimated fare moves into a savings account through **Capital One's Nessie API**, and the money **grows your savings tree** from 🌰 seed to 🍎 fruit tree. |
| 📸 **AR landmark capture** | At a landmark, open the camera with your agent in the frame and snap a postcard for your album. |
| 🎙️ **Grok** | **Grok Voice** gives agents their voice memos. **Grok Imagine** makes postcard illustrations and creature art. |

**Tracks:** Cursor (SpaceX), **Capital One (Best Use of Nessie)**, Big Red, People's Choice and Design. It can also enter **Photon**: the agents already work in iMessage (see [`imessage-agent/`](imessage-agent/)).

- **Try it:** a working prototype of everything above is in [`prototype/`](prototype/). See [prototype/README.md](prototype/README.md) to run it. It's a throwaway prototype; the submission must be built in Cursor.
- **Idea sheet:** [docs/ideas/12-wanderlings.tex](docs/ideas/12-wanderlings.tex)
- **Mobile app:** started in [`mobile/`](mobile/) (Expo), with real step counting. For what's left (Grok, a backend for leaderboards, background GPS, true AR), see [docs/mobile-migration.md](docs/mobile-migration.md).

## Other ideas that fit the Navigation theme

These target other tracks, in case we change plans.

- **AccessiMap** (Big Red, Design): step-free campus routes that avoid stairs, hills and broken elevators, with crowdsourced obstacle reports.
- **Haptic Compass** (Hardware, Big Red): a wristband or belt that vibrates toward your destination, so blind and low-vision users can navigate without looking at a phone.
- **Nessie Money Navigator** (Capital One): a spending-path planner on Capital One's Nessie API that "navigates" you to a savings goal, recalculating like GPS.
- **iMessage Trip Agent** (Photon): an agent in iMessage, built with Photon Spectrum, that coordinates group rides and directions.

## Scoring sheet

Score each idea from 1 to 5 on each column.

| # | Idea | Demo-able | Buildable in ~24h | Navigation theme | Wow | Excitement | **Total** |
|---|------|:----:|:----:|:----:|:----:|:----:|:----:|
| 1 | SkyPilot | | | | | | |
| 2 | Rover Route | | | | | | |
| 3 | OrbitWatch | | | | | | |
| 4 | Voyage Planner | | | | | | |
| 5 | StarFix | | | | | | |
| 6 | Launch Lens | | | | | | |
| 7 | GuideVoice | | | | | | |
| 8 | Campus Wayfinder | | | | | | |
| 9 | HillSmart | | | | | | |
| 10 | VoiceRover | | | | | | |
| 11 | PictureRoute | | | | | | |
| 12 | Wanderlings | | | | | | |

## Team

| Name | Strengths | Contact |
|------|-----------|---------|
| Luis Mendez | | |
| | | |
| | | |

## Timeline

| When | Goal |
|------|------|
| Fri night | Pick the idea, register the team (by 11:59 PM), attend the Cursor workshop, get Grok API keys working |
| Sat morning | Data pipeline working, plus a working Grok call |
| Sat afternoon | End-to-end MVP of the demo path |
| Sat night | Polish the UI, record a backup demo video |
| Sun 6:00 AM | **Feature freeze.** Only fix bugs and write the Devpost. |
| Sun 8:30 AM | **Submit on Devpost** |

## Getting started

### Try the Wanderlings prototype

There's a quick concept demo in [`prototype/`](prototype/). It's a throwaway prototype, not the Cursor-built submission.

```bash
cd big-red-hacks2026/prototype
python serve.py      # reads the Mapbox token (MAPBOXKEY) from the root .env
# then open http://localhost:8765
```

For full steps, demo instructions, phone setup and troubleshooting, see [prototype/README.md](prototype/README.md).

### Wanderlings mobile app (Expo)

The phone version is in [`mobile/`](mobile/). It has a real step counter, a native map, the camera and saved progress, and it runs in **Expo Go** without app store setup.

```bash
cd big-red-hacks2026/mobile
npm install
npx expo start      # scan the QR code with Expo Go
```

See [mobile/README.md](mobile/README.md) for the full guide and known limits. It was built outside Cursor, so keep building it in Cursor for the track.

### Wanderlings on iMessage (Photon)

The squad also works as an iMessage agent in [`imessage-agent/`](imessage-agent/). You text "explore", "story" and "take me there", and "arrived" grows your savings tree.

```bash
cd big-red-hacks2026/imessage-agent
npm install
npm run terminal    # try it in the terminal, no keys needed
npm start           # real iMessage, after adding Photon keys to .env
```

To set up the Photon keys (Project ID and Secret from app.photon.codes), see [imessage-agent/README.md](imessage-agent/README.md).

### Open the project in Cursor

```bash
git clone <repo-url>
cd big-red-hacks2026
# Open in Cursor, add the Grok API key to .env (never commit it)
```
