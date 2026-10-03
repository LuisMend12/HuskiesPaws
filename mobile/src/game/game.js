// Game actions. Screens read the store and call these.
import { AGENTS, choosePlace, expeditionDuration, routeMemo, scoutMemo, storyMemo } from "../core/agents.js";
import { ALBUM_MAX_CARDS } from "../core/config.js";
import { distanceMeters, pathLength } from "../core/geo.js";
import { setupBank, transferToSavings } from "../core/nessie.js";
import { LEAGUES, leagueOf, rankFor } from "../core/rank.js";
import { estimateRideFare, formatDollars, totalSaved, treeStage } from "../core/savings.js";
import { findNearbyPlaces, getPlaceSummary, getRegion, getWalkingRoute, setRequestHeaders } from "../core/services.js";
import { clearKeys, loadAll, saveAll } from "../storage.js";
import { speakMemo } from "../voice.js";
import { createOnline } from "./online.js";
import { createPetsLoop } from "./petsLoop.js";
import { INITIAL_STATE, RESETTABLE_KEYS, SAVED_DEFAULTS, migrateSaved, savedFields, scoreOf } from "./state.js";
import { createStore } from "./store.js";
import { createWalking } from "./walking.js";

const agentById = (id) => AGENTS.find((a) => a.id === id);
setRequestHeaders({ "User-Agent": "HuskiesPaws/1.0 (BigRed//Hacks 2026 demo app)" });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function createGame() {
  const store = createStore(INITIAL_STATE);
  const get = store.getState;
  const set = store.setState;
  const say = (status) => set({ status });
  const persist = () => saveAll(savedFields(get()));
  const gainXp = (agentId) => ({ xp: { ...get().xp, [agentId]: get().xp[agentId] + 1 } });

  const squadSize = () => {
    const tier = LEAGUES.indexOf(leagueOf(rankFor(scoreOf(get())).current));
    return get().squadSize ?? 3 + (tier >= 2 ? 1 : 0) + (tier >= 4 ? 1 : 0); // +1 at Gold, +1 at Crystal
  };
  const pets = createPetsLoop({ get, set, persist, say, squadSize });
  const online = createOnline({ get, set, persist, say });

  const walking = createWalking(store, {
    onArrive: (place, meters) => arrive(place, meters),
    onRegionFound: async (position) => set({ region: await getRegion(position, get().region) }),
    persist,
    onWalk: () => {
      pets.tickPets();
      online.pushScore();
    },
  });

  async function load() {
    const saved = migrateSaved(await loadAll(SAVED_DEFAULTS));
    set({ ...saved, loaded: true, rankName: rankFor(scoreOf({ ...get(), ...saved })).current.name });
    persist();
    walking.stepTo(get().position, { countDistance: false, countSteps: false, notifyWalk: false });
    pets.startIssWatch();
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
    set({ away: [...get().away, agent.id], status: `${agent.name} is looking around…` });
    try {
      const state = get();
      const places = await findNearbyPlaces(state.position);
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
    } catch (error) {
      console.error("Expedition failed:", error);
      say(`${agent.name} got lost (network problem). Try again in a moment.`);
    } finally {
      set({ away: get().away.filter((id) => id !== agent.id), expedition: null });
    }
  }

  async function tellStory(agent) {
    say(`${agent.name} is remembering a story…`);
    try {
      const position = get().position;
      const [nearest] = (await findNearbyPlaces(position))
        .map((p) => ({ ...p, distance: distanceMeters(position, p) }))
        .sort((a, b) => a.distance - b.distance);
      if (!nearest) {
        say(`${agent.name} doesn't know any stories about this spot.`);
        return;
      }
      const memo = storyMemo(nearest, await getPlaceSummary(nearest.title));
      set({ status: memo, ...gainXp(agent.id) });
      speakMemo(memo, agent);
      persist();
    } catch (error) {
      console.error("Story failed:", error);
      say(`${agent.name} forgot the story (network problem).`);
    }
  }

  async function guideToDiscovery() {
    const agent = agentById("pathfinder");
    const target = get().discovery?.place;
    if (!target) return;
    set({ postcardOpen: false, status: `${agent.name} is planning a route…` });
    const route = await getWalkingRoute(get().position, target);
    const meters = route.distance ?? pathLength(route.points);
    set({ route: route.points, ...gainXp(agent.id) });
    speakMemo(routeMemo(target, route), agent);
    persist();
    if (get().demoMode) {
      await walking.walkAlong(route.points);
      arrive(target, meters);
      return;
    }
    set({ guide: { place: target, meters }, status: `Walk to ${target.title}. Fern will tell you when you arrive!` });
    if (!(await walking.startLiveLocation())) set({ guide: null });
  }

  function arrive(place, meters) {
    const arrived = get().found.find((p) => p.id === place.id) ?? null;
    set({ visited: [...get().visited, place.id], discovery: null, capturable: arrived, guide: null, route: null });
    const savings = recordWalkSavings(place.title, meters);
    say(`You made it to ${place.title}! 🌸 ${savings} Tap 📸 Capture to add it to your album.`);
    speakMemo(`We made it to ${place.title}! Quick, take a picture!`, agentById("pathfinder"));
    checkRankUp(null);
    pets.tickPets();
    online.pushScore();
  }

  async function demoWalk() {
    say("Going for a little walk…");
    try {
      const state = get();
      const target = choosePlace(await findNearbyPlaces(state.position), state.position, new Set(state.visited));
      if (!target) {
        say("Nowhere new to walk to nearby.");
        return;
      }
      const route = await getWalkingRoute(state.position, target);
      const rankBefore = get().rankName;
      await walking.walkAlong(route.points);
      const savings = recordWalkSavings(target.title, route.distance ?? pathLength(route.points));
      checkRankUp(null);
      if (get().rankName === rankBefore) say(`Walked to ${target.title}. ${savings} Send Pip to explore from here!`);
    } catch (error) {
      console.error("Demo walk failed:", error);
      say("Couldn't plan a walk (network problem).");
    }
  }

  function recordWalkSavings(title, meters) {
    const amount = estimateRideFare(meters);
    if (amount === null) return "";
    const stageBefore = treeStage(totalSaved(get().trips)).current;
    const trip = { id: `${Date.now()}`, title, meters, amount, date: new Date().toISOString(), nessieId: null };
    set({ trips: [trip, ...get().trips] });
    persist();
    syncTripToNessie(trip);
    const stageAfter = treeStage(totalSaved(get().trips)).current;
    const grew = stageAfter.name !== stageBefore.name ? ` Your tree grew into a ${stageAfter.emoji} ${stageAfter.name}!` : "";
    return `You skipped a ~${formatDollars(amount)} ride, and it went into savings 🌳.${grew}`;
  }

  async function syncTripToNessie(trip) {
    const { bank, nessieKey } = get();
    if (!bank || !nessieKey) return;
    try {
      const nessieId = await transferToSavings(nessieKey, bank, trip.amount, `Walked to ${trip.title} instead of riding`);
      set({ trips: get().trips.map((t) => (t.id === trip.id ? { ...t, nessieId } : t)) });
      persist();
    } catch (error) {
      console.warn("Nessie transfer failed; kept in the local ledger:", error);
      say(`Saved ${formatDollars(trip.amount)} locally. Nessie didn't respond, so the transfer wasn't sent.`);
    }
  }

  async function connectBank(key) {
    const trimmed = key.trim();
    if (!trimmed) {
      say("Paste your Nessie API key first.");
      return false;
    }
    say("Connecting to Capital One Nessie…");
    try {
      const bank = await setupBank(trimmed, "HuskiesPaws");
      set({ bank, nessieKey: trimmed, status: "Connected! New walks will move their savings into your Nessie savings account." });
      persist();
      return true;
    } catch (error) {
      console.error("Nessie setup failed:", error);
      say(`Couldn't connect to Nessie (${error.message}). Savings still work in demo mode.`);
      return false;
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
    await clearKeys(RESETTABLE_KEYS);
    walking.resetTrail();
    const fresh = Object.fromEntries(RESETTABLE_KEYS.map((key) => [key, SAVED_DEFAULTS[key]]));
    set({
      ...fresh,
      blooms: [],
      trailSegments: [],
      capturable: null,
      discovery: null,
      hatching: null,
      turf: undefined, // back to sample rivals until the server answers
      xpBoost: 1,
      leaderboard: null,
      rankName: rankFor(0).current.name,
      status: "Progress reset. Fresh start! 🌱",
    });
    walking.stepTo(get().position, { countDistance: false, countSteps: false, notifyWalk: false });
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
    startLiveLocation: walking.startLiveLocation,
    connectBank,
    saveCapture,
    resetProgress,
    setSquad: pets.setSquad,
    closeHatch: pets.closeHatch,
    hatchEgg: pets.hatchEggNow,
    claimTurf: online.claimLandmark,
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
