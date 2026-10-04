import assert from "node:assert/strict";
import { test } from "node:test";
import { claimLocally, hpNow, xpBoostFromTurf } from "../src/components/landmarks.js";

const hour = 3_600_000;
const pet = { id: "pet-starter-pip", name: "Pip", rarity: "common", petClass: "Scout", color: "cinnamon", species: "husky", spaceBorn: false, art: null };

test("local claims ignore dead holdings when applying the turf cap", () => {
  const now = Date.now();
  const deadMine = (id) => ({
    landmarkId: id, title: id, lat: 42.45, lon: -76.48, mine: true, ownerName: "You",
    maxHp: 10, decaysAt: now - 5 * hour, claimedAt: new Date(now - 5 * hour).toISOString(),
    pet: { ...pet, power: 10 },
  });
  const turf = ["a", "b", "c"].map(deadMine);
  for (const t of turf) assert.equal(hpNow(t, now), 0);
  const landmark = { landmarkId: "d", title: "New Hall", lat: 42.45, lon: -76.48, guard: null };
  const state = { progress: { walked: 0 }, turf, found: [] };
  const result = claimLocally(state, landmark, pet, 12);
  assert.equal(result.result, "claimed");
  assert.equal(result.won, true);
});

test("xp boost only counts living landmarks you hold", () => {
  const now = Date.now();
  const live = { mine: true, maxHp: 20, decaysAt: now + hour, pet: { power: 20 } };
  const dead = { mine: true, maxHp: 10, decaysAt: now - 5 * hour, pet: { power: 10 } };
  const rival = { mine: false, maxHp: 20, decaysAt: now + hour, pet: { power: 20 } };
  assert.equal(xpBoostFromTurf([live, dead, rival]), 1.1);
});
