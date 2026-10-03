import { distanceMeters } from "../core/geo.js";
import { petPower } from "../core/pets.js";
import { xpBoostFor } from "../core/rank.js";
import { claimTurf, fetchLeaderboard, fetchTurf, submitScore } from "../api.js";
import { scoreOf } from "./state.js";

const FIGHT_RANGE_M = 150; // same as the landmark screen (components/landmarks.js)
const WINS = ["claimed", "captured", "reinforced"];

export function createOnline({ get, set, persist, say }) {
  let lastSubmitted = null;

  const player = () => get().player;

  function applyTurf(list) {
    const turf = list ?? [];
    set({ turf, xpBoost: xpBoostFor(turf.filter((t) => t.mine).length) });
  }

  async function refreshTurf() {
    const data = await fetchTurf(player().id);
    if (!data?.turf) return;
    applyTurf(data.turf);
  }

  async function refreshLeaderboard() {
    const state = get();
    const scope = state.scope;
    const region = state.region[scope];
    const data = await fetchLeaderboard({ scope, region, me: player().id });
    if (!data?.players) {
      set({ leaderboard: null });
      return;
    }
    set({ leaderboard: { scope, rows: data.players } });
  }

  async function pushScore() {
    const state = get();
    const me = player();
    if (!me?.id) return;
    const score = scoreOf(state);
    const key = `${score}|${me.name}|${state.region.local}`;
    if (key === lastSubmitted) return;
    const saved = await submitScore({ playerId: me.id, name: me.name, score, region: state.region });
    if (!saved) return;
    lastSubmitted = key;
    await refreshLeaderboard();
  }

  // Leaves a squad pet on guard, or challenges the guard. Returns
  // { result, won, message } for the landmark screen's battle, or null when the
  // server can't be reached (the screen then uses its local rules).
  // landmark: { title, lat, lon } when it isn't one of your found places (a rival's turf).
  async function claimLandmark(landmarkId, petId, landmark = null) {
    const state = get();
    const place = state.found.find((p) => String(p.id) === String(landmarkId)) ?? (landmark && { id: landmarkId, ...landmark });
    if (!place) {
      say("Walk to a landmark first.");
      return null;
    }
    if (distanceMeters(state.position, place) > FIGHT_RANGE_M) {
      say("Get closer to the landmark to leave a pet on guard.");
      return null;
    }
    const pet = state.pets.find((p) => p.id === petId) ?? state.pets.find((p) => p.id === state.squad?.[0]);
    if (!pet) {
      say("Hatch a pet first: eggs come from walking.");
      return null;
    }
    const me = player();
    const data = await claimTurf({
      playerId: me.id,
      playerName: me.name,
      landmarkId: String(place.id),
      title: place.title,
      lat: place.lat,
      lon: place.lon,
      pet: {
        id: pet.id,
        name: pet.name,
        species: pet.species,
        rarity: pet.rarity,
        petClass: pet.petClass,
        color: pet.color,
        spaceBorn: pet.spaceBorn,
        power: petPower(pet, state.progress.walked),
        art: pet.art,
      },
    });
    if (!data) return null;
    await refreshTurf();
    return { result: data.result, won: data.won ?? WINS.includes(data.result), message: data.message };
  }

  function rename(name) {
    const clean = name.trim().slice(0, 24);
    if (!clean) return false;
    set({ player: { ...player(), name: clean } });
    persist();
    lastSubmitted = null;
    return true;
  }

  return { refreshTurf, refreshLeaderboard, pushScore, claimLandmark, rename };
}
