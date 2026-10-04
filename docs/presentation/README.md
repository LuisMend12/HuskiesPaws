# Demo deck

Polished 7-slide deck for BigRed//Hacks 2026 judges.

| File | Use |
|---|---|
| `HuskiesPaws-BigRedHacks-2026.pptx` | Present this |
| `HuskiesPaws-BigRedHacks-2026.pdf` | Handout / backup |
| `SPEAKER-NOTES.md` | 3-minute script |
| `SCREENSHOTS.md` | Replace slide 4 placeholders |
| `build.mjs` | Rebuild the PPTX |

## Rebuild

From the repo root, after `pptxgenjs` is installed somewhere Node can see it:

```powershell
python docs/presentation/placeholders.py
$env:NODE_PATH = "$env:TEMP\hp-pptx\node_modules"
node docs/presentation/build.mjs
```

Export PDF from PowerPoint: File → Export → PDF.

Slide 4 uses labeled placeholders until you capture the three Expo Go screens in `SCREENSHOTS.md` and point `build.mjs` at those PNGs.
