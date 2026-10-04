import { distanceMeters } from "../core/geo.js";
import { petPower } from "../core/pets.js";
import { xpBoostFor } from "../core/rank.js";
import { dayFingerprint } from "../core/dayLog.js";

import { apiAvailable, claimTurf, fetchLeaderboard, fetchTurf, recallGuard, submitDayLog, submitScore } from "../api.js";
import { scoreOf } from "./state.js";
import { hpNow } from "../components/landmarks.js";

// The squad's names and classes, sent with the day log so the iMessage agent
// can call your pets by name (your Scout explores, your Storyteller tells stories).
function squadSummary(state) {
  const pets = state.pets ?? [];
  return (state.squad ?? [])
    .map((id) => pets.find((p) => p.id === id))
    .filter(Boolean)
    .slice(0, 5)
    .map((p) => ({ name: p.name, petClass: p.petClass, species: p.species ?? null }));
}

const FIGHT_RANGE_M = 60; // same as the landmark screen (components/landmarks.js)
const WINS = ["claimed", "captured", "reinforced"];

export function createOnline({ get, set, persist, say }) {
  let lastSubmitted = null;
  let lastDayStamp = null;
  let dayTimer = null;
  let turfRequest = 0;
  let boardRequest = 0;
  let scoreQueue = Promise.resolve();
  let dayQueue = Promise.resolve();
  const current = (generation) => generation === get().generation && !get().resetting;

  const player = () => get().player;

  function applyTurf(list) {
    const turf = list ?? [];
    set({ turf, xpBoost: xpBoostFor(turf.filter((t) => t.mine).length) });
  }

  async function refreshTurf() {
    if (!apiAvailable() || !player()?.id || get().resetting) return;
    const generation = get().generation;
    const request = ++turfRequest;
    const data = await fetchTurf(player().id);
    if (!current(generation) || request !== turfRequest) return;
    if (!data?.turf) { set({ xpBoost: 1 }); return; }
    const offset = Date.now() - (data.serverNow ?? Date.now());
    applyTurf(data.turf.map((t) => ({ ...t, decaysAt: Date.parse(t.claimedAt) + offset })));
  }

  function expireTurf() {
    if (!apiAvailable() || !get().turf) return;
    const now = Date.now();
    const alive = get().turf.filter((t) => !Number.isFinite(t.decaysAt) || hpNow(t, now) > 0);
    if (alive.length !== get().turf.length) applyTurf(alive);
  }

  async function refreshLeaderboard() {
    const state = get();
    const scope = state.scope;
    const region = state.region[scope];
    const generation = state.generation;
    const request = ++boardRequest;
    if (!player()?.id || state.resetting) return;
    const data = await fetchLeaderboard({ scope, region, me: player().id });
    if (!current(generation) || request !== boardRequest || get().scope !== scope || get().region[scope] !== region) return;
    if (!data?.players) {
      set({ leaderboard: null });
      return;
    }
    set({ leaderboard: { scope, region, rows: data.players } });
  }

  function pushScore() {
    const state = get();
    const me = player();
    if (!me?.id || state.resetting) return Promise.resolve();
    const score = scoreOf(state);
    const key = `${score}|${me.name}|${JSON.stringify(state.region)}`;
    const generation = state.generation;
    const run = scoreQueue.catch(() => {}).then(async () => {
      if (!current(generation) || key === lastSubmitted) return;
      const saved = await submitScore({ playerId: me.id, name: me.name, score, region: state.region });
      if (!saved || !current(generation)) return;
      lastSubmitted = key;
      await refreshLeaderboard();
    });
    scoreQueue = run;
    return run;
  }

  function photonPhone() {
    return (process.env.EXPO_PUBLIC_PHOTON_PHONE ?? "").trim() || null;
  }

  function pushDay({ immediate = false } = {}) {
    const state = get();
    const me = player();
    const phone = photonPhone();
    if ((!me?.id && !phone) || state.resetting) return Promise.resolve();
    const generation = state.generation;
    const send = () => {
      const run = dayQueue.catch(() => {}).then(async () => {
        const latest = get();
        const squad = squadSummary(latest);
        const stampNow = `${dayFingerprint(latest.dayLog)}|${squad.map((p) => p.name).join(",")}`;
        if (!current(generation) || stampNow === lastDayStamp) return;
        const saved = await submitDayLog({
          ...(me?.id ? { playerId: me.id } : {}),
          ...(phone ? { phone } : {}),
          steps: latest.dayLog?.steps ?? 0,
          places: latest.dayLog?.places ?? [],
          squad,
        });
        if (!saved || !current(generation)) return;
        lastDayStamp = stampNow;
      });
      dayQueue = run;
      return run;
    };
    if (!immediate) {
      clearTimeout(dayTimer);
      dayTimer = setTimeout(send, 4_000);
      return Promise.resolve();
    }
    clearTimeout(dayTimer);
    return send();
  }

  // Leaves a squad pet on guard, or challenges the guard. Returns
  // { result, won, message } for the landmark screen's battle, or null when the
  // there is no configured server. Online failures return an explicit outcome.
  // landmark: { title, lat, lon } when it isn't one of your found places (a rival's turf).
  // hpShare: 0..1, the HP the pet will have left once this claim's fight is over.
  async function claimLandmark(landmarkId, petId, landmark = null, hpShare = 1) {
    const state = get();
    const generation = state.generation;
    if (state.resetting) return null;
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
    if (!apiAvailable()) return null; // no server configured: the landmark screen applies the rules locally
    const data = await claimTurf({
      playerId: me.id,
      playerName: me.name,
      landmarkId: String(place.id),
      title: place.title,
      lat: place.lat,
      lon: place.lon,
      hpShare, // the pet guards with the HP it has left, not a fresh 100%
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
    if (!current(generation)) return null;
    if (!data) {
      await refreshTurf(); // a timed-out claim may already have committed
      if (!current(generation)) return null;
      return { result: "unavailable", won: false, message: "The server could not confirm this claim. Check the map and try again." };
    }
    await refreshTurf();
    if (!current(generation)) return null;
    return { result: data.result, won: data.won ?? WINS.includes(data.result), message: data.message };
  }

  async function recallPet(petId) {
    const generation = get().generation;
    if (!apiAvailable()) {
      if (!get().demoMode) return false;
      applyTurf((get().turf ?? []).filter((t) => !(t.mine && t.pet?.id === petId)));
      return true;
    }
    // Always ask the server: local ownership can be stale or missing.
    const data = await recallGuard({ playerId: player().id, petId });
    if (!current(generation)) return false;
    if (!data) { say("Couldn't confirm the recall. Your squad is unchanged; try again."); return false; }
    applyTurf((get().turf ?? []).filter((t) => !(t.mine && t.pet?.id === petId)));
    await refreshTurf();
    return current(generation);
  }

  function invalidate() {
    turfRequest += 1;
    boardRequest += 1;
    lastSubmitted = null;
    lastDayStamp = null;
    clearTimeout(dayTimer);
  }

  function rename(name) {
    const clean = name.trim().slice(0, 24);
    if (!clean) return false;
    set({ player: { ...player(), name: clean } });
    persist();
    lastSubmitted = null;
    return true;
  }

  return { refreshTurf, refreshLeaderboard, pushScore, pushDay, claimLandmark, recallPet, expireTurf, invalidate, rename };
}
