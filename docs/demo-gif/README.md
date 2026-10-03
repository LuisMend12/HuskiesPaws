# HuskiesPaws paw-trail GIF

10-second looping promo made with [OneTake](https://github.com/feitangyuan/onetake).
The paw follows a flower trail, discovers a landmark, and carries into the app logo.
This is a symbolic promo, not a recording of the mobile interface. It uses the app's
palette, Nunito fonts, and existing logo. No reference film or audio was supplied.

- `huskiespaws.gif`: shareable 960 × 540, 15 fps loop.
- `huskiespaws.mp4`: 1920 × 1080, 30 fps source with shutter motion blur.
- `comp.html`: deterministic composition; open with `?play` to preview.
- `gif-check.png`: contact sheet sampled from the actual GIF.

The user chose the paw trail over a garden camera zoom or a walking-to-hatching
chain reaction. The look follows the product palette, on a soft background.

| Time | Beat | Carry |
|---|---|---|
| 0–1.1 s | Opening hold | Paw at the route start |
| 1.1–4.2 s | Walk and bloom | Moving paw reveals the flower trail |
| 4.2–4.5 s | Discovery snap | Arrival reveals the landmark label |
| 4.5–5.7 s | Discovery hold | Paw rests at the destination |
| 5.7–6.5 s | Logo landing | Same paw badge travels into the brand lockup |
| 6.5–9.2 s | Brand hold | Logo and tagline |
| 9.2–10 s | Loop return | Opening frame fades back in |

Render: `python docs/demo-gif/render.py`. Verify: append `--verify`.
Requires OneTake in `~/.agents/skills/onetake`, Python Playwright with Chromium,
numpy, scipy, Pillow, matplotlib, imageio-ffmpeg, and installed mobile dependencies
for the fonts. The generator uses FFmpeg video headers in place of ffprobe.

OneTake verification passed cadence, rest, motion blur, and framing. Burst is an
advisory warning for this continuous concept. Automatic continuity detected zero
discrete boundaries; the contact sheet was inspected for the visible paw carry.

`motion.js` is from OneTake by Patrick under **PolyForm Noncommercial 1.0.0**;
see `ONETAKE-LICENSE`. Created for the noncommercial hackathon project.
