# Demo deck

| File | Use |
|---|---|
| `HuskiesPaws-BigRedHacks-2026.pptx` | Present this |
| `HuskiesPaws-BigRedHacks-2026.pdf` | Backup / handout |
| `SPEAKER-NOTES.md` | ~3 minute script |
| `SCREENSHOTS.md` | Missing device captures |
| `build.mjs` | Rebuild |

```powershell
$env:NODE_PATH = "$env:TEMP\hp-pptx\node_modules"
node docs/presentation/assets/render-art.mjs
node docs/presentation/build.mjs
```
