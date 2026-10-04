# Demo deck

Polished 7-slide deck for BigRed//Hacks 2026 judges.

| File | Use |
|---|---|
| `HuskiesPaws-BigRedHacks-2026.pptx` | Present this |
| `HuskiesPaws-BigRedHacks-2026.pdf` | Handout / backup |
| `SPEAKER-NOTES.md` | 3-minute script |
| `build.mjs` | Rebuild the PPTX |

## Rebuild

```powershell
$env:NODE_PATH = "$env:TEMP\hp-pptx\node_modules"
node docs/presentation/build.mjs
```

Export PDF from PowerPoint: File → Export → PDF.

Slide 4 is a live-demo cue card (Demo Walk on). Use the phone for the actual screens.
