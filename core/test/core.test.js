// Unit tests for the shared game logic (no network, no DOM).
import assert from "node:assert/strict";
import { test } from "node:test";
import { STORY_MAX_CHARS, choosePlace, firstSentences, storyMemo } from "../agents.js";
import { SCOPES, buildLeaderboard, demoPlayers, topWithYou } from "../leaderboard.js";
import {
  EGG_EVERY_STEPS, HATCH_METERS, LEVEL_EVERY_M, MAX_LEVEL, RARITIES,
  EGG_TIERS, PET_SPECIES, eggProgress, eggsEarned, hatchEgg, hatchMetersOf, maybeNewEgg, metersToHatch, petLevel, petPower, rollEggTier,
  rollRarity, stepsToNextEgg,
} from "../pets.js";
import { LEAGUES, TRAILS, activeTrail, rankFor, scoreFor, xpBoostFor } from "../rank.js";
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
  assert.ok(EGG_TIERS.some((t) => t.id === egg.tier), "new eggs have a tier");
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

test("starter pets are valid common huskies", async () => {
  const { STARTER_PETS, MAX_EGGS } = await import("../pets.js");
  assert.deepEqual(STARTER_PETS.map((p) => p.name), ["Pip", "Moss", "Fern"]);
  for (const p of STARTER_PETS) assert.match(p.id, /^[A-Za-z0-9_-]{6,64}$/, "matches the server's id check");
  assert.equal(MAX_EGGS, 5);
});

test("egg tiers: longer eggs take longer and hatch rarer pets", () => {
  assert.equal(rollEggTier(() => 0).id, "short");
  assert.equal(rollEggTier(() => 0.7).id, "medium");
  assert.equal(rollEggTier(() => 0.95).id, "long");
  assert.equal(hatchMetersOf({ tier: "long" }), 1000);
  assert.equal(hatchMetersOf({}), HATCH_METERS, "older eggs without a tier");
  assert.equal(eggProgress({ startWalked: 0, tier: "medium" }, 300), 0.5);
  const [short, , long] = EGG_TIERS;
  assert.equal(rollRarity(() => 0.85, { tier: short }).id, "rare");
  assert.equal(rollRarity(() => 0.85, { tier: long }).id, "epic");
  assert.equal(rollRarity(() => 0.95, { tier: long }).id, "legendary");
  for (const tier of EGG_TIERS) assert.equal(Object.values(tier.odds).reduce((a, b) => a + b, 0), 100, tier.id);
  assert.ok(PET_SPECIES.includes(hatchEgg({ id: "egg-2", startWalked: 0, tier: "long" }, 1000).species));
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

test("score counts walking XP and captures; finds give no XP", () => {
  assert.equal(scoreFor({ steps: 100, landmarksFound: 1, landmarksCaptured: 1 }), 110);
  assert.equal(scoreFor({ steps: 100, walkXp: 15, landmarksFound: 9, landmarksCaptured: 1 }), 115);
  assert.equal(scoreFor({ steps: 100, landmarksFound: 1, landmarksCaptured: 1, bonusPoints: 40 }), 150);
  assert.equal(xpBoostFor(0), 1);
  assert.equal(xpBoostFor(3), 1.3);
  assert.equal(rankFor(0).current.name, "Bronze III");
  assert.equal(rankFor(100).current.name, "Bronze II");
  assert.equal(rankFor(100).current.division, 2);
  assert.equal(activeTrail(150, "starlight").id, "sprouts", "locked trail falls back");
  assert.equal(rankFor(300).current.name, "Silver III");
  assert.equal(rankFor(5000).current.name, "Crystal I");
  assert.equal(rankFor(5000).next, null);
  assert.equal(activeTrail(900, "meadow").id, "meadow", "an unlocked trail can be chosen");
  assert.equal(TRAILS.length, 5);
  assert.equal(LEAGUES.length, 5);
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

test("storyMemo tells up to three extract sentences in Moss's voice", () => {
  const place = { title: "Sage Chapel" };
  const memo = storyMemo(place, { extract: "One. Two! Three? Four." });
  assert.equal(
    memo,
    "Gather round, sprouts! Let me tell you about Sage Chapel. One. Two! Three? Shall we wander over and see it for ourselves?",
  );
  assert.ok(!memo.includes("Four"), "stops after three sentences");
});

test("storyMemo lets Pip and Fern tell the same facts in their own voice", () => {
  const place = { title: "Sage Chapel" };
  const summary = { extract: "One. Two!" };
  const pip = storyMemo(place, summary, "scout");
  assert.match(pip, /^Ooh, a trail tale!/);
  assert.match(pip, /Sage Chapel/);
  assert.match(pip, /One\. Two!/);
  assert.match(pip, /look around\?$/);
  const fern = storyMemo(place, summary, "pathfinder");
  assert.match(fern, /^While we walk/);
  assert.match(fern, /lead you there\.$/);
});

test("storyMemo handles a missing extract and stays under the voice limit", () => {
  const place = { title: "Sage Chapel" };
  for (const summary of [{ extract: "" }, { extract: "   " }, {}, null]) {
    const memo = storyMemo(place, summary);
    assert.match(memo, /Sage Chapel/);
    assert.match(memo, /see it for ourselves\?$/);
  }
  const long = `${"word ".repeat(80).trim()}. ${"more ".repeat(80).trim()}.`;
  const trimmed = storyMemo(place, { extract: long });
  assert.ok(trimmed.length <= STORY_MAX_CHARS, "drops sentences to fit");
  assert.ok(!trimmed.includes("more"), "keeps whole sentences when it can");
  const huge = storyMemo(place, { extract: `${"giant ".repeat(200).trim()}.` });
  assert.ok(huge.length <= STORY_MAX_CHARS, "clips one giant sentence");
  assert.match(huge, /\.\.\. Shall we/);
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

test("largerPhoto asks Wikimedia for a 960 px thumbnail, or uses a smaller original", async () => {
  const { largerPhoto } = await import("../services.js");
  const thumb = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Hall.jpg/320px-Hall.jpg";
  const original = "https://upload.wikimedia.org/wikipedia/commons/a/ab/Hall.jpg";
  assert.equal(largerPhoto({ thumbnail: { source: thumb }, originalimage: { source: original, width: 4000 } }), thumb.replace("/320px-", "/960px-"));
  assert.equal(largerPhoto({ thumbnail: { source: thumb }, originalimage: { source: original, width: 800 } }), original);
  assert.equal(largerPhoto({ thumbnail: { source: thumb } }), thumb);
  assert.equal(largerPhoto({}), null);
});
