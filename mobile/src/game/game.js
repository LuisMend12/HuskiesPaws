// Game actions. Screens read the store and call these.
import { AGENTS, choosePlace, expeditionDuration, routeMemo, scoutMemo, storyMemo } from "../core/agents.js";
import { ALBUM_MAX_CARDS } from "../core/config.js";
import { distanceMeters, pathLength } from "../core/geo.js";
import { LEAGUES, leagueOf, rankFor } from "../core/rank.js";
import { findNearbyPlaces, getPlaceSummary, getRegion, getWalkingRoute, setRequestHeaders } from "../core/services.js";
import { clearKeys, loadAll, saveAll } from "../storage.js";
import { speakMemo, stopMemo } from "../voice.js";
import { fetchPostcard } from "../api.js";
import { createOnline } from "./online.js";
import { createPetsLoop } from "./petsLoop.js";
import { addDayPlace, rollDay } from "../core/dayLog.js";
import { INITIAL_STATE, RESETTABLE_KEYS, SAVED_DEFAULTS, migrateSaved, savedFields, scoreOf } from "./state.js";
import { createStore } from "./store.js";
import { createWalking } from "./walking.js";

const STORY_COOLDOWN_MS = 20_000; // wait between stories (the voice takes a while anyway)
const NEARBY_LANDMARKS = 25; // nearest real landmarks shown as food bags
const NEARBY_REFRESH_M = 400;

