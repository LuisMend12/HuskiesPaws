import { DEMO_RIVALS } from "../core/rivals.js";

// Sample pets, eggs and turf, shown until the backend adds the real ones to the
// state (docs/HANDOFF-backend.md). Same shapes as the real data, so it drops in.
// hatchedAtWalked is relative to how far you've walked, so levels look varied.
// Sample pets have no `status`: it's worked out from what the squad is doing.

const pet = (id, name, species, rarity, petClass, color, basePower, ago, extra = {}) => ({
  id: `pet-sample${id}`, name, species, rarity, petClass, color, basePower, art: null, spaceBorn: false, ...extra, ago,
});

const PETS = [
  // Starter pets: every player begins with these three huskies.
  pet("0001", "Pip", "husky", "common", "Scout", "cinnamon", 12, 1800),
  pet("0002", "Moss", "husky", "common", "Storyteller", "midnight", 12, 1800),
  pet("0003", "Fern", "husky", "common", "Pathfinder", "mint", 12, 1800),
  // Hatched from eggs.
  pet("0004", "Biscuit", "shiba", "legendary", "Guardian", "golden", 62, 1600),
  pet("0005", "Nova", "cat", "epic", "Scout", "rose", 41, 900, { spaceBorn: true }),
  pet("0006", "Clover", "bunny", "rare", "Storyteller", "snowy", 27, 500),
  pet("0007", "Ember", "fox", "common", "Pathfinder", "cinnamon", 16, 200),
];

export function samplePets(walked) {
  return PETS.map(({ ago, ...p }) => ({ ...p, hatchedAtWalked: walked - ago }));
}

// Eggs of each tier at different stages (meters already walked with each).
const EGGS = [["01", "short", 240], ["02", "medium", 330], ["03", "long", 120]];
export const sampleEggs = (walked) => EGGS.map(([id, tier, done]) => ({ id: `egg-sample${id}`, tier, startWalked: walked - done }));

// Bot rivals (core/rivals.js, the same ones the server fields) for offline play,
// on the phone's 100-HP scale, at slightly different health so the map varies.
const OFFLINE_HP = [80, 45, 20, 65, 90, 30, 100, 55];
export const SAMPLE_TURF = Object.freeze(
  DEMO_RIVALS.map((r, i) => ({ ...r, mine: false, hp: OFFLINE_HP[i % OFFLINE_HP.length], maxHp: 100, claimedAt: null })),
);

// Everything the pet screens read, with sample data filling any gaps.
// `eggs` accepts the newer `state.eggs` list or the older single `state.egg`.
export function petsView(state) {
  const { walked } = state.progress;
  const sample = state.pets === undefined;
  const pets = sample ? samplePets(walked) : state.pets;
  const squadIds = state.squad ?? pets.slice(0, 3).map((p) => p.id);
  const eggs = state.eggs ?? (state.egg === undefined ? sampleEggs(walked) : [state.egg].filter(Boolean));
  return {
    sample,
    pets,
    eggs,
    squadIds,
    squad: squadIds.map((id) => pets.find((p) => p.id === id)).filter(Boolean),
    turf: state.turf ?? SAMPLE_TURF,
    sampleTurf: state.turf === undefined,
  };
}
