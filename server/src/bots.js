// Bot rivals (core/rivals.js) as virtual guards: whenever a bot's landmark has
// no living player guard, the bot is there at full HP. Players can beat it and
// take the landmark; if their guard's HP later runs out, the bot returns.
// Never stored, so bots can't decay away or fill the database.
import { DEMO_RIVALS } from "../../core/rivals.js";
import { isAlive } from "./turf.js";

function botRecord(rival, now) {
  return {
    ...rival,
    ownerId: `bot:${rival.ownerName}`,
    claimedAt: new Date(now).toISOString(), // full HP: decay counts from claimedAt
    maxHp: rival.pet.power,
  };
}

export function botAt(landmarkId, now = Date.now()) {
  const rival = DEMO_RIVALS.find((r) => r.landmarkId === landmarkId);
  return rival ? botRecord(rival, now) : null;
}

// Stored turf plus a bot at every bot landmark without a living guard.
export function withBots(turf, now = Date.now()) {
  const held = new Set(turf.filter((t) => isAlive(t, now)).map((t) => t.landmarkId));
  return [...turf, ...DEMO_RIVALS.filter((r) => !held.has(r.landmarkId)).map((r) => botRecord(r, now))];
}

// The defender a claim fights: the stored guard if it's alive, else the bot.
export const defenderAt = (landmarkId, stored, now = Date.now()) =>
  (stored && isAlive(stored, now) ? stored : botAt(landmarkId, now) ?? stored);