const agentById = (id) => AGENTS.find((a) => a.id === id);
setRequestHeaders({ "User-Agent": "HuskiesPaws/1.0 (BigRed//Hacks 2026 demo app)" });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function createGame() {
  const store = createStore(INITIAL_STATE);
  const get = store.getState;
  const set = store.setState;
  const say = (status) => set({ status });
  const current = (token) => token === get().generation && !get().resetting;
  let stopIss = null;
  // Saves only fields that changed since the last save. State updates are
  // immutable, so a new reference means a change. This keeps album photos
  // (big data URIs) from being re-saved on every step, which froze the app.
  let lastSaved = {};
  const persist = () => {
    const fields = savedFields(get());
    const changed = Object.fromEntries(Object.entries(fields).filter(([key, value]) => lastSaved[key] !== value));
    if (Object.keys(changed).length === 0) return;
    lastSaved = fields;
    saveAll(changed);
  };
  const gainXp = (agentId) => ({ xp: { ...get().xp, [agentId]: get().xp[agentId] + 1 } });

  const squadSize = () => {
    const tier = LEAGUES.indexOf(leagueOf(rankFor(scoreOf(get())).current));
    return get().squadSize ?? 3 + (tier >= 2 ? 1 : 0) + (tier >= 4 ? 1 : 0); // +1 at Gold, +1 at Crystal
  };
  const pets = createPetsLoop({ get, set, persist, say, squadSize });
  const online = createOnline({ get, set, persist, say });

  // Real landmarks near you (Wikipedia geosearch, like Explore), shown as food
  // bags so the map isn't empty; refreshed after you've moved NEARBY_REFRESH_M.
  let nearbyFrom = null;
  async function refreshNearby() {
    const position = get().position;
    if (nearbyFrom && distanceMeters(nearbyFrom, position) < NEARBY_REFRESH_M) return;
    nearbyFrom = position;
    try {
      const places = (await findNearbyPlaces(position))
        .map((p) => ({ ...p, distance: distanceMeters(position, p) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, NEARBY_LANDMARKS)
        .map(({ id, title, lat, lon }) => ({ id, title, lat, lon }));
      set({ nearbyPlaces: places });
    } catch (error) {
      nearbyFrom = null; // try again next time
      console.warn("Nearby landmarks unavailable:", error.message);
    }
  }

  const walking = createWalking(store, {
    onArrive: (place, meters) => arrive(place, meters),
    onRegionFound: async (position) => {
      const token = get().generation;
      const region = await getRegion(position, get().region);
      if (!current(token)) return;
      set({ region });
      online.pushScore();
      online.refreshLeaderboard();
    },
    persist,
    // final: false while a simulated walk is still going (no score upload yet).
    onWalk: ({ final = true } = {}) => {
      if (get().resetting) return;
      online.expireTurf();
      pets.tickPets();
      refreshNearby();
      if (final) {
        online.pushScore();
        online.pushDay();
      }
    },
  });

  async function load() {
    const token = get().generation;
    const saved = migrateSaved(await loadAll(SAVED_DEFAULTS));
    // Remove credentials saved by earlier versions; they never migrate into state.
    await clearKeys(["nessieKey"]);
    if (!current(token)) return;
    set({
      ...saved,
      dayLog: rollDay(saved.dayLog),
      loaded: true,
      rankName: rankFor(scoreOf({ ...get(), ...saved })).current.name,
    });
    persist();
    walking.stepTo(get().position, { countDistance: false, countSteps: false, notifyWalk: false });
    refreshNearby();
    stopIss?.();
    stopIss = pets.startIssWatch();
    online.refreshTurf();
    online.refreshLeaderboard();
    online.pushScore();
  }

  function checkRankUp(agent) {
    const rank = rankFor(scoreOf(get())).current;
    if (rank.name === get().rankName) return;
    const newLeague = rank.division === 3; // the first division of a league unlocks its trail
    const message = newLeague
      ? `League up! You're now ${rank.emoji} ${rank.name}. New trail unlocked: ${rank.trail.flowers[0]} ${rank.trail.name}!`
      : `Rank up! You're now ${rank.emoji} ${rank.name}.`;
    set({ rankName: rank.name, status: message });
    speakMemo(message, agent ?? agentById("scout"));
  }

  function award(progressPatch, agent) {
    set({ progress: { ...get().progress, ...progressPatch } });
    persist();
    checkRankUp(agent);
    online.pushScore();
  }

  async function runExpedition(agent) {
    const token = get().generation;
    if (!get().loaded || get().resetting) return;
    set({ away: [...get().away, agent.id], status: `${agent.name} is looking around…` });
    try {
      const state = get();
      const places = await findNearbyPlaces(state.position);
      if (!current(token)) return;
      const known = new Set([...state.visited, ...state.found.map((p) => p.id)]);
      const place = choosePlace(places, state.position, known);
      if (!place) {
        say(`${agent.name} couldn't find anywhere new nearby. Try walking somewhere else!`);
        return;
      }
      const durationMs = expeditionDuration(place.distance);
      // The map walks the pet out to the place and back during this time.
      set({
        status: `${agent.name} is heading toward ${place.title}… back in about ${Math.round(durationMs / 1000)} s.`,
        expedition: { agentId: agent.id, from: state.position, to: { lat: place.lat, lon: place.lon }, startedAt: Date.now(), durationMs },
      });
      const [summary] = await Promise.all([getPlaceSummary(place.title), wait(durationMs)]);
      if (!current(token)) return;
      const memo = scoutMemo(place, summary);
      const foundPlace = { id: place.id, title: place.title, lat: place.lat, lon: place.lon, photo: summary.photo };
      set({
        discovery: { place, summary, memo, agentId: agent.id, agentName: agent.name },
        postcardOpen: true,
        found: [...get().found, foundPlace],
        status: `${agent.name} found ${place.title}!`,
        ...gainXp(agent.id),
      });
      award({ landmarksFound: get().progress.landmarksFound + 1 }, agent);
      speakMemo(memo, agent);
      fetchPostcard({ placeId: String(place.id), title: place.title, fact: summary.extract.slice(0, 300) })
        .then((image) => {
          if (image && current(token) && get().discovery?.place.id === place.id) {
            set({ discovery: { ...get().discovery, image } });
          }
        });
    } catch (error) {
      console.error("Expedition failed:", error);
      if (current(token)) say(`${agent.name} got lost. Try Explore again in a moment.`);
    } finally {
      if (current(token)) set({ away: get().away.filter((id) => id !== agent.id), expedition: null });
    }
  }

  async function tellStory(agent) {
    const token = get().generation;
    if (!get().loaded || get().resetting) return;
    // One story at a time: the button counts down until storyReadyAt (SquadPanel).
    const waitMs = (get().storyReadyAt ?? 0) - Date.now();
    if (waitMs > 0) {
      say(`${agent.name} is still catching their breath. Try again in ${Math.ceil(waitMs / 1000)} s.`);
      return;
    }
    set({ storyReadyAt: Date.now() + STORY_COOLDOWN_MS });
    say(`${agent.name} is remembering a story…`);
    try {
      const position = get().position;
      const [nearest] = (await findNearbyPlaces(position))
        .map((p) => ({ ...p, distance: distanceMeters(position, p) }))
        .sort((a, b) => a.distance - b.distance);
      if (!current(token)) return;
      if (!nearest) {
        say(`${agent.name} doesn't know any stories about this spot.`);
        return;
      }
      const memo = storyMemo(nearest, await getPlaceSummary(nearest.title));
      if (!current(token)) return;
      set({ status: memo, ...gainXp(agent.id) });
      speakMemo(memo, agent);
      persist();
    } catch (error) {
      console.error("Story failed:", error);
      if (current(token)) say(`${agent.name} forgot the story. Try again in a moment.`);
    }
  }

  // One walk at a time. `planning` covers the route lookup before walking starts,
  // so double taps (or Demo walk during Take me there) can't start a second walk
  // that fights the first over your position.
  async function oneWalk(run) {
    if (!get().loaded || get().resetting) return;
    const token = get().generation;
    if (get().planning || get().walking) {
      say("Already on a walk. Wait until it finishes.");
      return;
    }
    set({ planning: true });
    try {
      await run(token);
    } finally {
      if (current(token)) set({ planning: false });
    }
  }

  async function guideToDiscovery() {
    const target = get().discovery?.place;
    if (!target) return;
    await oneWalk((token) => guideWalk(target, token));
  }

  async function guideWalk(target, token) {
    const agent = agentById("pathfinder");
    set({ postcardOpen: false, status: `${agent.name} is planning a route…` });
    const route = await getWalkingRoute(get().position, target);
    if (!current(token)) return;
    const meters = route.distance ?? pathLength(route.points);
    set({ route: route.points, ...gainXp(agent.id) });
    speakMemo(routeMemo(target, route), agent);
    persist();
    if (get().demoMode) {
      if (!(await walking.walkAlong(route.points)) || !current(token)) return;
      arrive(target, meters);
      return;
    }
    set({ guide: { place: target, meters }, status: `Walk to ${target.title}. Fern will tell you when you arrive!` });
    if (!(await walking.startLiveLocation())) set({ guide: null });
  }

  function notePlace(place) {
    set({ dayLog: addDayPlace(get().dayLog, place) });
    persist();
    online.pushDay({ immediate: true });
  }

  function arrive(place, meters) {
    if (get().resetting) return;
    const arrived = get().found.find((p) => p.id === place.id) ?? null;
    set({ visited: [...get().visited, place.id], discovery: null, capturable: arrived, guide: null, route: null });
    notePlace(place);
    say(`You made it to ${place.title}! Capture it to add a postcard.`);
    speakMemo(`We made it to ${place.title}! Quick, take a picture!`, agentById("pathfinder"));
    checkRankUp(null);
    pets.tickPets();
    online.pushScore();
  }

  async function walkTo(place) {
    if (!place) return;
    await oneWalk((token) => guideWalk(place, token));
  }

  const demoWalk = () => oneWalk(demoWalkNow);

  async function demoWalkNow(token) {
    say("Going for a little walk…");
    try {
      const state = get();
      const target = choosePlace(await findNearbyPlaces(state.position), state.position, new Set(state.visited));
      if (!current(token)) return;
      if (!target) {
        say("Nowhere new to walk to nearby.");
        return;
      }
      const route = await getWalkingRoute(state.position, target);
      if (!current(token)) return;
      const rankBefore = get().rankName;
      if (!(await walking.walkAlong(route.points)) || !current(token)) return;
      notePlace(target);
      checkRankUp(null);
      if (get().rankName === rankBefore) say(`Walked to ${target.title}. Send Pip to explore from here!`);
    } catch (error) {
      console.error("Demo walk failed:", error);
      if (current(token)) say("Couldn't plan a walk. Check your connection and try again.");
    }
  }

  function saveCapture(image) {
    const place = get().capturable;
    if (!place) return;
    const scout = agentById("scout");
    const card = { id: place.id, title: place.title, image, date: new Date().toISOString(), agentId: scout.id };
    set({
      album: [card, ...get().album].slice(0, ALBUM_MAX_CARDS),
      capturable: null,
      captureOpen: false,
      tab: "album",
      status: `${place.title} added to your album!`,
    });
    speakMemo(`Got it! ${place.title} is in your album.`, scout);
    award({ landmarksCaptured: get().progress.landmarksCaptured + 1 }, scout);
  }

  async function resetProgress() {
    if (get().resetting) return;
    set({ generation: get().generation + 1, resetting: true });
    walking.stop();
    online.invalidate();
    stopMemo();
    await clearKeys(RESETTABLE_KEYS);
    walking.resetTrail();
    const fresh = Object.fromEntries(RESETTABLE_KEYS.map((key) => [key, SAVED_DEFAULTS[key]]));
    set({
      ...fresh,
      resetting: false,
      planning: false,
      walking: false,
      guide: null,
      route: null,
      away: [],
      expedition: null,
      visited: [],
      petHp: {},
      postcardOpen: false,
      captureOpen: false,
      landmarkOpen: null,
      blooms: [],
      trailSegments: [],
      capturable: null,
      discovery: null,
      hatching: null,
      liveLocation: false,
      locationIssue: null,
      turf: undefined, // back to sample rivals until the server answers
      xpBoost: 1,
      leaderboard: null,
      rankName: rankFor(0).current.name,
      status: "Progress reset. Fresh start! 🌱",
    });
    walking.stepTo(get().position, { countDistance: false, countSteps: false, notifyWalk: false });
    lastSaved = {};
    persist();
    online.refreshTurf();
    online.pushScore();
  }

  const actions = {
    scout: runExpedition,
    storyteller: tellStory,
    pathfinder: guideToDiscovery,
  };

  return {
    store,
    load,
    runAgent: (agent) => actions[agent.id](agent),
    guideToDiscovery,
    demoWalk,
    walkTo,
    startLiveLocation: walking.startLiveLocation,
    saveCapture,
    resetProgress,
    setSquad: (ids) => {
      pets.setSquad(ids);
      online.pushDay({ immediate: true }); // the iMessage agent picks up the new names
    },
    closeHatch: pets.closeHatch,
    hatchEgg: pets.hatchEggNow,
    claimTurf: online.claimLandmark,
    recallGuard: online.recallPet,
    refreshOnline: () => {
      if (!get().loaded || get().resetting) return;
      online.expireTurf();
      online.refreshTurf();
      online.refreshLeaderboard();
    },
    dispose: () => {
      set({ generation: get().generation + 1 });
      walking.stop();
      stopIss?.();
      online.invalidate();
      stopMemo();
    },
    replayMemo: () => {
      const { discovery } = get();
      if (discovery) speakMemo(discovery.memo, agentById(discovery.agentId));
    },
    set: (patch) => {
      set(patch);
      if (patch.scope) online.refreshLeaderboard();
    },
    setTrailChoice: (trailChoice) => {
      set({ trailChoice });
      persist();
    },
    setMapRenderer: (mapRenderer) => {
      set({ mapRenderer, followCamera: true });
      persist();
    },
  };
}
