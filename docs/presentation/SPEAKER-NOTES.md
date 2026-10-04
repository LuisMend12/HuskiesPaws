# HuskiesPaws — 3-minute speaker notes

Judging table is often **2 minutes pitch + 2 minutes Q&A**. These notes fill **~3.5 minutes**; skip slide 6 detail if you are short.

## Slide 1 — Title (~25s)

We are **HuskiesPaws**. Everyday walks become a creature-collecting adventure. Team: **Luis Mendez** and **Abdullah Rashid**. BigRed//Hacks 2026, Navigation. The product is the **phone app**.

## Slide 2 — Problem (~25s)

Typical navigation is shortest path, then put the phone away. Campus is full of named places with real stories. Walking is already happening; discovery and progress are not. No fake statistics.

## Slide 3 — Solution (~30s)

Loop: **Explore → Walk → Discover → Collect**. Pip scouts with Wikipedia and OpenStreetMap. Fern starts the walk. Moss tells the grounded story. Capture and eggs reward the walk. Point at the Bailey Hall screenshot: a real campus place, pick a pet, Walk there.

## Slide 4 — Live demo (keep this slide up)

**Demo Walk on.** Say walks are simulated at the table. Keep the Gold III / Bailey Hall screenshots up while they hold the phone.

1. Squad → Pip → Explore (league-up toast)  
2. Choose Bailey Hall  
3. Start the 161 m walk — trail blooms  
4. Capture the landmark  

If Grok is slow, keep going (on-device speech and drawn art). Hide the Expo tools button.

## Slide 5 — How we built it (~25s)

Expo phone app → Node `/api` (secrets stay on the server) → Wikipedia, OSM, optional Grok/ElevenLabs. Text path: iMessage ↔ Photon Spectrum ↔ Node.js companion ↔ shared backend (`core/` and `/api`). Scout, Storyteller, and Pathfinder are roles. Built in Cursor. Do not claim Render is live unless `/api/health` is green.

## Slide 6 — iMessage (~25s)

Photon extends HuskiesPaws into iMessage. Players can interact with the squad by text, and walking updates connect the mobile adventure back to the conversation.

Point at the real Explore screenshot (Pip, Risley). The sequence on the slide is `explore` → `take me there` → `arrived`. That sequence is tested in the companion. Milestone texts and story voice notes are implemented; do not claim live iMessage delivery was verified. The squad is role-based, not models collaborating.

## Slide 7 — What’s special (~25s)

Point at the three captures: an egg filling as you walk, Mochi (rare Storyteller) from a hatch, Nova holding Bailey Hall. Navigation is play. Walking earns creatures. ISS rare-hatch boost is in the game logic. Not claims: live Grok without a key, cloud deploy, background tracking.

## Slide 8 — Close (~25s)

Campus and hometown blocks, same loop. Next (planned): background tracking, accessibility, a deploy that stays awake, richer social play. Line: **Everyday walks. Extraordinary company.** Hand them the phone.
