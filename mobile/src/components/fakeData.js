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

// Eggs at different stages of hatching (meters already walked with each).
const EGGS = [["01", 240], ["02", 130], ["03", 40]];
export const sampleEggs = (walked) => EGGS.map(([id, done]) => ({ id: `egg-sample${id}`, startWalked: walked - done }));

// Rival guards at real Cornell landmarks near the default map center.
const guard = (landmarkId, title, lat, lon, ownerName, guardPet, hp) => ({
  landmarkId, title, lat, lon, ownerName, mine: false, hp, maxHp: 100, claimedAt: null, pet: guardPet,
});
export const SAMPLE_TURF = Object.freeze([
  guard("sample-uris", "Uris Library", 42.4477, -76.4851, "OrchidOz",
    { id: "pet-rival00001", name: "Comet", species: "bear", rarity: "epic", petClass: "Guardian", color: "midnight", spaceBorn: false, power: 48, art: null }, 80),
  guard("sample-bailey", "Bailey Hall", 42.4494, -76.4796, "AsterAri",
    { id: "pet-rival00002", name: "Hazel", species: "fox", rarity: "rare", petClass: "Scout", color: "golden", spaceBorn: false, power: 31, art: null }, 45),
  guard("sample-klarman", "Klarman Hall", 42.4491, -76.4834, "SorrelSky",
    { id: "pet-rival00003", name: "Tofu", species: "cat", rarity: "common", petClass: "Storyteller", color: "snowy", spaceBorn: false, power: 18, art: null }, 20),
]);

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
