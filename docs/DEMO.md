# HuskiesPaws demo plan

Judging is **science-fair style: 4 minutes per table** (2-minute pitch, 2-minute Q&A), indoors, starting **Sunday 9:00 AM**. Finalists get 4 minutes plus 2 minutes of Q&A in Baker 200. Submit on Devpost by **8:30 AM**.

We demo **on an iPhone in Expo Go** (Android is the backup phone). The judge holds the phone for part of it if they want to.

## The 2-minute pitch

| Time | Say | Do |
|---|---|---|
| 0:00 | "How we navigate today is shortest path, alone, staring at a phone. HuskiesPaws makes walking an adventure, and it pays you to skip the ride." | App open on the tilted map: your squad of husky pups standing behind your dot |
| 0:15 | "Your squad scouts real places." | **Squad → Pip → Explore.** Pip's status turns 🧭 Exploring; his voice memo plays (**Grok Voice**) and the postcard appears with a **Grok Imagine** illustration |
| 0:35 | "Fern walks you there, and your trail blooms." | **Take me there**: the trail blooms on the map, and the pop-up says "You skipped a ~$8 ride" |
| 0:50 | "That fare moves into a savings account through **Capital One's Nessie API**, and it grows your tree." | **Savings** tab: the tree and the trip list |
| 1:05 | "Walking is your XP. You climb from Bronze to Crystal, and every league unlocks a new flower trail." | Tap the rank pill → **Ranks**: the badge, the meter, the trails |
| 1:15 | "Walking also hatches eggs. Rare pets are more likely when the **ISS is passing overhead**, using live orbital data." | **Pets** tab: the egg filling up → the **hatch reveal** (rarity flash) |
| 1:30 | "Leave a pet to guard a landmark. Each one boosts your XP, but its HP drains unless you walk back, and stronger pets can take it." | Point at the guard pets on the map (HP bars). **Claim** a landmark if turf is live |
| 1:45 | "Your squad also texts you over iMessage." | Show a text thread with Pip (Photon) |
| 1:55 | "Built in Cursor with Grok." | Done. Leave 2 minutes for questions. |

**Only say what works on the day.** If turf, live leaderboards or Grok aren't connected by the freeze, skip that line or say "next" instead of showing sample data as real. The app labels sample pets and guards as samples.

## Before judging (Sunday 8:00 AM)

- [ ] **Server awake:** open `https://…onrender.com/api/health` about 5 minutes early (Render's free tier sleeps). It should say `"grok":true`.
- [ ] **App running:** `cd mobile`, `npm run tunnel`, scan the new QR code (the address changes every run). Check the map, Squad and Pets load.
- [ ] **Hide Expo Go's blue ⚙️ button:** shake the phone → turn off **Show tools button**. It covers the rank pill.
- [ ] **Progress reset** (Ranks → Reset my progress), so the first rank-up, egg and hatch happen live. Or keep a second phone with a pet already hatched, in case time is short.
- [ ] **Pre-warm Grok Imagine:** explore a couple of places near PSB once, so their illustrations are cached and appear instantly.
- [ ] **Demo mode on** (the switch under the map): walks are simulated. There's no walking at the judging table.
- [ ] Phone volume up and **silent mode off**, phone and laptop charged, a phone hotspot ready as backup Wi-Fi.
- [ ] iMessage agent running (`imessage-agent`, `npm start`) with a thread already open.
- [ ] Backup video downloaded on the phone (not just a link).

## If something breaks

| Problem | What to do |
|---|---|
| `npm run tunnel` fails | Wait 30 s and retry. Else put the laptop on the iPhone's hotspot and run `npx expo start` (no tunnel). |
| The app shows an old version | Shake → **Reload**. If the QR code is from an earlier run, scan the new one. |
| Grok slow or failing | The app falls back on its own: phone voice and drawn art. Keep going and mention Grok in words. |
| Wi-Fi down | Switch to the hotspot. If everything is down, play the backup video. |
| Nessie unreachable | Savings still work locally ("local" next to each walk). Say the transfer is mirrored when Nessie responds. |
| Android map slow or blank | Demo on the iPhone. |

## Backup video (record Saturday night)

Record the 2-minute script above as one take, with sound, on the iPhone's screen recorder:

1. Hide Expo Go's ⚙️ button first (shake → **Show tools button** off).
2. Include **one real outdoor walk** with **📍 Go live**, showing the trail blooming and the squad following as you actually walk. Judges can't see this indoors.
3. Include a full **hatch reveal**.
4. Upload it to Google Drive and link it in the Devpost and the deck. Devpost asks for a Drive link to a PDF deck too.

## Talking points for Q&A

- **"Doesn't the AI make up facts?"** No. Agents only say what Wikipedia and OpenStreetMap return, and every postcard links to its source.
- **"Isn't buying eggs gambling?"** Eggs come **only from walking**, never from Nessie money.
- **"Can one player hold everything?"** No: three landmarks at most, each guard's HP drains unless you walk back, and guards still use a squad slot, so holding more means fewer pets with you.
- **"Is the fare real?"** It's an estimate: base fare, per mile, per minute and an $8 minimum. Uber has no public pricing API.
- **"How's the Grok key protected?"** It lives on our server. The app never has it, it can't send its own prompts, and there are per-IP and daily limits.
- **"Real space data?"** Rare eggs are tied to live ISS position data and its real visibility footprint.
- **"Why a phone app?"** A real step counter, GPS and camera, and walking is something you do with your phone in your pocket.
