# Screenshot assets

Real Expo Go captures live in `docs/presentation/app_images/`. The deck embeds them (no stock UI).

| File | Used on | Why |
|---|---|---|
| `295D7A3E-….jpg` | Slides 3 and 4 | Full phone: Bailey Hall, pick a squad pet, Walk there 161 m |
| `ED702DFD-….jpg` | Slide 4 | League-up Gold III + Practice walk (crop; no phone frame) |
| `C2EA70B0-….jpg` | Slide 6 | Egg hatching overlay |
| `0B82DD1F-….jpg` | Slide 6 | Meet Mochi rare Storyteller |
| `D8BE4252-….jpg` | Slide 6 | Full phone: Captured! Nova holds Bailey Hall |
| `344642B2-….jpg` | unused | Battle vs Hazel — readable on a phone, too busy at deck size |

Rebuild after swapping files:

```powershell
$env:NODE_PATH = "$env:TEMP\hp-pptx\node_modules"
node docs/presentation/build.mjs
```
