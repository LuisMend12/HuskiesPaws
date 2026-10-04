// Bot rivals are virtual guards: listed when nobody holds their landmark,
// beatable through the normal claim rules, and back once a player's guard dies.
import assert from "node:assert/strict";
import { test } from "node:test";
import { DEMO_RIVALS } from "../../core/rivals.js";
import { botAt, defenderAt, withBots } from "../src/bots.js";
import { HP_DECAY_PER_HOUR, decideClaim } from "../src/turf.js";

const [uris] = DEMO_RIVALS;
const now = Date.parse("2026-10-04T12:00:00Z");
const pet = (power) => ({ id: "pet-player1", name: "Nova", rarity: "epic", petClass: "Scout", color: "rose", species: "cat", power });
const attempt = (power) => ({ playerId: "player-abcdef", playerName: "You", landmarkId: uris.landmarkId, title: uris.title, lat: uris.lat, lon: uris.lon, pet: pet(power) });

test("every bot is listed at full HP when nobody holds its landmark", () => {
  const list = withBots([], now);
  assert.equal(list.length, DEMO_RIVALS.length);
  assert.equal(botAt(uris.landmarkId, now).maxHp, uris.pet.power);
});

test("a stronger pet captures a bot landmark; a weaker one is defended", () => {
  const strong = decideClaim({ defender: defenderAt(uris.landmarkId, null, now), allTurf: [], attempt: attempt(uris.pet.power + 5), now });
  assert.equal(strong.result, "captured");
  const weak = decideClaim({ defender: defenderAt(uris.landmarkId, null, now), allTurf: [], attempt: attempt(uris.pet.power - 5), now });
  assert.equal(weak.result, "defended");
});

test("a living player guard replaces the bot; when it dies the bot returns", () => {
  const { claim } = decideClaim({ defender: defenderAt(uris.landmarkId, null, now), allTurf: [], attempt: attempt(60), now });
  const held = withBots([claim], now).filter((t) => t.landmarkId === uris.landmarkId);
  assert.equal(held.length, 1);
  assert.equal(held[0].ownerName, "You");
  const later = now + ((60 / HP_DECAY_PER_HOUR) + 1) * 3_600_000;
  const back = withBots([claim], later).filter((t) => t.landmarkId === uris.landmarkId && t.ownerId?.startsWith("bot:"));
  assert.equal(back.length, 1);
});
