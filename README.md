<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/logo/huskiespaws-logo-dark.png">
    <img alt="HuskiesPaws logo: a husky with a blooming paw print" src="docs/logo/huskiespaws-logo.png" width="560">
  </picture>
</p>

# 🐾 HuskiesPaws

**Walk more, explore more, save more.**

HuskiesPaws turns everyday walking into an adventure. Every walk blooms a flower trail on the map. A squad of AI agents scouts real places for you and walks you there. Walking hatches pets that guard the landmarks you discover. And every rideshare you skip by walking moves the fare into a savings account (through Capital One's Nessie banking sandbox) that grows a tree.

Built at **[BigRed//Hacks 2026](https://bigredhacks2026.devpost.com/)**, Cornell University, October 2–4, 2026. Theme: **Navigation**.

| | |
|---|---|
| 🏆 **Devpost** | _TODO: add the Devpost project link_ |
| 🎬 **Demo video** | _TODO: add the video link (see [docs/DEMO.md](docs/DEMO.md))_ |
| 📊 **Pitch deck (PDF)** | _TODO: add the Google Drive link to the deck PDF_ |
| 🌐 **Live app** | _TODO: add the Render HTTPS link (see [server/README.md](server/README.md#deploy-with-https-render-free))_ |
| 💻 **Code** | https://github.com/LuisMend12/big-red-hacks2026 |

## Team

| Name | Role |
|---|---|
| Luis Mendez | _TODO_ |
| Abdullah Rashid | _TODO_ |

---

## The problem, and why it matters

The hackathon asked: *"What do we build next to change how we navigate in the next 100 years?"*

Today's navigation is built for one thing: **the shortest path.** It puts us in cars and rideshares for trips we could walk, and keeps our eyes on a blue dot instead of the place around us.

- **Short trips add up.** Students take rides for walks of 10–15 minutes, which costs money every week and adds traffic and emissions.
- **We miss what's around us.** Most people walk the same few routes and never discover the landmarks a few blocks away.
- **Healthy habits are hard to keep.** Step counters log numbers but don't give people a reason to walk somewhere new.

## Our solution

HuskiesPaws makes **where you go** the fun part. Navigation becomes about curiosity, not just speed, and it rewards you for walking instead of riding.

| Feature | What it does |
|---|---|
| 🤖 **Agent squad** | **Pip (Scout)** finds real places you've never been, **Moss (Storyteller)** tells their history, and **Fern (Pathfinder)** plans the walking route and guides you. Agents only report facts from real data (Wikipedia and OpenStreetMap), and every postcard links to its source. |
| 🎙️ **Grok Voice and Grok Imagine** | Each agent speaks its memos in its own **Grok Voice**. **Grok Imagine** illustrates every place the agents discover and draws a unique portrait for every pet. |
| 🌸 **Blooming trails** | Your walk leaves a trail of flowers on the map. Each rank unlocks a new trail, from 🌱 Sprout Path to ✨ Starlight. |
| 💰 **Walk instead of ride** | Every walk over 300 m counts as a rideshare you skipped. The estimated fare moves into a savings account through **Capital One's Nessie API**, and your savings grow a tree from 🌰 seed to 🍎 fruit tree. |
| 🥚 **Eggs and pets** | Walking earns eggs, and walking further hatches them into pets with a rarity, from common to legendary. **While the ISS is overhead** (live orbital data), rare pets are 3x as likely. |
| 🏰 **Turf** | Leave your pet to guard a landmark you walked to and earn XP every hour it holds. A player with a stronger pet can take it over, which gives people a reason to keep walking back. |
| 🏆 **Ranks and leaderboards** | Points come from steps, discoveries, captures and turf. Live **local, statewide and national** leaderboards. |
| 📸 **Landmark capture** | At a landmark, open the camera with your agent in the frame and snap a postcard for your album. |
| 💬 **iMessage** | Text the squad: "explore", "story", "take me there". Built with **Photon Spectrum**. |

### Screenshots

_TODO: add 3–4 screenshots to `docs/screenshots/` and link them here: the map with a blooming trail, a Grok Imagine postcard, a pet hatch, and the Savings tree._

## How we built it

```mermaid
flowchart LR
  subgraph Clients
    Phone["📱 Phone app<br/>mobile/ (Expo)"]
    IM["💬 iMessage agent<br/>imessage-agent/ (Photon)"]
  end
  Core["Shared game logic<br/>core/<br/>agents · ranks · pets · savings"]
  Server["HuskiesPaws server<br/>server/ (Node)"]
  Phone --> Server
  Phone -.synced copy.-> Core
  IM -.uses.-> Core
  Server --> Grok["xAI Grok<br/>Voice + Imagine"]
  Server --> DB["Supabase or<br/>JSON file storage"]
  Phone --> Nessie["Capital One Nessie"]
  Core --> Data["Wikipedia · OpenStreetMap<br/>walking routes · ISS position"]
```

- **One set of game rules, two apps.** The agents, ranks, trails, pets, savings and Nessie client are plain JavaScript in [`core/`](core/), shared by the Expo phone app and the iMessage agent.
- **A small server holds every secret.** The Grok key never ships inside the app. The app can't send its own image prompts; the server builds them from fixed templates. There are per-IP and daily limits, and each image is generated once and cached.
- **Real data only.** Places and facts come from Wikipedia, routes and regions from OpenStreetMap, and the ISS position from wheretheiss.at.

**Built with:** JavaScript, Node.js, Expo / React Native, react-native-maps, xAI Grok (Voice, Imagine), Capital One Nessie API, Photon Spectrum, Supabase, Wikipedia API, OpenStreetMap (Nominatim, OSRM), wheretheiss.at, Render, **Cursor**.

### Built with Cursor

_TODO (team): describe how you used Cursor (Agent mode, Tab, rules files), with a few example prompts and what they built. Link `CURSOR_LOG.md` and screenshots if you have them, and mention Grok Bot if you used it for planning. Keep it accurate: judges may ask._

## Prize tracks

| Track | How HuskiesPaws meets it |
|---|---|
| **BigRed Track** (technical, design, creativity, impact, theme) | Navigation by curiosity instead of shortest path. Two working apps (phone and iMessage) sharing one codebase, real data, and an automated test suite. |
| **SpaceX: Make it Legendary** | **Grok Voice** (agent memos) and **Grok Imagine** (postcards and pet portraits) are core features. **Real space data:** live ISS position and visibility footprint decide when rare eggs hatch. Built with **Cursor** (see above). |
| **Capital One: Best Use of Nessie** | Each walk that replaces a ride moves the estimated fare from checking into savings with a Nessie **transfer**. The account is set up with Nessie customer and account endpoints. Savings grow a visible tree, and eggs are never bought with that money. |
| **Photon: Agents in iMessage** | The agent squad runs on iMessage through **Photon Spectrum**: explore, stories, walking directions and savings by text. |
| **Software** | A backend with validation, rate limits, caching and storage that's swappable between Supabase and a file. 24 automated tests across the game logic, the API and the iMessage agent. |
| **Design** | A cohesive, cozy visual language: blooming trails, illustrated postcards, rarity reveals and an accessible tab layout. |
| **People's Choice** | Turf turns other hackers into players: claim landmarks around PSB and Klarman and defend them. |

## Devpost answers (drafts)

**Inspiration.** Walking games like Pikmin Bloom and Pokémon GO get people outside. We wanted that joy, plus agents that do real work for you and a tangible reward, visible savings, for choosing to walk instead of ride. The Navigation theme pushed us to ask what "getting somewhere" could mean beyond the shortest route.

**What it does.** See [Our solution](#our-solution): agents scout real places and guide you there, your walk blooms on the map, skipped rides become real savings through Nessie, walking hatches Grok-drawn pets that guard landmarks, and everything works on the web, on your phone and over iMessage.

**How we built it.** See [How we built it](#how-we-built-it): shared JavaScript game logic, a Node server that keeps the Grok key private, an Expo phone app, and a Photon Spectrum iMessage agent.

**Challenges we ran into.**
- **The Nessie API kept resetting connections** while we built, so savings are kept in a local ledger first and mirrored to Nessie when it responds. The demo never breaks.
- **Wikipedia and OpenStreetMap returned 403** to the phone app's default identity, so we added an identifying User-Agent for the phone and the iMessage agent.
- **Keeping an AI key out of a public phone app:** server-side prompt templates, validation, rate limits and image caching.
- **Judging is indoors,** so we built a demo mode that simulates walks along real walking routes.
- **There's no public Uber pricing API,** so fares are a clearly labeled estimate.

**Accomplishments that we're proud of.** Two working clients (phone and iMessage) that share one set of game rules. Agents that only say what real data supports. Grok features that fall back gracefully without a key. Rare eggs tied to the real ISS overhead.

**What we learned.** Designing APIs so secrets stay on the server, building one codebase for web, phone and chat, and how much a small reward changes whether people choose to walk.

**What's next.**
- Pets, turf and Grok in the phone app.
- Real AR capture (ARKit / ARCore) and background walk tracking.
- Accessibility: tagging stairs, ramps and broken elevators.
- Friends and shared campus gardens.
- Real accounts, and server-side checks against fake steps.

## Getting started

**Commands run from the folder they belong to.** If your terminal is at the repo root, `cd` into `server`, `core`, `mobile` or `imessage-agent` first. Paths in this repo contain spaces (`New folder`), so put quotes around full paths, for example `cd "C:\...\big-red-hacks2026\mobile"`.

### 1. Install the tools

| Tool | Version | Needed for |
|---|---|---|
| [Node.js](https://nodejs.org/) | **22.9 or newer** | Server, phone app, iMessage agent, tests |
| [Git](https://git-scm.com/) | any | Cloning the repo |
| **Expo Go** app on your phone | latest (SDK 57) | The phone app (App Store or Google Play) |

Check them with `node --version` and `git --version`.

### 2. Clone the repo and add your keys

```bash
git clone https://github.com/LuisMend12/big-red-hacks2026.git
cd big-red-hacks2026
```

Create a file named **`.env`** in the repo root. It's git-ignored, so keys never get committed. **Every key is optional:** without one, that feature uses a fallback.

```ini
# Grok Voice + Grok Imagine (console.x.ai -> API Keys)
XAI_API_KEY=
# Optional: keeps leaderboards and turf across restarts (Supabase -> Project Settings -> API)
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
```

The iMessage agent has its own `.env` (step 5). Templates: [server/.env.example](server/.env.example) and [imessage-agent/.env.example](imessage-agent/.env.example).

### 3. 🖥️ Server (Grok, live leaderboards, turf)

```bash
cd server
npm start
```

Then check **http://localhost:8765/api/health**. The server has no dependencies, so there's no `npm install` step. The startup line shows what's on, for example `Grok: on · storage: file`. Stop it with `Ctrl+C`. Guide: [server/README.md](server/README.md).

### 4. 📱 Phone app (Expo)

```bash
cd mobile
npm install
npm run tunnel
```

Wait for **"Tunnel ready."**, then scan the QR code: with the **Camera** app on iPhone, or **inside Expo Go** on Android. Tunnel mode works on any network, including the venue's guest Wi-Fi, which blocks the normal mode. On a home network where the phone and laptop share Wi-Fi, `npx expo start` is faster. Guide and troubleshooting: [mobile/README.md](mobile/README.md).

### 5. 💬 iMessage agent (Photon)

Try it in your terminal first. No keys are needed:

```bash
cd imessage-agent
npm install
npm run terminal
```

Type `hi`, `explore`, `take me there`, `arrived` and `savings`.

To use it on real iMessage, add your Photon keys (from [app.photon.codes](https://app.photon.codes/) → your project → **Settings**):

```bash
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
# edit .env: SPECTRUM_PROJECT_ID, SPECTRUM_PROJECT_SECRET, and DEMO_PHONE_NUMBER (your number)
npm start
```

Pip texts your `DEMO_PHONE_NUMBER` first, so just reply. Guide: [imessage-agent/README.md](imessage-agent/README.md).

### 6. ✅ Run the tests

```bash
cd core && npm test             # game logic: eggs, pets, ranks, savings
cd ../server && npm test        # API: Grok requests (fake xAI), turf, leaderboards, security
cd ../imessage-agent && npm test   # a full iMessage conversation (needs internet)
cd ../mobile && npx expo lint   # phone app lint
```

### 7. 🚀 Deploy with HTTPS (for phones and judging)

Push to GitHub. Then in [Render](https://render.com) choose **New → Blueprint**, pick this repo (it reads [render.yaml](render.yaml)), and enter `XAI_API_KEY`. Open the `https://…onrender.com` link and check `/api/health`. Details: [server/README.md](server/README.md#deploy-with-https-render-free).

### Quick fixes

| Problem | Fix |
|---|---|
| `npx` / `npm` "running scripts is disabled" (PowerShell) | Use **Command Prompt**, or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once |
| Port 8765 is already in use | Stop the other server (`Ctrl+C`), or run `PORT=8800 npm start` (PowerShell: `$env:PORT=8800; npm start`) |
| Phone app spins forever | Use `npm run tunnel` (guest Wi-Fi blocks the normal mode) |
| `/api/health` shows `"grok":false` | Add `XAI_API_KEY` to the root `.env` and restart the server |

### Pushing changes

Everyone works on `main`, so pull before you start and again before you push.

```bash
git pull --rebase                 # get teammates' work first
# ...make your changes...
git status                        # check what changed; .env must NOT be listed
git add <the files you changed>   # add files by name, not "git add ." blindly
git commit -m "Short summary of the change"
git pull --rebase                 # pick up anything pushed while you worked
git push
```

- **Push rejected** ("fetch first" or "non-fast-forward")? Someone pushed before you. Run `git pull --rebase`, then `git push` again.
- **Conflict during the rebase?** Open the files git lists, keep the right parts, delete the `<<<<<<<`, `=======` and `>>>>>>>` lines, then `git add <file>` and `git rebase --continue`. To back out instead, run `git rebase --abort`.
- **Never commit keys.** `.env` files are ignored by git. If `git status` ever shows one, stop and don't commit it.
- **Before you push, run the checks** for the part you changed:

| You changed | Run |
|---|---|
| `core/` (shared game logic) | `npm test` in `core/`, then `npm run sync-core` in `mobile/` and commit the updated `mobile/src/core/` too |
| `server/` | `npm test` in `server/` |
| `mobile/` | `npx expo lint` and `npx expo export --platform android --platform ios` in `mobile/` |
| `imessage-agent/` | `npm test` in `imessage-agent/` |

- **Commit small and often** with clear messages. Judges look at the git history to see steady progress.

## Submission checklist (due Sunday 8:30 AM on Devpost)

- [ ] **GitHub link** to this repo on Devpost, with the repo **public**
- [ ] **Pitch deck** as a **Google Drive link to a PDF**: name and team, problem and why it matters, solution and screenshots, tech stack, impact and future potential (this README has all of it)
- [ ] Devpost questions answered (drafts above) and **tracks selected**: BigRed, SpaceX, Capital One, Photon, Software, Design, People's Choice
- [ ] Demo video linked
- [ ] Server deployed over HTTPS, with `XAI_API_KEY` set and `/api/health` showing `"grok":true`
- [ ] TODOs in this README filled in: team, links, screenshots, Cursor section
- [ ] At least 5 minutes set aside to submit; late submissions aren't accepted
- [ ] Ready for judging: 9:00 AM, 4 minutes per table (2-minute pitch, 2-minute Q&A). Script: [docs/DEMO.md](docs/DEMO.md)

## Repository

| Path | What's there |
|---|---|
| [`server/`](server/) | Backend API: Grok, leaderboards and turf |
| [`core/`](core/) | Shared game logic (synced into `mobile/src/core/`) |
| [`mobile/`](mobile/) | Expo phone app |
| [`imessage-agent/`](imessage-agent/) | Photon Spectrum iMessage agent |
| [`docs/`](docs/) | [Demo plan](docs/DEMO.md), [mobile plan](docs/mobile-migration.md), [hackathon info](docs/general-info.pdf), [brainstorming archive](docs/brainstorm.md), idea sheets |
| [PLAN.md](PLAN.md) | Scope and priorities for the weekend |
| [SPLIT.md](SPLIT.md) | Who works on what, branches and merge workflow |
| [AGENTS.md](AGENTS.md) | Notes for AI coding agents (Cursor, Claude Code) |
