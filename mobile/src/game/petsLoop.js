// Eggs hatch from walking only.
// You carry up to MAX_EGGS; every egg fills as you walk; one hatches at a time.
import { distanceMeters } from "../core/geo.js";
import { MAX_EGGS, eggProgress, eggTierOf, hatchEgg, issIsOverhead, maybeNewEgg, rarityOf } from "../core/pets.js";
import { getIssPosition } from "../core/services.js";
import { fetchPetPortrait } from "../api.js";
import { speakMemo } from "../voice.js";

const ISS_REFRESH_MS = 60_000;

// squadSize(): how many pets fit in the squad right now (it grows with your league).
export function createPetsLoop({ get, set, persist, say, squadSize = () => 3 }) {
  let iss = null;

  function issOverheadNow() {
    return issIsOverhead(iss, get().position, distanceMeters);
  }

  async function refreshIss() {
    const generation = get().generation;
    try {
      const position = await getIssPosition();
      if (generation !== get().generation || get().resetting) return;
      iss = position;
      set({ issOverhead: issOverheadNow() });
    } catch (error) {
      if (generation !== get().generation) return;
      console.warn("ISS position unavailable:", error);
      set({ issOverhead: false });
    }
  }

  async function drawPortrait(pet) {
    const generation = get().generation;
    const art = await fetchPetPortrait({
      petId: pet.id,
      species: pet.species,
      rarity: pet.rarity,
      petClass: pet.petClass,
      color: pet.color,
    });
    if (!art || generation !== get().generation || get().resetting) return;
    set({ pets: get().pets.map((p) => (p.id === pet.id ? { ...p, art } : p)) });
    const hatching = get().hatching;
    if (hatching?.id === pet.id) set({ hatching: { ...hatching, art } });
    persist();
  }

  function tickPets() {
    const state = get();
    if (state.hatching) return;
    const { walked, steps } = state.progress;
    const ready = state.eggs.find((egg) => eggProgress(egg, walked) >= 1);
    if (ready) {
      const pet = hatchEgg(ready, walked, Math.random, { issOverhead: issOverheadNow() });
      const joins = state.squad.length < squadSize();
      set({
        eggs: state.eggs.filter((egg) => egg.id !== ready.id),
        pets: [pet, ...state.pets],
        squad: joins ? [...state.squad, pet.id] : state.squad,
        hatching: pet,
      });
      persist();
      const rarity = rarityOf(pet);
      const space = pet.spaceBorn ? " It hatched while the ISS was overhead! 🛰️" : "";
      say(`🐣 Your egg hatched! Meet ${pet.name}, a ${rarity.label} ${pet.petClass}.${space}`);
      speakMemo(`Your egg hatched! Meet ${pet.name}, a ${rarity.label.toLowerCase()} ${pet.petClass.toLowerCase()}!`);
      drawPortrait(pet);
      return;
    }
    // maybeNewEgg hands out one egg at a time; a full basket counts as "carrying one".
    const full = state.eggs.length >= MAX_EGGS ? state.eggs[0] : null;
    const egg = maybeNewEgg({ egg: full, eggsReceived: state.eggsReceived, steps, walked });
    if (egg) {
      set({ eggs: [...state.eggs, egg], eggsReceived: state.eggsReceived + 1 });
      persist();
      say(`🥚 You found a ${eggTierOf(egg)?.label ?? "egg"}! Keep walking to hatch it.`);
    }
  }

  function hatchEggNow() {
    const state = get();
    if (!state.eggs.some((egg) => eggProgress(egg, state.progress.walked) >= 1)) {
      say(state.eggs.length ? "Keep walking: no egg is ready yet." : "You aren't carrying an egg. Walk to find one.");
      return;
    }
    tickPets();
  }

  function setSquad(ids) {
    set({ squad: ids });
    persist();
  }

  function closeHatch() {
    set({ hatching: null });
  }

  function startIssWatch() {
    refreshIss();
    const timer = setInterval(refreshIss, ISS_REFRESH_MS);
    return () => clearInterval(timer);
  }

  return { tickPets, hatchEggNow, setSquad, closeHatch, startIssWatch };
}
