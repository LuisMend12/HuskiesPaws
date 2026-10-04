// Landmarks on the map, pet HP, and the claim rules for the landmark screen.
// Until the backend has game.claimTurf / game.recallGuard (docs/HANDOFF-backend.md),
// claims are worked out here with the same rules as server/src/turf.js
// decideClaim(), and HP is kept in state.petHp and on each turf entry.
import { distanceMeters, hashString } from "../core/geo.js";
import { petsView } from "./fakeData.js";

export const MAX_TURF = 3; // server/src/turf.js MAX_TURF_PER_PLAYER
// Claim range and landmark spacing: with spacing > 2 x range you're only ever in
// range of one empty landmark, so you can't drop pets on several from one spot.
// 60 m still reaches a building from the footpath a "Walk there" route ends on.
export const FIGHT_RANGE_M = 60;
const LANDMARK_SPACING_M = 130; // real landmarks closer than this to another are left off
// "Bailey Hall (Ithaca, New York)" and "Bailey Hall" are the same place.
const baseName = (title) => title.replace(/\s*\(.*\)\s*$/, "").trim().toLowerCase();
export const XP_BOOST_PER_LANDMARK = 0.1;

// HP: everyone has 100. Damage from a fight stays, then heals slowly
// (guards eat from their landmark's food; pets rest). Below READY_HP a pet rests.
export const MAX_HP = 100;
export const HEAL_PER_MINUTE = 10;
export const READY_HP = 50;

// HP right now from a stored { hp, hpAt } (hpAt in ms; no hpAt = no healing).
export function hpNow(entry, now = Date.now()) {
  if (!entry) return MAX_HP;
  if (Number.isFinite(entry.decaysAt)) {
    return Math.max(0, (entry.maxHp ?? entry.pet?.power ?? MAX_HP)
      - Math.floor(Math.max(0, now - entry.decaysAt) / 3_600_000 * 10));
  }
  if (!entry.hpAt) return entry.hp ?? MAX_HP;
  return Math.min(entry.maxHp ?? MAX_HP, entry.hp + ((now - entry.hpAt) / 60000) * HEAL_PER_MINUTE);
}

export const petHpOf = (state, petId, now) => hpNow(state.petHp?.[petId], now);
export const healMinutes = (hp, target = MAX_HP) => Math.max(0, Math.ceil((target - hp) / HEAL_PER_MINUTE));

// 1 + 0.1 for each landmark you hold (max 1.3 with the cap of 3). Worked out
// from the turf list, so it matches what walking uses (state.xpBoost).
const livingMine = (t) => t.mine && hpNow(t) > 0;
export const xpBoostFromTurf = (turf) => 1 + (turf ?? []).filter(livingMine).length * XP_BOOST_PER_LANDMARK;
export const xpBoostOf = (state) => xpBoostFromTurf(state.turf);

// Which food sits at a landmark: always the same one for the same place.
export const FOODS = Object.freeze(["bag", "tuna", "treats"]);
export const foodOf = (landmarkId) => FOODS[hashString(String(landmarkId)) % FOODS.length];

// Every landmark to draw: places you've found plus guarded ones. guard = turf entry or null.
export function landmarksView(state) {
  const { turf } = petsView(state);
  const byId = new Map();
  for (const place of state.found) {
    byId.set(String(place.id), { landmarkId: String(place.id), title: place.title, lat: place.lat, lon: place.lon, photo: place.photo ?? null, guard: null });
  }
  for (const t of turf) {
    const free = t.maxHp && hpNow(t) <= 0; // a guard at 0 HP has left
    const known = byId.get(String(t.landmarkId));
    byId.set(String(t.landmarkId), {
      landmarkId: String(t.landmarkId), title: t.title, lat: t.lat, lon: t.lon, photo: known?.photo ?? t.photo ?? null, guard: free ? null : t,
    });
  }
  // Real landmarks near you, unguarded, unless that spot is already on the map
  // (same id, same name, or within LANDMARK_SPACING_M of one already shown).
  const taken = [...byId.values()];
  for (const place of state.nearbyPlaces ?? []) {
    const id = String(place.id);
    const name = baseName(place.title);
    const clash = byId.has(id) || taken.some((l) => baseName(l.title) === name || distanceMeters(l, place) < LANDMARK_SPACING_M);
    if (clash) continue;
    const landmark = { landmarkId: id, title: place.title, lat: place.lat, lon: place.lon, photo: null, guard: null };
    byId.set(id, landmark);
    taken.push(landmark);
  }
  return [...byId.values()].map((l) => ({ ...l, food: foodOf(l.landmarkId) }));
}

export const ringOf = (landmark) => (!landmark.guard ? "free" : landmark.guard.mine ? "mine" : "rival");

// You must be within FIGHT_RANGE_M to claim or fight (in demo mode, "Walk there" simulates the walk).
export function reachOf(state, landmark) {
  const meters = Math.round(distanceMeters(state.position, landmark));
  return { meters, inRange: meters <= FIGHT_RANGE_M };
}

// Same outcomes as the server: reinforced, capped, claimed, captured, defended.
// Returns { result, won, message, turf } where turf is the updated list (or null).
// guardHp: the HP the new guard starts with (after any fight).
export function claimLocally(state, landmark, pet, power, guardHp = MAX_HP) {
  const { turf } = petsView(state);
  const defender = landmark.guard;
  const guardPet = { id: pet.id, name: pet.name, species: pet.species, rarity: pet.rarity, petClass: pet.petClass, color: pet.color, spaceBorn: pet.spaceBorn, power, art: pet.art ?? null };
  const now = Date.now();
  const claim = {
    landmarkId: landmark.landmarkId, title: landmark.title, lat: landmark.lat, lon: landmark.lon,
    ownerName: "You", mine: true, hp: guardHp, maxHp: MAX_HP, hpAt: now, claimedAt: new Date(now).toISOString(), pet: guardPet,
  };
  const replace = (entry) => [...turf.filter((t) => String(t.landmarkId) !== landmark.landmarkId), entry];

  if (defender?.mine) {
    return { result: "reinforced", won: true, message: `${pet.name} now guards ${landmark.title}.`, turf: replace({ ...claim, claimedAt: defender.claimedAt }) };
  }
  if (turf.filter(livingMine).length >= MAX_TURF) {
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

// Calls a guard back: frees its landmark; the pet comes back with the HP it had.
// Returns the state patch to apply with game.set().
export function recallLocally(state, petId) {
  const turf = state.turf ?? [];
  const post = turf.find((t) => t.mine && t.pet?.id === petId);
  if (!post) return null;
  const rest = turf.filter((t) => t !== post);
  return {
    turf: rest,
    xpBoost: xpBoostFromTurf(rest),
    petHp: { ...state.petHp, [petId]: { hp: hpNow(post), hpAt: Date.now() } },
    status: `${post.pet.name} left ${post.title} and came back to your squad.`,
  };
}
