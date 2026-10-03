// Physical Sciences Building, Cornell University
export const DEFAULT_CENTER = Object.freeze({ lat: 42.45, lon: -76.4816 });
export const DEFAULT_ZOOM = 17;

export const SCOUT_RADIUS_M = 1000;
export const SCOUT_CANDIDATES = 8;
export const MIN_PLACE_DISTANCE_M = 60;

// Expeditions take real time proportional to distance, compressed for demos.
export const EXPEDITION_MS_PER_METER = 12;
export const EXPEDITION_MIN_MS = 4000;
export const EXPEDITION_MAX_MS = 15000;

export const BLOOM_EVERY_M = 12;
export const DEMO_WALK_SPEED_MPS = 25; // sped up so a demo walk takes seconds
export const WALKING_SPEED_MPS = 1.3;

export const XP_PER_LEVEL = 2;
export const FETCH_TIMEOUT_MS = 10000;
