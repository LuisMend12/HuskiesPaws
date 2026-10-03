// Initial state, saved fields, and derived values shared by the game modules.
import { AGENTS } from "../core/agents.js";
import { DEFAULT_CENTER, DEFAULT_REGION, POINTS } from "../core/config.js";
import { STARTER_PETS } from "../core/pets.js";
import { activeTrail, rankFor, scoreFor } from "../core/rank.js";

function newPlayer() {
  const id = `p-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return { id, name: `Husky-${id.slice(-4).toUpperCase()}` };
}

// Fields saved on the phone, with their defaults.
export const SAVED_DEFAULTS = Object.freeze({
  progress: { walked: 0, steps: 0, walkXp: 0, landmarksFound: 0, landmarksCaptured: 0 },
  found: [], // [{ id, title, lat, lon, photo }]
  album: [], // [{ id, title, image, date, agentId }]
  xp: Object.fromEntries(AGENTS.map((a) => [a.id, 0])),
  trailChoice: "auto",
  trips: [], // [{ id, title, meters, amount, date, nessieId }]
  bank: null, // { customerId, checkingId, savingsId }
  nessieKey: "", // sandbox key only; a real app keeps bank keys on a server
  mapRenderer: "garden", // iOS development build uses MapLibre; Expo Go falls back
  pets: STARTER_PETS, // [{ id, name, species, rarity, petClass, color, basePower, hatchedAtWalked, spaceBorn, art }]
  eggs: [], // [{ id, startWalked, tier }] up to MAX_EGGS, all filling as you walk
  eggsReceived: 0,
  squad: STARTER_PETS.map((p) => p.id), // pet ids with you, picked in the Pets tab
  player: null, // { id, name } created on first load
});

// "Reset my progress" clears these but keeps the Nessie connection and player id.
export const RESETTABLE_KEYS = [
  "progress", "found", "album", "xp", "trailChoice", "trips",
  "pets", "eggs", "eggsReceived", "squad",
];

export const INITIAL_STATE = Object.freeze({
  ...SAVED_DEFAULTS,
  loaded: false,
  position: DEFAULT_CENTER,
  blooms: [], // [{ id, lat, lon, emoji }]
  trailSegments: [], // [{ id, trailId, color, coords: [{ latitude, longitude }] }]
  route: null, // [{ lat, lon }]
  mapFocus: null, // { lat, lon, key } to recenter the map
  followCamera: true, // garden map: stop following after a manual pan
  walking: false,
  away: [], // agent ids on an expedition
  expedition: null, // { agentId, from, to: { lat, lon }, startedAt, durationMs } while a pet walks to a place
  visited: [], // place ids you've walked to
  discovery: null, // { place, summary, memo, agentId }
  postcardOpen: false,
  captureOpen: false,
  capturable: null, // a found place you're standing at
  guide: null, // real-walk navigation: { place, meters }
  demoMode: true, // judging is indoors: guided walks are simulated
  liveLocation: false,
  pedometer: false,
  region: DEFAULT_REGION,
  scope: "local",
  tab: "squad",
  rankName: rankFor(0).current.name,
  status: "Send an agent on an expedition.",
  hatching: null, // the pet that just hatched; not saved
  issOverhead: false, // not saved
  // turf: not set until the server answers, so the map shows sample rivals offline.
  xpBoost: 1,
  leaderboard: null, // { scope, rows } from the server; null = sample data
});

// Older saves: an empty pet list gets the starters; a single `egg` becomes `eggs`;
// the squad keeps only pets you still have.
function petsFrom(saved) {
  const pets = saved.pets?.length ? saved.pets : STARTER_PETS;
  const eggs = saved.eggs?.length ? saved.eggs : saved.egg ? [saved.egg] : [];
  const owned = new Set(pets.map((p) => p.id));
  const squad = (saved.squad ?? []).filter((id) => owned.has(id));
  return { pets, eggs, squad: squad.length ? squad : pets.slice(0, 3).map((p) => p.id) };
}

export function migrateSaved(saved) {
  const progress = saved.progress ?? SAVED_DEFAULTS.progress;
  const walkXp = Number.isFinite(progress.walkXp)
    ? progress.walkXp
    : progress.steps / POINTS.stepsPerPoint;
  const player = saved.player?.id ? saved.player : newPlayer();
  return {
    ...saved,
    progress: { ...progress, walkXp },
    ...petsFrom(saved),
    eggsReceived: saved.eggsReceived ?? 0,
    player,
  };
}

export function stats(state) {
  return { ...state.progress, steps: state.progress.steps, walkXp: state.progress.walkXp };
}

export const scoreOf = (state) => scoreFor(stats(state));
export const currentTrail = (state) => activeTrail(scoreOf(state), state.trailChoice);

export function savedFields(state) {
  return Object.fromEntries(Object.keys(SAVED_DEFAULTS).map((key) => [key, state[key]]));
}
