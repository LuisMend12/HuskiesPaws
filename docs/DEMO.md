# HuskiesPaws demo plan

Judging is **science-fair style: 4 minutes per table** (2-minute pitch, 2-minute Q&A), indoors, starting **Sunday 9:00 AM**. Finalists get 4 minutes plus 2 minutes of Q&A in Baker 200. Submit on Devpost by **8:30 AM**.

## The 2-minute pitch

| Time | Say | Do |
|---|---|---|
| 0:00 | "How we navigate today is shortest path, alone, staring at a phone. HuskiesPaws makes walking an adventure, and it pays you to skip the ride." | App open on the map |
| 0:15 | "Your agent squad scouts real places." | **Squad → Explore.** Pip's voice memo plays (**Grok Voice**), and the postcard appears with a **Grok Imagine** illustration. |
| 0:40 | "Fern walks you there, and your trail blooms." | **Take me there**: the trail blooms, and the status shows "You skipped a ~$8 ride". |
| 1:00 | "That fare moves into a savings account through **Capital One's Nessie API**, and it grows your tree." | **Savings** tab: the tree and the trip list |
| 1:15 | "Walking hatches eggs. Every pet is drawn by Grok, and rare eggs are more likely when the **ISS is passing overhead**, using live orbital data." | **Pets** tab: the hatched pet's portrait, and the 🛰️ banner if it's up |
| 1:30 | "Leave your pet to guard a landmark. Someone with a stronger pet can take it, so people keep walking back." | **Claim** the landmark. **Ranks**: live local, statewide and national boards |
| 1:45 | "It works on the web, as a phone app with a real step counter, and over iMessage." | Show a text thread with Pip (Photon) |
| 1:55 | "Built in Cursor with Grok." | Done. Leave 2 minutes for questions. |

## Before judging (Sunday 8:00 AM)

- [ ] Deployed site opened about 5 minutes early. Render's free tier sleeps and takes a minute to wake.
- [ ] `/api/health` says `"grok":true`.
- [ ] **Progress reset** (Ranks → Reset my progress), so the first rank-up, egg and hatch happen live. Or keep a "ready" browser profile with a pet already hatched in case time is short.
- [ ] **Pre-warm Grok Imagine:** explore a couple of places near PSB once, so their illustrations are cached and appear instantly.
- [ ] Phone volume up, laptop on power, a charged phone hotspot as backup Wi-Fi.
- [ ] Demo mode on (simulated walks). There's no walking at the judging table.
- [ ] iMessage agent running (`imessage-agent`, `npm start`) with a thread already open on a phone.
- [ ] Backup video open in a tab.

## If something breaks

| Problem | What to do |
|---|---|
| Grok slow or failing | The app falls back on its own: browser voice and SVG art. Keep going and mention Grok in words. |
| Wi-Fi down | Switch to the phone hotspot. If everything is down, play the backup video. |
| Nessie unreachable | Savings still work locally ("local" next to each walk). Say the transfer is mirrored when Nessie responds. |
| Map has no token | Paste the Mapbox token into the map's form. Everything else works without the map. |

## Backup video (record Saturday night)

Record the 2-minute script above as one take, with sound, on a phone screen recorder (or OBS on a laptop):

1. Use the **deployed HTTPS site**, so the camera and GPS work on a phone.
2. Include **one real outdoor walk** with "Use my location", showing the trail blooming as you actually walk. Judges can't see this indoors.
3. Upload it to Google Drive and link it in the Devpost and the deck. Devpost asks for a Drive link to a PDF deck too.

## Talking points for Q&A

- **"Doesn't the AI make up facts?"** No. Agents only say what Wikipedia and OpenStreetMap return, and every postcard links to its source.
- **"Isn't buying eggs gambling?"** Eggs come **only from walking**, never from Nessie money.
- **"Is the fare real?"** It's an estimate: base fare, per mile, per minute and an $8 minimum. Uber has no public pricing API.
- **"How's the Grok key protected?"** It lives on our server. The browser can't send its own prompts, and there are per-IP and daily limits.
- **"Real space data?"** Rare eggs are tied to live ISS position data and its real visibility footprint.
