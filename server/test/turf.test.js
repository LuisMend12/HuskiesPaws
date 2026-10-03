import assert from "node:assert/strict";
import { test } from "node:test";
import { currentHp, decideClaim, isAlive, maxHpOf } from "../src/turf.js";

const hour = 3_600_000;
const pet = (power, extras = {}) => ({
  id: "pet-000001", name: "Biscuit", rarity: "rare", petClass: "Guardian", power, color: "mint", ...extras,
});
const attempt = (playerId, power, extras = {}) => ({
  playerId,
  playerName: playerId,
  landmarkId: "L1",
  title: "Bailey Hall",
  lat: 42.45,
  lon: -76.48,
  pet: pet(power, extras),
});

test("HP starts at pet power and decays over hours", () => {
  const claimedAt = new Date(0).toISOString();
  const turf = { claimedAt, maxHp: 30, pet: pet(30) };
  assert.equal(maxHpOf(pet(30)), 30);
  assert.equal(currentHp(turf, 0), 30);
  assert.equal(currentHp(turf, hour), 20);
  assert.equal(currentHp(turf, 3 * hour), 0);
  assert.equal(isAlive(turf, 3 * hour), false);
});

test("a dead guard leaves the landmark free", () => {
  const now = 4 * hour;
  const defender = {
    landmarkId: "L1",
    ownerId: "player-owner1",
    ownerName: "Olivia",
    claimedAt: new Date(0).toISOString(),
    maxHp: 30,
    pet: pet(30),
  };
  const outcome = decideClaim({ defender, allTurf: [defender], attempt: attempt("player-rival1", 10), now });
  assert.equal(outcome.result, "claimed");
  assert.equal(outcome.claim.maxHp, 10);
  assert.equal(outcome.claim.pet.color, "mint");
});

test("the owner walking back refills HP", () => {
  const now = hour;
  const defender = {
    landmarkId: "L1",
    ownerId: "player-owner1",
    ownerName: "Olivia",
    claimedAt: new Date(0).toISOString(),
    maxHp: 30,
    pet: pet(30),
  };
  const outcome = decideClaim({ defender, allTurf: [defender], attempt: attempt("player-owner1", 30), now });
  assert.equal(outcome.result, "reinforced");
  assert.equal(outcome.claim.claimedAt, new Date(now).toISOString());
  assert.equal(currentHp(outcome.claim, now), 30);
});
