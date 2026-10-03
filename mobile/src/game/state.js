// Initial state, saved fields, and derived values shared by the game modules.
import { AGENTS } from "../core/agents.js";
import { DEFAULT_CENTER, DEFAULT_REGION } from "../core/config.js";
import { activeTrail, rankFor, scoreFor } from "../core/rank.js";

// Fields saved on the phone, with their defaults.
export const SAVED_DEFAULTS = Object.freeze({
  progress: { walked: 0, steps: 0, landmarksFound: 0, landmarksCaptured: 0 },
  found: [], // [{ id, title, lat, lon, photo }]
  album: [], // [{ id, title, image, date, agentId }]
  xp: Object.fromEntries(AGENTS.map((a) => [a.id, 0])),
  trailChoice: "auto",
  trips: [], // [{ id, title, meters, amount, date, nessieId }]
  bank: null, // { customerId, checkingId, savingsId }
  nessieKey: "", // sandbox key only; a real app keeps bank keys on a server
});

// "Reset my progress" clears these but keeps the Nessie connection.
export const RESETTABLE_KEYS = ["progress", "found", "album", "xp", "trailChoice", "trips"];

export const INITIAL_STATE = Object.freeze({
  ...SAVED_DEFAULTS,
  loaded: false,
  position: DEFAULT_CENTER,
  blooms: [], // [{ id, lat, lon, emoji }]
  trailSegments: [], // [{ id, trailId, color, coords: [{ latitude, longitude }] }]
  route: null, // [{ lat, lon }]
  mapFocus: null, // { lat, lon, key } to recenter the map
  walking: false,
  away: [], // agent ids on an expedition
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
});

export function stats(state) {
  return { ...state.progress, steps: state.progress.steps };
}

export const scoreOf = (state) => scoreFor(stats(state));
export const currentTrail = (state) => activeTrail(scoreOf(state), state.trailChoice);

export function savedFields(state) {
  return Object.fromEntries(Object.keys(SAVED_DEFAULTS).map((key) => [key, state[key]]));
}
