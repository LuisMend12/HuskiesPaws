// Eggs hatch from walking only. Nessie savings never buy eggs (PLAN.md).
import { distanceMeters } from "../core/geo.js";
import { eggProgress, hatchEgg, issIsOverhead, maybeNewEgg, rarityOf } from "../core/pets.js";
import { getIssPosition } from "../core/services.js";
import { fetchPetPortrait } from "../api.js";
import { speakMemo } from "../voice.js";

const ISS_REFRESH_MS = 60_000;

export function createPetsLoop({ get, set, persist, say }) {
  let iss = null;

  function issOverheadNow() {
    return issIsOverhead(iss, get().position, distanceMeters);
  }

  async function refreshIss() {
    try {
      iss = await getIssPosition();
      set({ issOverhead: issOverheadNow() });
    } catch (error) {
      console.warn("ISS position unavailable:", error);
      set({ issOverhead: false });
    }
  }

  async function drawPortrait(pet) {
    const art = await fetchPetPortrait({
      petId: pet.id,
      rarity: pet.rarity,
      petClass: pet.petClass,
      color: pet.color,
    });
    if (!art) return;
    set({ pets: get().pets.map((p) => (p.id === pet.id ? { ...p, art } : p)) });
    const hatching = get().hatching;
    if (hatching?.id === pet.id) set({ hatching: { ...hatching, art } });
    persist();
  }

  function tickPets() {
    const state = get();
    if (state.hatching) return;
    const { walked, steps } = state.progress;
    if (state.egg && eggProgress(state.egg, walked) >= 1) {
      const pet = hatchEgg(state.egg, walked, Math.random, { issOverhead: issOverheadNow() });
      set({
        egg: null,
        pets: [pet, ...state.pets],
        hatching: pet,
        activePetId: state.activePetId ?? pet.id,
      });
      persist();
      const rarity = rarityOf(pet);
      const space = pet.spaceBorn ? " It hatched while the ISS was overhead! 🛰️" : "";
      say(`🐣 Your egg hatched! Meet ${pet.name}, a ${rarity.label} ${pet.petClass}.${space}`);
      speakMemo(`Your egg hatched! Meet ${pet.name}, a ${rarity.label.toLowerCase()} ${pet.petClass.toLowerCase()}!`);
      drawPortrait(pet);
      return;
    }
    const egg = maybeNewEgg({ egg: state.egg, eggsReceived: state.eggsReceived, steps, walked });
    if (egg) {
      set({ egg, eggsReceived: state.eggsReceived + 1 });
      persist();
      say("🥚 You found an egg! Keep walking to hatch it.");
    }
  }

  function hatchEggNow() {
    const state = get();
    if (!state.egg) {
      say("You aren't carrying an egg. Walk to find one.");
      return;
    }
    if (eggProgress(state.egg, state.progress.walked) < 1) {
      say("Keep walking — this egg isn't ready yet.");
      return;
    }
    tickPets();
  }

  function setActivePet(id) {
    set({ activePetId: id });
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

  return { tickPets, hatchEggNow, setActivePet, closeHatch, startIssWatch };
}
