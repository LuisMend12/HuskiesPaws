# Opening ceremony notes and extra ideas

These are notes from the opening ceremony slides and a later brainstorm. They only cover what isn't already in [general-info.tex](general-info.tex), the [README](../README.md) or [ideas/](ideas/).

- [Opening ceremony slides](https://docs.google.com/presentation/d/1HytL8PP48KtWOhP_aJ7BdhmIkyhY8bUU2go4iSU_tO0/edit)
- [Theme information doc](https://docs.google.com/document/d/1NHrE-zrTy1DDI-0d1FkQAStY7yizpfoao3BqESUHHM0/edit). **We haven't read this yet.** If it lists sub-themes, check the ideas below against them.

## The theme is broader than maps

The slides define **Navigation** broadly. It includes:

- **Physical wayfinding:** getting from place to place
- **Networks of people, ideas and information:** finding your way through a social graph, a body of knowledge or a pile of data
- **AI that navigates for us:** agents that plan routes, make choices or explore for you

The opening speaker, **Jon Kleinberg**, is known for his work on networks and how people navigate small-world graphs. A pitch that mentions this will land with Cornell judges.

## Sponsor and prize details

These come from the slides. Check them with organizers before relying on them.

| Track or sponsor | Detail |
|---|---|
| **Photon** (iMessage agents) | Prize: **$400 cash + credits + a fast-tracked interview**. Promo code for Photon Spectrum: **`HACKWITHPHOTON`**. |
| **ElevenLabs** | Listed as a sponsor. Useful for a voice layer on non-Grok projects. |
| **MLH hardware** | Good kits run out quickly. Check out hardware first thing if we go with a hardware idea. |

## Schedule conflict: Saturday workshops

The latest copy of the general info doc still disagrees with itself:

| Time | Day schedule says | Workshop table says |
|---|---|---|
| 1:00 PM | Photon Demo (1:00–1:20) | Photon |
| 2:00 PM | CAD by Assistive Tech | ASML |
| 3:00 PM | ASML (data science and ML for a hardware problem) | Assistive Tech |

The new copy changes 1:00 PM to **Photon**. Our `general-info.tex` still lists it as "Google Maps API". Both copies agree the Saturday workshops are in **PSB 120**. Confirm the 2–3 PM order on Discord if we plan to go to one.

## New project ideas

The README already covers SkyPilot, Haptic Compass, the Nessie Money Navigator and the iMessage Trip Agent. Below are the new ideas, plus details the README doesn't have for the ideas that overlap.

### Learning Path GPS (new): navigate ideas instead of streets

You type *"I know Python, I want to understand transformers."* The app builds a prerequisite graph from Wikipedia links plus LLM reasoning, and draws the shortest route on an interactive map. Each stop has one resource and a quick check question. If you get a question wrong, it reroutes you through a detour concept.

- **Why it fits:** it covers the "navigating ideas" part of the theme directly, and it ties into Kleinberg's research.
- **Tracks:** BigRed, Software, Design. An all-first-timer team could also enter Beginner.

### Haptic wayfinding wearable (adds detail to Haptic Compass)

- **Build:** a Raspberry Pi with a Logitech webcam runs a lightweight object-detection model. Grove vibration motors give the feedback: a buzz on the left means turn left, and a rapid pulse means an obstacle is ahead.
- **Demo:** blindfold a judge and guide them from the atrium to PSB 120.
- **Extras:** an ElevenLabs voice layer. It matches the organizers' prompt about audio and haptic navigation for blind users almost word for word.
- **Tracks:** BigRed, Hardware

### Meet in the Middle (adds detail to iMessage Trip Agent)

You add the agent to a group chat and ask *"where should we eat tonight?"* It asks each person where they are, picks a place that's **fair on travel time for everyone**, checks it's open, and replies with directions. It can also answer campus questions like *"how do I get to Baker 200 without going outside?"*

- **Build:** Photon Spectrum
- **Tracks:** Photon, BigRed, Software, People's Choice. Everyone already uses iMessage, so it's easy to get votes.

### Money GPS (adds detail to Nessie Money Navigator)

- It shows an **ETA** for a savings goal, such as *"at this pace you hit $2,000 by March 14"*.
- When you overspend, it says **"Recalculating…"** and suggests a new route, such as cutting two takeout orders a week.
- The UI copies Google Maps conventions, so the theme link is obvious and the Design track has something to judge.
- Sending reroute alerts through iMessage would also enter it in the Photon track.
- **Tracks:** Capital One, Design, BigRed (plus Photon with the iMessage alerts)

### Sky Compass (≈ SkyPilot)

This is mostly a duplicate of SkyPilot. The only new suggestions are to include Hubble as a target and to use Grok Imagine for a picture of each satellite's mission.

### How to choose

| Priority | Pick |
|---|---|
| Best theme fit and wow factor | Haptic wearable, or Learning Path GPS |
| Most prize money in reach | Meet in the Middle, or Money GPS. Each adds a cash sponsor track on top of BigRed. |
| Team interested in space or AI tooling | Sky Compass / SkyPilot |

## More ideas for Wanderlings

These came from a brainstorm called "Bloomway". They aren't in [12-wanderlings.tex](ideas/12-wanderlings.tex) or the prototype.

### Game mechanics

- **Fog of war:** the map starts covered in fog, and you clear it by walking.
- **Daily route:** each day the app suggests a walk through streets and buildings you've never visited. Exploring new ground earns **rare seeds**.
- **Shared garden:** combine everyone's flowers into one map. It shows how people really move around campus, including popular shortcuts and places nobody goes. This is likely the part judges remember.

### Adding more tracks

Pick one or two of these, not all of them.

| Track | Idea |
|---|---|
| **People's Choice** | Get other hackers planting flowers around PSB and Klarman on Saturday, then show the event-wide garden in the demo. Players become voters. |
| **Hardware** | A small desk garden on a SenseCAP Indicator or a Raspberry Pi with a screen. It grows as you walk. |
| **Capital One** | Each time you walk somewhere instead of taking an Uber, move the fare you saved into a Nessie savings account. That money grows your tree (see [Savings tree](#savings-tree-capital-one-track)). |
| **BigRed (impact)** | Walkers tag stairs, ramps and broken elevators. Accessible routes bloom in a different color. |

### Team ideas: ranks, AR capture and rewards

**Ranked system**

- Your rank goes up with steps walked and landmarks found.
- Leaderboards at **local, statewide and national** levels.
- *Notes:* leaderboards need the shared backend described under Build notes. To place a player in a state or country, reverse-geocode their location (for example with OpenStreetMap Nominatim) and store only the region, not their walk. Rank on landmarks found, not just distance, and cap the speed that counts as walking, so GPS spoofing and the demo walk can't top the board.

**AR landmark capture (like Pokémon GO)**

- When you reach a landmark, open the camera and "capture" it as a postcard, with the landmark framed and stamped.
- *Notes:* full AR on the web is hard, because WebXR doesn't work in iPhone Safari. For the hackathon, a camera view (`getUserMedia`) with a postcard frame and the landmark's name on top looks like AR and works everywhere. Only allow a capture when the player is within about 50 m of the landmark. The captured photo can be the source image for the Grok Imagine postcard.

**Rewards tied to rank**

- Flower types change as your rank goes up.
- Unlockable custom trails, such as different colors, patterns or plants.
- *Notes:* this is mostly art and config. The prototype already picks flowers from a list in `map.js` and gives agents a hat at level 2, so this extends patterns we already have.

### Savings tree (Capital One track)

Each time you walk somewhere instead of taking an Uber, the app moves the fare you saved into a savings account through **Nessie**, and that money **grows your tree**.

- **How it works:** after a walk, estimate the ride fare from the distance (base fare plus a per-mile rate is enough) and make a Nessie transfer from checking to savings. The tree's size and stage follow the savings balance.
- **Why it fits:** it uses Nessie for real money movement, not just as decoration, and it fits the theme because a choice about how you travel becomes a financial habit.
- **Demo:** finish a walk, show the transfer in Nessie and the tree growing at the same moment.
- **Watch out:** Nessie is mock data, so present the fares as estimates. This adds a track, so keep it to a single screen and don't let it eat into the core walking loop.

### Build notes

- Shared data (the shared garden, friends' trails) needs a backend such as **Supabase or Firebase**.
- Use **Expo / React Native** only if someone already knows it and we want real step counts from the phone's pedometer. Otherwise, keep the mobile web app.
- **Build order:** first the trail, flowers and fog; then the daily route and shared map; then everything else.
