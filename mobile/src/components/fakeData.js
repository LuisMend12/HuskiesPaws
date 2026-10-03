// Sample pets and an egg, shown until the backend adds real pets to the state.
// Same shape as core/pets.js hatchEgg(), so the real data drops straight in.
// hatchedAtWalked is relative to how far you've walked, so levels look varied.

export function samplePets(walked) {
  return [
    { id: "pet-sample0001", name: "Biscuit", rarity: "legendary", petClass: "Guardian", color: "golden", basePower: 62, hatchedAtWalked: walked - 1600, spaceBorn: false, art: null },
    { id: "pet-sample0002", name: "Nova", rarity: "epic", petClass: "Pathfinder", color: "midnight", basePower: 41, hatchedAtWalked: walked - 900, spaceBorn: true, art: null },
    { id: "pet-sample0003", name: "Clover", rarity: "rare", petClass: "Scout", color: "mint", basePower: 27, hatchedAtWalked: walked - 500, spaceBorn: false, art: null },
    { id: "pet-sample0004", name: "Mochi", rarity: "common", petClass: "Storyteller", color: "snowy", basePower: 14, hatchedAtWalked: walked - 200, spaceBorn: false, art: null },
    { id: "pet-sample0005", name: "Pepper", rarity: "common", petClass: "Scout", color: "cinnamon", basePower: 18, hatchedAtWalked: walked, spaceBorn: false, art: null },
  ];
}

// An egg 60% of the way to hatching.
export const sampleEgg = (walked) => ({ id: "egg-sample", startWalked: walked - 180 });
