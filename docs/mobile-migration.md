# Wanderlings: moving to a mobile app

The web prototype proves the idea, but three features need a native app:

| Feature | Web limit | Native fix |
|---|---|---|
| **Step counting** | No pedometer access. Steps are estimated from GPS distance. | The phone's real step counter |
| **Walk tracking** | Location stops when the screen turns off, especially on iPhone. | Background location |
| **AR capture** | The agent is only drawn on top of the camera feed. | ARKit / ARCore: the agent stands in 3D next to the landmark |

Real leaderboards also need a **backend**. That's true on the web too, but it becomes unavoidable once the app has real users.

> **Reminder:** the Cursor track requires the project to be built with Cursor. Build the mobile app in Cursor, and use the prototype as a reference.

## Recommended stack: Expo (React Native)

**Why Expo:**
- Teammates can run the app on their own phones in minutes by scanning a QR code in **Expo Go**. There's no app store and no Xcode setup.
- It's JavaScript, so the prototype's game logic copies over unchanged.
- It covers maps, location, camera, step counting and speech with official libraries.

| Need | Library | Works in Expo Go? |
|---|---|---|
| Map and blooming trail | `react-native-maps` (markers and polyline) | ✅ |
| Location (app open) | `expo-location` | ✅ |
| Location in the background | `expo-location` with `expo-task-manager` | ❌ Needs a development build |
| Step counting | `expo-sensors` (`Pedometer`) | ✅ Live steps. Past step history on Android needs Health Connect. |
| Camera capture (like the prototype) | `expo-camera` and `react-native-view-shot` | ✅ |
| True AR | ViroReact (`@reactvision/react-viro`) | ❌ Needs a development build |
| Fallback voice | `expo-speech` | ✅ |
| Saved progress | `@react-native-async-storage/async-storage` | ✅ |
| Leaderboards and accounts | Supabase (Postgres, auth and row-level security) or Firebase | ✅ |

**Alternative:** wrapping the existing web prototype in **Capacitor** is the fastest way to get an app icon on a phone. It adds native step counting and background location through plugins, but AR is much weaker. Pick Expo unless time is extremely short.

## What carries over from the prototype

| Copy as-is | Rewrite |
|---|---|
| `agents.js`, `rank.js` (including trails), `leaderboard.js`, `geo.js`, `config.js`, `savings.js`, `art.js` (SVG strings render with `react-native-svg`'s `SvgXml`), `nessie.js` (no CORS limits on mobile) | Screens: `app.js`, `views.js`, `index.html` and `styles.css` become React Native components |
| `services.js` (`fetch` works in React Native) | `map.js` becomes `react-native-maps` |
| | `capture.js` becomes `expo-camera`, then ViroReact for real AR |
| | `storage.js` becomes AsyncStorage (same `load`/`save` interface) |
| | `voice.js` becomes Grok Voice through the backend, with `expo-speech` as fallback |

## Backend for leaderboards

A minimal Supabase design:

- `players`: id, display name, current region (city, state and country)
- `walk_events`: player, steps, landmarks found, landmarks captured, timestamp
- A view or function that sums each player's score and ranks players **per city, per state and nationally**
- A small server function that holds the **Grok API key** and proxies Voice and Imagine calls. The key never goes in the app.

**Cheating:** a leaderboard invites fake steps. Check on the server that numbers are believable: steps per minute within human limits, captures only near a landmark's real coordinates, and rate limits on each player. For the hackathon, note this as future work.

**Privacy:** only send the server totals and your region, not your raw GPS trail.

## Hackathon plan (deadline Sunday 8:30 AM)

Native AR and background tracking are risky with less than a day left. Do it in phases:

**Phase 1: demo-ready (build this weekend in Cursor)**
1. `npx create-expo-app wanderlings` and run it in Expo Go on everyone's phone.
2. Map screen with the blooming trail (`react-native-maps`) and foreground location.
3. Copy the logic files and wire up the agent squad, expeditions and postcards.
4. Real step count from `Pedometer` feeding the rank system and trails.
5. Camera capture to the album, using the same overlay approach as the web prototype.
6. Leaderboards on Supabase. If time runs out, keep the sample players and say so.
7. Grok Voice and Imagine through one small backend function. **This is required for the track.**

**Phase 2: after the hackathon**
- Background walk tracking (development build)
- True AR capture with ViroReact
- Real accounts, friends and anti-cheat
- Agents texting you in iMessage through Photon

## Demo tips for judging (indoors)

- Keep a **demo walk** replay mode. You can't walk around at the judging table.
- Pre-record a short video of a real walk and an AR capture outside.
- Reset progress before judging so the first rank-up and trail unlock happen live.
