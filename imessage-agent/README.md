# HuskiesPaws on iMessage (Photon track)

The HuskiesPaws squad as an iMessage agent, built on [Photon Spectrum](https://photon.codes/docs/spectrum-ts/introduction). Text it:

| You text | What happens |
|---|---|
| `hi` | 🐾 The squad introduces itself and lists the commands |
| `I'm at Klarman Hall` | 📍 Sets where you are (looked up on OpenStreetMap) |
| `explore` | 🍊 Pip heads out, then texts back with a real nearby place, a fact and a photo |
| `story` | 🍇 Moss tells the history of the closest landmark |
| `take me there` | 🫐 Fern sends walking directions (an Apple Maps link) and the Uber fare you'll skip |
| `arrived` | 🌸 Logs the walk; the skipped fare grows your savings tree |
| `savings` | 🌳 Shows your tree and total saved |

It uses the same game logic as the phone app (`../core/`), so places, facts, routes and savings work identically everywhere.

## 1. Try it without Photon (terminal mode)

No account or keys needed:

```bash
cd big-red-hacks2026/imessage-agent
npm install
npm run terminal
```

Type messages like `hi`, `explore` and `take me there` and press Enter.

## 2. Set up your Photon keys

The team already has a Photon project called **HuskiesPaws** (iMessage on, free plan). Ask Luis to add you, or make your own with the steps below.

### Fastest: the Photon CLI (version 2.2.0)

Run these in this folder. In PowerShell, set the variable with `$env:PHOTON_PROJECT_ID="<project-id>"` instead of `export`.

```bash
npx @photon-ai/cli login                       # opens the browser: sign in and approve this computer
npx @photon-ai/cli projects create --name "HuskiesPaws" --platforms imessage
export PHOTON_PROJECT_ID=<the id it printed>
npx @photon-ai/cli spectrum platforms ls       # imessage should say "on"
npx @photon-ai/cli spectrum users add --first-name You --phone +16075551234   # each person who'll text the agent (not yet tried)
```

**Get the secret into `.env` without showing it on screen:**

```bash
npx @photon-ai/cli projects regenerate-secret --yes --json
```

This prints the new secret once. Copy it straight into `.env` (below), and don't paste it into chat. Rotating it makes any older secret stop working.

### Or: the dashboard

At [app.photon.codes](https://app.photon.codes/), create a project with iMessage on, then copy the **Project ID** and **Project Secret** from its **Settings**. The hackathon promo code from the opening ceremony is **`HACKWITHPHOTON`**.

### Then make `.env`

```bash
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
```

```
SPECTRUM_PROJECT_ID=your-project-id
SPECTRUM_PROJECT_SECRET=your-project-secret
DEMO_PHONE_NUMBER=+16075551234
```

`.env` is git-ignored. **Never commit it or paste the secret into chat.** If it leaks, run `regenerate-secret` again.

### Free plan notes

- **No dedicated phone line.** `photon spectrum lines add` returns *"Line add/remove is only available on the business plan"*. That's fine: on the free plan, Photon sends messages from a **shared pool** of numbers, so you don't need a line of your own.
- **Add each person who'll text the agent as a user** (`spectrum users add --phone …`). Set `DEMO_PHONE_NUMBER` to your own number, and Pip texts you first when the agent starts, so you just reply.

## 3. Run it on iMessage

```bash
npm start
```

You should see `HuskiesPaws agent listening on iMessage…`.

**How you start a chat:** on Photon's free plan, messages go through a shared pool of phone numbers, so the number can differ per person. The easiest way to start: set **`DEMO_PHONE_NUMBER`** to your own number. Pip texts you first when the agent starts, and you just reply. If that doesn't arrive, check the dashboard (or `photon spectrum users ls`) for how users are added to your project.

The cloud iMessage provider runs on any computer. **It does not need a Mac.**

## Tests

```bash
npm test
```

This runs a full conversation (locate → explore → take me there → arrived → savings) against live Wikipedia, OpenStreetMap and routing data. No Photon keys needed.

## Notes and limits

- **Sessions live in memory,** so restarting the agent forgets everyone's location and savings. Fine for a demo; a real version would store them in the shared backend.
- **Pip prefers places at least 300 m away,** far enough that you'd otherwise take a ride, so walking there saves money.
- Wikipedia and OpenStreetMap require an identifying User-Agent. `src/index.js` sets one; without it, they return 403.
- **Verified:** terminal mode, the conversation tests, and that the agent connects to Photon with real keys (`HuskiesPaws agent listening on iMessage…`). **Not verified yet:** an actual text arriving on a phone.
- **Grok** isn't used here yet. Pip's replies come from templates filled with real data. Grok chat could give each agent more personality.

## Files

```
src/index.js       connects to Photon (or the terminal), one session per chat
src/bot.js         the squad's replies; platform-independent and tested
test/bot.test.js   full conversation tests
.env.example       the Photon credentials template
```
