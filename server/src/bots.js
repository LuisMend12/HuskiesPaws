// Bot rivals (core/rivals.js) as virtual guards: whenever a bot's landmark has
// no living player guard, the bot is there at full HP. Players can beat it and
// take the landmark; if their guard's HP later runs out, the bot returns.
// Never stored, so bots can't decay away or fill the database.
import { SCOPES, demoPlayers } from "../../core/leaderboard.js";
import { DEMO_RIVALS } from "../../core/rivals.js";
import { HP_DECAY_PER_HOUR, isAlive } from "./turf.js";

const HOUR_MS = 3_600_000;
// Bots look worn: each keeps this share of its HP (fixed per bot, same for everyone).
const BOT_HP_SHARE = [0.8, 0.45, 0.2, 0.65, 0.9, 0.3, 1, 0.55];

function botRecord(rival, now) {
  const maxHp = rival.pet.power;
  const share = BOT_HP_SHARE[DEMO_RIVALS.indexOf(rival) % BOT_HP_SHARE.length];
  // HP is maxHp minus decay since claimedAt, so back-date claimedAt to show the share.
  const lostHours = ((1 - share) * maxHp) / HP_DECAY_PER_HOUR;
  return {
    ...rival,
    ownerId: `bot:${rival.ownerName}`,
    claimedAt: new Date(now - lostHours * HOUR_MS).toISOString(),
    maxHp,
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

// Real players ranked together with the sample players (core/leaderboard.js),
// so a new region's board isn't empty. Your own row is added if you're not in the top.
export function boardWithBots(players, { scope, region, me, limit }) {
  const scopeInfo = SCOPES.find((s) => s.id === scope);
  const bots = scopeInfo ? demoPlayers(scopeInfo, region).map((p) => ({ id: p.id, name: p.name, score: p.score })) : [];
  const ranked = [...players, ...bots]
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ position: i + 1, name: p.name, score: p.score, isYou: Boolean(me) && p.id === me }));
  const top = ranked.slice(0, limit);
  const mine = ranked.find((p) => p.isYou);
  return mine && !top.includes(mine) ? [...top, mine] : top;
}
