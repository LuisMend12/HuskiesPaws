// Edge cases and invariants that the happy-path suite does not cover.
import assert from "node:assert/strict";
import { test } from "node:test";
import { distanceMeters, hashString, interpolate, pathLength, walkingMinutes } from "../geo.js";
import { MAX_EGGS, maybeNewEgg } from "../pets.js";
import { activeTrail, rankFor, scoreFor, stepsFromMeters, xpBoostFor } from "../rank.js";
import { formatDollars, totalSaved, treeStage } from "../savings.js";
import { migrateSaved } from "../../mobile/src/game/state.js";
import { STEP_LENGTH_M } from "../config.js";

test("geo: same point is 0 m; empty path is 0; interpolation endpoints", () => {
  const a = { lat: 42.45, lon: -76.48 };
  assert.equal(distanceMeters(a, a), 0);
  assert.equal(pathLength([]), 0);
  assert.equal(pathLength([a]), 0);
  const b = { lat: 42.46, lon: -76.48 };
  assert.deepEqual(interpolate(a, b, 0), a);
  assert.deepEqual(interpolate(a, b, 1), b);
  assert.equal(hashString(""), 0);
  assert.equal(hashString("Bailey"), hashString("Bailey"));
});

test("walkingMinutes is 0 for no distance and never negative", () => {
  assert.equal(walkingMinutes(0, 1.3), 0);
  assert.equal(walkingMinutes(-10, 1.3), 0);
  assert.ok(walkingMinutes(5000, 1.3) >= 1);
});

test("rank and tree progress stay in 0..1 for out-of-range scores", () => {
  assert.equal(rankFor(-50).current.name, "Bronze III");
  assert.equal(rankFor(-50).progress, 0);
  assert.equal(rankFor(1e9).progress, 1);
  assert.equal(treeStage(-8).current.name, "Seed");
  assert.equal(treeStage(-8).progress, 0);
  assert.equal(treeStage(1e9).progress, 1);
});

test("score and boost helpers do not explode on junk input", () => {
  assert.equal(scoreFor({ steps: 0, landmarksFound: 0, landmarksCaptured: 0 }), 0);
  assert.equal(xpBoostFor(-2), 1);
  assert.equal(xpBoostFor(99), 1.3);
  assert.equal(stepsFromMeters(0), 0);
  assert.equal(stepsFromMeters(STEP_LENGTH_M), 1);
  assert.equal(activeTrail(0, "no-such-trail").id, "sprouts");
  assert.equal(totalSaved([]), 0);
  assert.equal(formatDollars(8), "$8.00");
});

test("maybeNewEgg never hands out an egg while you already carry one", () => {
  const carrying = { id: "egg-1", startWalked: 0, tier: "short" };
  assert.equal(maybeNewEgg({ egg: carrying, eggsReceived: 0, steps: 10_000, walked: 0 }), null);
  assert.equal(MAX_EGGS, 5);
  let eggs = [];
  let eggsReceived = 0;
  for (let i = 0; i < 12; i += 1) {
    const full = eggs.length >= MAX_EGGS ? eggs[0] : null;
    const egg = maybeNewEgg({ egg: full, eggsReceived, steps: 400 * 20, walked: 0 });
    if (egg) {
      eggs = [...eggs, egg];
      eggsReceived += 1;
    }
  }
  assert.equal(eggs.length, MAX_EGGS);
  assert.equal(eggsReceived, MAX_EGGS);
});

test("migrateSaved keeps server bank handles and drops legacy checking ids", async () => {
  const kept = migrateSaved({
    progress: { walked: 0, steps: 0, landmarksFound: 0, landmarksCaptured: 0 },
    bank: { savingsId: "sav-1" },
    pets: [],
    player: { id: "p-abc123", name: "Luis" },
  });
  assert.deepEqual(kept.bank, { savingsId: "sav-1" });
  assert.equal(kept.pets.length, 3, "empty pet list is restored to starters");
  assert.equal(kept.player.id, "p-abc123");

  const wiped = migrateSaved({
    progress: { walked: 1, steps: 10, landmarksFound: 0, landmarksCaptured: 0 },
    bank: { checkingId: "legacy", savingsId: "sav-1" },
    player: { id: "p-abc123", name: "Luis" },
  });
  assert.equal(wiped.bank, null);
  assert.equal(wiped.progress.walkXp, 1, "old saves without walkXp derive it from steps");
});
