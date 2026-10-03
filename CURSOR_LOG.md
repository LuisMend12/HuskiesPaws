# Cursor log

Key prompts and implementation decisions for the SpaceX / Cursor track.

## 2026-10-03 — Stylized iOS 3D garden map (`3d-map`)

**Prompt (summary).** Build a tilted, playful geographic 3D map for the iOS Expo app, inspired by location-based games like Pikmin Bloom, without copying Niantic assets. Prefer OSM vector tiles + MapLibre if Expo SDK 57 allows it. Keep Android and Expo Go on the existing map. Do not add a web app. Do not edit `mobile/src/core/`.

**Decisions.**

- Renderer: `@maplibre/maplibre-react-native` **11.4.1** (New Architecture only; matches Expo SDK 57 / RN 0.86). Official docs: not available in Expo Go; Expo config plugin + a **development build**.
- Tiles/style: **OpenFreeMap Liberty** (`https://tiles.openfreemap.org/styles/liberty`). Free, no API key, OpenMapTiles schema. The advertised `/styles/3d` URL 404s; Liberty already includes a `building-3d` fill-extrusion layer. Colors are recast in `mobile/src/map/gardenStyle.js` (soft green land, parks, pale roads, blue water, quieter labels). Attribution via MapLibre + a caption (OSM / OpenMapTiles / OpenFreeMap).
- Fallback: `react-native-maps` Apple Maps on iOS in Expo Go, Google Maps on Android. This is a tilted platform map, not a custom stylized 3D renderer.
- MapLibre is imported only after `canUseNativeMapLibre()` (iOS and not Expo Go), via a dynamic `import()` in `GardenMapGate.js`, so Expo Go does not load the native module.
- Camera: pitch ~56°, follow the player until a manual pan (`userInteraction` on `onRegionDidChange`). Recenter re-enables follow. Route preview / expeditions pull the camera back once.
- Toggle: iOS development builds get **🌿 Garden** / **🗺️ Map**. Preference saved as `wanderlings:mapRenderer`.
- iOS bundle id `com.huskiespaws.app`. `expo-dev-client` + `eas.json` development profiles for device/simulator builds. Windows cannot run `expo run:ios` locally; use EAS or a Mac.
- No Unity, no paid tile keys, no secrets in the bundle.

## 2026-10-03 — Garden map on `presentation`

The MapLibre/OpenFreeMap garden map was already in `presentation` (commit `039584b`). Setup on this branch: `scheme` `huskiespaws`, Android package `com.huskiespaws.app`, `expo-dev-client` plugin, tighter Expo Go detection. EAS iOS device build still needs `eas login` and a paid Apple Developer account — this Windows machine cannot compile iOS locally.



Backend pets/turf/leaderboards and branding were implemented on other branches (`backend`, branding merge on `main`). This log file was created on `3d-map` because `origin/main` did not include it yet.
