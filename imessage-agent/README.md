# HuskiesPaws on iMessage (Photon track)

The HuskiesPaws squad as an iMessage agent, built on [Photon Spectrum](https://photon.codes/docs/spectrum-ts/introduction). Text it:

| You text | What happens |
|---|---|
| `hi` | 🐾 The squad introduces itself and lists the commands |
| `I'm at Klarman Hall` | 📍 Sets where you are (looked up on OpenStreetMap) |
| `explore` | 🍊 Pip heads out, then texts back with a real nearby place, a fact and a photo |
| `story` | 🍇 Moss tells the history of the closest landmark, then sends a voice note reading it aloud (ElevenLabs) |
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

1. **Create an account and project** at [app.photon.codes](https://app.photon.codes/). The hackathon promo code from the opening ceremony is **`HACKWITHPHOTON`**.
2. **Get your credentials:** open your project's **Settings** page and copy the **Project ID** and **Project Secret**.
3. **Make a `.env` file** in this folder from the template:

   ```bash
   cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
   ```

   Then fill it in:

   ```
   SPECTRUM_PROJECT_ID=your-project-id
   SPECTRUM_PROJECT_SECRET=your-project-secret
   DEMO_PHONE_NUMBER=+16075551234
   ELEVENLABS_API_KEY=your-elevenlabs-key   # optional: Moss's story voice notes
   ```

   `.env` is git-ignored. **Never commit it or paste the secret into chat.** If it leaks, rotate it in the dashboard.
4. **Check that iMessage is enabled and your project has a phone line** in the dashboard. With the Photon CLI, `photon spectrum lines ls` lists the lines assigned to your project.

## 3. Run it on iMessage

```bash
npm start
```

You should see `HuskiesPaws agent listening on iMessage…`.

**How you start a chat:** on Photon's free plan, messages go through a shared pool of phone numbers, so the number can differ per person. The easiest way to start: set **`DEMO_PHONE_NUMBER`** to your own number. Pip texts you first when the agent starts, and you just reply. If that doesn't arrive, check the dashboard (or `photon spectrum users ls`) for how users are added to your project.

The cloud iMessage provider runs on any computer. **It does not need a Mac.**

## Story voice notes (ElevenLabs)

With `ELEVENLABS_API_KEY` in `.env` (create a key at [elevenlabs.io](https://elevenlabs.io/app/settings/api-keys)), every `story` reply is followed by a voice note of Moss reading it in his ElevenLabs voice. The TTS client is shared with the server (`../server/src/elevenlabs.js`); `ELEVENLABS_VOICE_STORYTELLER` overrides Moss's voice ID.

- **On iMessage** it is sent as a native audio message when possible. iMessage needs m4a, so spectrum-ts converts the MP3 with **ffmpeg** (on your `PATH`, or `npm install ffmpeg-static`). Without ffmpeg, the agent sends `moss-story.mp3` as a regular audio file instead.
- **In terminal mode** you'll see `[voice note: N KB]` instead of audio.
- **No key, or ElevenLabs fails?** Moss still sends the story text; the failure is only logged.

## Tests

```bash
npm test
```

This runs a full conversation (locate → explore → take me there → arrived → savings) against live Wikipedia, OpenStreetMap and routing data. No Photon keys needed. `test/voice.test.js` checks the story voice notes offline with stubbed Wikipedia and a fake ElevenLabs client (no ElevenLabs key needed).

## Notes and limits

- **Sessions live in memory,** so restarting the agent forgets everyone's location and savings. Fine for a demo; a real version would store them in the shared backend.
- **Pip prefers places at least 300 m away,** far enough that you'd otherwise take a ride, so walking there saves money.
- Wikipedia and OpenStreetMap require an identifying User-Agent. `src/index.js` sets one; without it, they return 403.
- **Verified:** terminal mode and the conversation tests. **Not verified:** the live iMessage connection (needs your Photon keys and a phone line), including how the voice note arrives on a real iPhone.
- **Grok** isn't used here yet. Pip's replies come from templates filled with real data. Grok chat could give each agent more personality.

## Files

```
src/index.js       connects to Photon (or the terminal), one session per chat
src/bot.js         the squad's replies; platform-independent and tested
test/bot.test.js   full conversation tests
test/voice.test.js story voice notes with a fake ElevenLabs
.env.example       the Photon and ElevenLabs settings template
```
