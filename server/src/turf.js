// Turf rules (PLAN.md "Simple turf"): claim an empty landmark, or take one by
// bringing a stronger pet. A guard starts at maxHp and loses HP over time.
// HP is computed when someone looks, so no timers or background jobs.
export const MAX_TURF_PER_PLAYER = 3;
export const HP_DECAY_PER_HOUR = 10;
const HOUR_MS = 3_600_000;

export function hoursHeld(turf, now = Date.now()) {
  return Math.max(0, (now - Date.parse(turf.claimedAt)) / HOUR_MS);
}

export const maxHpOf = (pet) => Math.max(1, Math.floor(pet?.power ?? 1));

export function currentHp(turf, now = Date.now()) {
  const maxHp = turf.maxHp ?? maxHpOf(turf.pet);
  const lost = Math.floor(hoursHeld(turf, now) * HP_DECAY_PER_HOUR);
  return Math.max(0, maxHp - lost);
}

export const isAlive = (turf, now) => currentHp(turf, now) > 0;

function petSnapshot(pet) {
  return {
    id: pet.id,
    name: pet.name,
    rarity: pet.rarity,
    petClass: pet.petClass,
    color: pet.color ?? "snowy",
    spaceBorn: Boolean(pet.spaceBorn),
    power: pet.power,
    art: pet.art ?? null,
  };
}

function livingHeldBy(allTurf, ownerId, now) {
  return allTurf.filter((t) => t.ownerId === ownerId && isAlive(t, now)).length;
}

// Returns { result, message, claim? }. `claim` is the new turf record when it succeeds.
export function decideClaim({ defender, allTurf, attempt, now = Date.now() }) {
  const maxHp = maxHpOf(attempt.pet);
  const newClaim = {
    landmarkId: attempt.landmarkId,
    title: attempt.title,
    lat: attempt.lat,
    lon: attempt.lon,
    ownerId: attempt.playerId,
    ownerName: attempt.playerName,
    pet: petSnapshot(attempt.pet),
    claimedAt: new Date(now).toISOString(),
    maxHp,
  };

  const liveDefender = defender && isAlive(defender, now) ? defender : null;

  if (liveDefender?.ownerId === attempt.playerId) {
    // Walking back to your landmark refills HP (and can swap the guard pet).
    return {
      result: "reinforced",
      message: `${attempt.pet.name} topped up at ${attempt.title}.`,
      claim: newClaim,
    };
  }

  const held = livingHeldBy(allTurf, attempt.playerId, now);
  if (held >= MAX_TURF_PER_PLAYER) {
    return { result: "capped", message: `You already guard ${MAX_TURF_PER_PLAYER} landmarks. That's the limit, so explore and let others have a turn!` };
  }

  if (!liveDefender) {
    return { result: "claimed", message: `${attempt.title} is yours! ${attempt.pet.name} is standing guard.`, claim: newClaim };
  }

  if (attempt.pet.power > liveDefender.pet.power) {
    return {
      result: "captured",
      message: `${attempt.pet.name} (power ${attempt.pet.power}) beat ${liveDefender.ownerName}'s ${liveDefender.pet.name} (power ${liveDefender.pet.power}). ${attempt.title} is yours!`,
      claim: newClaim,
      previousOwner: liveDefender.ownerName,
    };
  }

  return {
    result: "defended",
    message: `${liveDefender.ownerName}'s ${liveDefender.pet.name} (power ${liveDefender.pet.power}) held ${attempt.title}. Your ${attempt.pet.name} has power ${attempt.pet.power}. Walk more to level up!`,
  };
}
