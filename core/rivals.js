// Bot rivals guarding real Cornell landmarks, so the map always has someone to
// fight. Shared by the server (virtual guards, see server/src/bots.js) and the
// phone app when it plays offline (mobile/src/components/fakeData.js).
// Coordinates are approximate building centres.

const rival = (id, title, lat, lon, ownerName, pet) => ({
  landmarkId: `bot-${id}`,
  title,
  lat,
  lon,
  ownerName,
  pet: { id: `pet-bot-${id}`, art: null, spaceBorn: false, ...pet },
});

export const DEMO_RIVALS = Object.freeze([
  rival("uris", "Uris Library", 42.4477, -76.4851, "OrchidOz",
    { name: "Comet", species: "bear", rarity: "epic", petClass: "Guardian", color: "midnight", power: 48 }),
  rival("bailey", "Bailey Hall", 42.4494, -76.4796, "AsterAri",
    { name: "Hazel", species: "fox", rarity: "rare", petClass: "Scout", color: "golden", power: 31 }),
  rival("klarman", "Klarman Hall", 42.4491, -76.4834, "SorrelSky",
    { name: "Tofu", species: "cat", rarity: "common", petClass: "Storyteller", color: "snowy", power: 18 }),
  rival("olin", "Olin Library", 42.448, -76.4842, "MapleMo",
    { name: "Pebble", species: "bunny", rarity: "common", petClass: "Pathfinder", color: "rose", power: 22 }),
  rival("sage", "Sage Chapel", 42.4469, -76.4843, "WillowWu",
    { name: "Juniper", species: "shiba", rarity: "rare", petClass: "Guardian", color: "cinnamon", power: 36 }),
  rival("straight", "Willard Straight Hall", 42.4463, -76.4856, "CloverKai",
    { name: "Mochi", species: "husky", rarity: "common", petClass: "Scout", color: "mint", power: 15 }),
  rival("statler", "Statler Hotel", 42.4455, -76.4819, "RowanRay",
    { name: "Nova", species: "cat", rarity: "legendary", petClass: "Guardian", color: "golden", power: 66 }),
  rival("duffield", "Duffield Hall", 42.4444, -76.4826, "PoppyPark",
    { name: "Sprocket", species: "bear", rarity: "epic", petClass: "Pathfinder", color: "snowy", power: 44 }),
]);
