// Turf rules (PLAN.md "Simple turf"): claim an empty landmark, or take one by
// bringing a stronger pet. No live battles, no decay. XP for holding is worked
// out from hours held whenever someone looks, so no timers are needed.
export const MAX_TURF_PER_PLAYER = 3;
export const XP_PER_HOUR_HELD = 10;
const HOUR_MS = 3_600_000;

export function hoursHeld(turf, now = Date.now()) {
  return Math.max(0, (now - Date.parse(turf.claimedAt)) / HOUR_MS);
}

export const heldXp = (turf, now) => Math.floor(hoursHeld(turf, now) * XP_PER_HOUR_HELD);

// Returns { result, message, claim? }. `claim` is the new turf record when it succeeds.
export function decideClaim({ defender, allTurf, attempt, now = Date.now() }) {
  const newClaim = {
    landmarkId: attempt.landmarkId,
    title: attempt.title,
    lat: attempt.lat,
    lon: attempt.lon,
    ownerId: attempt.playerId,
    ownerName: attempt.playerName,
    pet: attempt.pet,
    claimedAt: new Date(now).toISOString(),
  };

  if (defender?.ownerId === attempt.playerId) {
    // Swapping in a different pet keeps the original claim time (and its XP).
    return { result: "reinforced", message: `${attempt.pet.name} now guards ${attempt.title}.`, claim: { ...newClaim, claimedAt: defender.claimedAt } };
  }

  const held = allTurf.filter((t) => t.ownerId === attempt.playerId).length;
  if (held >= MAX_TURF_PER_PLAYER) {
    return { result: "capped", message: `You already guard ${MAX_TURF_PER_PLAYER} landmarks. That's the limit, so explore and let others have a turn!` };
  }

  if (!defender) {
    return { result: "claimed", message: `${attempt.title} is yours! ${attempt.pet.name} is standing guard.`, claim: newClaim };
  }

  if (attempt.pet.power > defender.pet.power) {
    return {
      result: "captured",
      message: `${attempt.pet.name} (power ${attempt.pet.power}) beat ${defender.ownerName}'s ${defender.pet.name} (power ${defender.pet.power}). ${attempt.title} is yours!`,
      claim: newClaim,
      previousOwner: defender.ownerName,
    };
  }

  return {
    result: "defended",
    message: `${defender.ownerName}'s ${defender.pet.name} (power ${defender.pet.power}) held ${attempt.title}. Your ${attempt.pet.name} has power ${attempt.pet.power}. Walk more to level up!`,
  };
}
