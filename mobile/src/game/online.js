import { CAPTURE_RADIUS_M } from "../core/config.js";
import { distanceMeters } from "../core/geo.js";
import { petPower } from "../core/pets.js";
import { xpBoostFor } from "../core/rank.js";
import { claimTurf, fetchLeaderboard, fetchTurf, submitScore } from "../api.js";
import { scoreOf } from "./state.js";

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

  async function claimLandmark(landmarkId) {
    const state = get();
    const place = state.found.find((p) => String(p.id) === String(landmarkId)) ?? state.capturable;
    if (!place) {
      say("Walk to a landmark first.");
      return;
    }
    if (distanceMeters(state.position, place) > CAPTURE_RADIUS_M) {
      say("Get closer to the landmark to leave a pet on guard.");
      return;
    }
    const pet = state.pets.find((p) => p.id === state.activePetId) ?? state.pets[0];
    if (!pet) {
      say("Hatch a pet first: eggs come from walking.");
      return;
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
        rarity: pet.rarity,
        petClass: pet.petClass,
        color: pet.color,
        spaceBorn: pet.spaceBorn,
        power: petPower(pet, state.progress.walked),
        art: pet.art,
      },
    });
    if (!data) {
      say("Couldn't reach the turf server. Try again in a moment.");
      return;
    }
    say(data.message);
    await refreshTurf();
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
