// Landmarks on the map and the claim rules for the landmark screen.
// Until the backend has game.claimTurf (docs/HANDOFF-backend.md), claims are
// worked out here with the same rules as server/src/turf.js decideClaim().
import { distanceMeters } from "../core/geo.js";
import { petsView } from "./fakeData.js";

export const MAX_TURF = 3; // server/src/turf.js MAX_TURF_PER_PLAYER
export const FIGHT_RANGE_M = 150; // routes end on the nearest path, a bit off the landmark

// Every landmark to draw: places you've found plus guarded ones. guard = turf entry or null.
export function landmarksView(state) {
  const { turf } = petsView(state);
  const byId = new Map();
  for (const place of state.found) {
    byId.set(String(place.id), { landmarkId: String(place.id), title: place.title, lat: place.lat, lon: place.lon, guard: null });
  }
  for (const t of turf) {
    const free = t.maxHp && t.hp <= 0; // a guard at 0 HP has left
    byId.set(String(t.landmarkId), { landmarkId: String(t.landmarkId), title: t.title, lat: t.lat, lon: t.lon, guard: free ? null : t });
  }
  return [...byId.values()];
}

export const ringOf = (landmark) => (!landmark.guard ? "free" : landmark.guard.mine ? "mine" : "rival");

// Whether you can fight for a landmark from where you stand (demo mode: from anywhere).
export function reachOf(state, landmark) {
  const meters = Math.round(distanceMeters(state.position, landmark));
  return { meters, inRange: state.demoMode || meters <= FIGHT_RANGE_M };
}

// Same outcomes as the server: reinforced, capped, claimed, captured, defended.
// Returns { result, won, message, turf } where turf is the updated list (or null).
export function claimLocally(state, landmark, pet, power) {
  const { turf } = petsView(state);
  const defender = landmark.guard;
  const guardPet = { id: pet.id, name: pet.name, species: pet.species, rarity: pet.rarity, petClass: pet.petClass, color: pet.color, spaceBorn: pet.spaceBorn, power, art: pet.art ?? null };
  const claim = {
    landmarkId: landmark.landmarkId, title: landmark.title, lat: landmark.lat, lon: landmark.lon,
    ownerName: "You", mine: true, hp: 100, maxHp: 100, claimedAt: new Date().toISOString(), pet: guardPet,
  };
  const replace = (entry) => [...turf.filter((t) => String(t.landmarkId) !== landmark.landmarkId), entry];

  if (defender?.mine) {
    return { result: "reinforced", won: true, message: `${pet.name} now guards ${landmark.title}.`, turf: replace({ ...claim, claimedAt: defender.claimedAt }) };
  }
  if (turf.filter((t) => t.mine).length >= MAX_TURF) {
    return { result: "capped", won: false, message: `You already guard ${MAX_TURF} landmarks. That's the limit, so explore and let others have a turn!`, turf: null };
  }
  if (!defender) {
    return { result: "claimed", won: true, message: `${landmark.title} is yours! ${pet.name} is standing guard.`, turf: replace(claim) };
  }
  if (power > defender.pet.power) {
    return {
      result: "captured", won: true, turf: replace(claim),
      message: `${pet.name} (power ${power}) beat ${defender.ownerName}'s ${defender.pet.name} (power ${defender.pet.power}). ${landmark.title} is yours!`,
    };
  }
  return {
    result: "defended", won: false, turf: null,
    message: `${defender.ownerName}'s ${defender.pet.name} (power ${defender.pet.power}) held ${landmark.title}. Your ${pet.name} has power ${power}. Walk more to level up!`,
  };
}
