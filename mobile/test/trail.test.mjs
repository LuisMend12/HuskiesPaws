import assert from "node:assert/strict";
import { test } from "node:test";
import { extendTrail, trailPointCount, trimTrail } from "../src/game/trail.js";

const trail = { id: "bloom", color: "#2e9d4f" };
const at = (lat, lon) => ({ lat, lon });

test("nearby ticks do not grow the polyline", () => {
  let segments = [];
  segments = extendTrail(segments, at(42.45, -76.48), trail);
  const once = trailPointCount(segments);
  segments = extendTrail(segments, at(42.450001, -76.48), trail);
  assert.equal(trailPointCount(segments), once);
});

test("old trail points drop once the cap is hit", () => {
  const long = [{
    id: "0",
    trailId: "bloom",
    color: "#2e9d4f",
    coords: Array.from({ length: 400 }, (_, i) => ({ latitude: 42.45, longitude: -76.48 - i * 0.001 })),
  }];
  const trimmed = trimTrail(long, 240);
  assert.ok(trailPointCount(trimmed) <= 240);
  assert.equal(trimmed[0].coords.at(-1).longitude, long[0].coords.at(-1).longitude);
});
