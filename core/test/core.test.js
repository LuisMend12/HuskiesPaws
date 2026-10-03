// Unit tests for the shared game logic (no network, no DOM).
import assert from "node:assert/strict";
import { test } from "node:test";
import { choosePlace, firstSentences } from "../agents.js";
import { SCOPES, buildLeaderboard, demoPlayers, topWithYou } from "../leaderboard.js";
import {
  EGG_EVERY_STEPS, HATCH_METERS, LEVEL_EVERY_M, MAX_LEVEL, RARITIES,
  eggProgress, eggsEarned, hatchEgg, maybeNewEgg, metersToHatch, petLevel, petPower, rollRarity, stepsToNextEgg,
} from "../pets.js";
import { TRAILS, activeTrail, rankFor, scoreFor } from "../rank.js";
import { MIN_TRIP_M, estimateRideFare, totalSaved, treeStage } from "../savings.js";

// Deterministic "random" that walks through a list of values.
const sequence = (...values) => {
  let i = 0;
  return () => values[i++ % values.length];
};

test("eggs are earned every EGG_EVERY_STEPS steps, one at a time", () => {
  assert.equal(eggsEarned(EGG_EVERY_STEPS - 1), 0);
  assert.equal(eggsEarned(EGG_EVERY_STEPS * 2), 2);
  assert.equal(stepsToNextEgg(EGG_EVERY_STEPS - 1), 1);
  assert.equal(maybeNewEgg({ egg: null, eggsReceived: 0, steps: 10, walked: 0 }), null, "not earned yet");
  const egg = maybeNewEgg({ egg: null, eggsReceived: 0, steps: EGG_EVERY_STEPS, walked: 123 });
  assert.equal(egg.startWalked, 123);
  assert.equal(maybeNewEgg({ egg, eggsReceived: 1, steps: EGG_EVERY_STEPS * 5, walked: 200 }), null, "already carrying one");
  assert.equal(maybeNewEgg({ egg: null, eggsReceived: 1, steps: EGG_EVERY_STEPS, walked: 200 }), null, "already received it");
});

test("eggs hatch after walking HATCH_METERS", () => {
  const egg = { id: "egg-1", startWalked: 100 };
  assert.equal(eggProgress(egg, 100), 0);
  assert.equal(eggProgress(egg, 100 + HATCH_METERS / 2), 0.5);
  assert.equal(eggProgress(egg, 100 + HATCH_METERS * 3), 1);
  assert.equal(metersToHatch(egg, 100 + HATCH_METERS - 10), 10);
});

test("rarity roll follows the weights", () => {
  assert.equal(rollRarity(() => 0).id, "common");
  assert.equal(rollRarity(() => 0.61).id, "rare");
  assert.equal(rollRarity(() => 0.86).id, "epic");
  assert.equal(rollRarity(() => 0.999).id, "legendary");
  assert.equal(RARITIES.reduce((s, r) => s + r.weight, 0), 100);
});

test("hatched pets get power in their rarity's range and level up by walking", () => {
  const pet = hatchEgg({ id: "egg-1", startWalked: 0 }, 500, sequence(0.999, 0, 0, 0, 0.5, 0.5));
  assert.equal(pet.rarity, "legendary");
  assert.ok(pet.basePower >= 55 && pet.basePower <= 80);
  assert.match(pet.id, /^pet-[a-z0-9]{10}$/, "matches the server's id format");
  assert.equal(petLevel(pet, 500), 1);
  assert.equal(petLevel(pet, 500 + LEVEL_EVERY_M), 2);
  assert.equal(petLevel(pet, 500 + LEVEL_EVERY_M * 100), MAX_LEVEL);
  assert.equal(petPower(pet, 500 + LEVEL_EVERY_M), pet.basePower + 4);
});

test("score counts steps, landmarks, captures and turf bonus", () => {
  assert.equal(scoreFor({ steps: 100, landmarksFound: 1, landmarksCaptured: 1 }), 160);
  assert.equal(scoreFor({ steps: 100, landmarksFound: 1, landmarksCaptured: 1, bonusPoints: 40 }), 200);
  assert.equal(rankFor(0).current.name, "Bronze III");
  assert.equal(rankFor(100).current.name, "Bronze II");
  assert.equal(rankFor(300).current.name, "Silver III");
  assert.equal(rankFor(5000).current.name, "Crystal I");
  assert.equal(rankFor(5000).next, null);
  assert.equal(activeTrail(150, "starlight").id, "sprouts", "locked trail falls back");
  assert.equal(activeTrail(900, "meadow").id, "meadow", "an unlocked trail can be chosen");
  assert.equal(TRAILS.length, 5);
});

test("savings: fares, totals and tree stages", () => {
  assert.equal(estimateRideFare(MIN_TRIP_M - 1), null);
  assert.equal(estimateRideFare(MIN_TRIP_M), 8);
  assert.equal(estimateRideFare(5 * 1609.34), 18.5);
  assert.equal(totalSaved([{ amount: 8 }, { amount: 0.1 }, { amount: 0.2 }]), 8.3);
  assert.equal(treeStage(8).current.name, "Sprout");
});

test("choosePlace honors minDistance and visited places", () => {
  const here = { lat: 42.45, lon: -76.4816 };
  const places = [
    { id: 1, title: "Close", lat: 42.4502, lon: -76.4816 }, // ~22 m
    { id: 2, title: "Mid", lat: 42.4520, lon: -76.4816 }, // ~222 m
    { id: 3, title: "Far", lat: 42.4540, lon: -76.4816 }, // ~445 m
  ];
  assert.equal(choosePlace(places, here, new Set(), { random: () => 0 }).id, 2, "skips places under 60 m");
  assert.equal(choosePlace(places, here, new Set(), { random: () => 0, minDistance: 300 }).id, 3);
  assert.equal(choosePlace(places, here, new Set([2, 3])), null);
  assert.equal(firstSentences("A b. C d! E f?", 2), "A b. C d!");
});

test("leaderboard sample data is stable and includes you", () => {
  const scope = SCOPES[0];
  assert.deepEqual(demoPlayers(scope, "Ithaca"), demoPlayers(scope, "Ithaca"));
  const rows = topWithYou(buildLeaderboard(demoPlayers(scope, "Ithaca"), { id: "you", name: "You", score: 0 }), 10);
  assert.ok(rows.at(-1).isYou);
});

test("ISS overhead triples the odds of non-common pets", async () => {
  const { ISS_RARITY_BOOST, issIsOverhead } = await import("../pets.js");
  const { distanceMeters } = await import("../geo.js");
  // Normal weights: common 60 / 100. Boosted: 60 / (60 + 40 * 3) = 1/3 common.
  assert.equal(rollRarity(() => 0.5).id, "common");
  assert.equal(rollRarity(() => 0.5, { issOverhead: true }).id, "rare", "0.5 lands past common when boosted");
  assert.equal(ISS_RARITY_BOOST, 3);
  const ithaca = { lat: 42.45, lon: -76.48 };
  assert.equal(issIsOverhead({ lat: 43, lon: -77, footprintKm: 4500 }, ithaca, distanceMeters), true);
  assert.equal(issIsOverhead({ lat: -30, lon: 100, footprintKm: 4500 }, ithaca, distanceMeters), false);
  assert.equal(issIsOverhead(null, ithaca, distanceMeters), false);
  const pet = hatchEgg({ id: "egg-1", startWalked: 0 }, 0, () => 0.5, { issOverhead: true });
  assert.equal(pet.spaceBorn, true);
});
