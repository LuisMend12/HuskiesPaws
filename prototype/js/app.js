import { AGENTS, choosePlace, expeditionDuration, levelFor, routeMemo, scoutMemo, storyMemo } from "./agents.js";
import { postcardSvg, creatureSvg } from "./art.js";
import { composePostcard, startCamera, stopCamera } from "./capture.js";
import {
  ALBUM_MAX_CARDS, CAPTURE_RADIUS_M, DEFAULT_CENTER, DEFAULT_REGION, DEMO_WALK_SPEED_MPS, LEADERBOARD_TOP,
} from "./config.js";
import { distanceMeters, interpolate } from "./geo.js";
import { SCOPES, buildLeaderboard, demoPlayers, topWithYou } from "./leaderboard.js";
import { createMap } from "./map.js";
import { TRAILS, activeTrail, rankFor, scoreFor, stepsFromMeters } from "./rank.js";
import { findNearbyPlaces, getPlaceSummary, getRegion, getWalkingRoute } from "./services.js";
import { clearAll, load, save } from "./storage.js";
import {
  agentCard, renderAlbum, renderLeaderboard, renderRankBadge, renderRankCard, renderTrailPicker,
} from "./views.js";
import { speakMemo } from "./voice.js";

const $ = (id) => document.getElementById(id);
const agentById = (id) => AGENTS.find((a) => a.id === id);
const SAVED_KEYS = ["progress", "found", "album", "xp", "trail"];
const EMPTY_PROGRESS = Object.freeze({ walked: 0, landmarksFound: 0, landmarksCaptured: 0 });
const RANK_START = rankFor(0).current.name;

let state = {
  position: DEFAULT_CENTER,
  blooms: 0,
  walking: false,
  away: new Set(),
  visited: new Set(),
  discovery: null, // { place, summary, memo, agentId }
  capturable: null, // a found place you're standing at
  region: DEFAULT_REGION,
  scope: "local",
  // Saved between visits:
  progress: load("progress", EMPTY_PROGRESS),
  found: load("found", []), // [{ id, title, lat, lon, photo }]
  album: load("album", []), // [{ id, title, image, date, agentId }]
  xp: load("xp", Object.fromEntries(AGENTS.map((a) => [a.id, 0]))),
  trailChoice: load("trail", "auto"), // "auto" or a trail id
};
state = { ...state, rankName: rankFor(scoreFor(stats())).current.name };

let cameraStream = null;

const currentTrail = () => activeTrail(scoreFor(stats()), state.trailChoice);
const map = createMap("map", state.position, currentTrail());
state = { ...state, blooms: map.moveTo(state.position) };
state.found.forEach((place) => map.addPlace(place, "your squad"));

// ---------- State ----------

function stats() {
  return { ...state.progress, steps: stepsFromMeters(state.progress.walked) };
}

function persist() {
  save("progress", state.progress);
  save("found", state.found);
  save("album", state.album);
  save("xp", state.xp);
  save("trail", state.trailChoice);
}

function setState(patch) {
  state = { ...state, ...patch };
  render();
}

// Applies a progress change, saves it, and announces rank-ups.
function award(progressPatch, agent) {
  state = { ...state, progress: { ...state.progress, ...progressPatch } };
  persist();
  render();
  checkRankUp(agent);
}

function checkRankUp(agent) {
  const rank = rankFor(scoreFor(stats())).current;
  if (rank.name === state.rankName) return;
  state = { ...state, rankName: rank.name };
  const message = `Rank up! You're now ${rank.emoji} ${rank.name}. New trail unlocked: ${rank.trail.flowers[0]} ${rank.trail.name}!`;
  setStatus(message);
  speakMemo(message, agent ?? agentById("scout"));
  render();
}

const gainXp = (agentId) => ({ xp: { ...state.xp, [agentId]: state.xp[agentId] + 1 } });

function nearbyCapturable(position) {
  const captured = new Set(state.album.map((card) => card.id));
  return state.found.find(
    (place) => !captured.has(place.id) && distanceMeters(position, place) <= CAPTURE_RADIUS_M,
  ) ?? null;
}

// ---------- Rendering ----------

function renderStats() {
  const { steps, landmarksFound } = stats();
  $("stat-steps").textContent = `${steps.toLocaleString()} steps`;
  $("stat-blooms").textContent = `${state.blooms} blooms`;
  $("stat-landmarks").textContent = `${landmarksFound} landmarks`;
  $("btn-demo-walk").disabled = state.walking;
  $("btn-capture").disabled = !state.capturable || state.walking;
  $("btn-capture").textContent = state.capturable ? `📸 Capture ${state.capturable.title}` : "📸 Capture";
  const score = scoreFor(stats());
  renderRankBadge($("rank-badge"), rankFor(score), score);
  map.setTrailStyle(activeTrail(score, state.trailChoice)); // no-op unless the trail changed
}

function renderAgents() {
  $("agents").replaceChildren(
    ...AGENTS.map((agent) => {
      const isAway = state.away.has(agent.id);
      return agentCard(agent, {
        level: levelFor(state.xp[agent.id]),
        isAway,
        disabled: isAway || state.walking || (agent.id === "pathfinder" && !state.discovery),
        onAction: () => ACTIONS[agent.id](agent),
      });
    }),
  );
}

function renderRanks() {
  const score = scoreFor(stats());
  renderRankCard($("rank-card"), rankFor(score), score, stats());
  const scope = SCOPES.find((s) => s.id === state.scope);
  const regionName = state.region[scope.regionKey];
  $("leaderboard-title").textContent = `${scope.label} · ${regionName}`;
  const board = buildLeaderboard(demoPlayers(scope, regionName), { id: "you", name: "You", score });
  renderLeaderboard($("leaderboard"), topWithYou(board, LEADERBOARD_TOP));
  renderTrailPicker($("trails"), TRAILS, {
    score,
    chosenId: state.trailChoice,
    activeId: activeTrail(score, state.trailChoice).id,
    onPick: (trailChoice) => {
      setState({ trailChoice });
      persist();
    },
  });
  document.querySelectorAll("[data-scope]").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.scope === state.scope);
  });
}

function render() {
  renderStats();
  renderAgents();
  renderRanks();
  renderAlbum($("album"), $("album-empty"), state.album);
}

function setStatus(text) {
  $("status").textContent = text;
}

function showTab(tab) {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.setAttribute("aria-selected", String(button.dataset.tab === tab));
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.hidden = panel.id !== `tab-${tab}`;
  });
}

function showPostcard(discovery) {
  const agent = agentById(discovery.agentId);
  $("postcard-art").innerHTML = postcardSvg(discovery.place.title, agent);
  $("postcard-from").textContent = `Postcard from ${agent.name}`;
  $("postcard-title").textContent = discovery.place.title;
  $("postcard-fact").textContent = discovery.summary.extract || "No description available.";
  $("postcard-meta").textContent = `${Math.round(discovery.place.distance)} m away`;
  $("postcard-source").href = discovery.summary.url;
  const photo = $("postcard-photo");
  photo.hidden = !discovery.summary.photo;
  if (discovery.summary.photo) {
    photo.src = discovery.summary.photo;
    photo.alt = `Photo of ${discovery.place.title}`;
  }
  $("postcard").showModal();
}

// ---------- Agent actions ----------

function animateProgress(agentId, durationMs) {
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / durationMs);
      const bar = $(`progress-${agentId}`);
      if (bar) bar.style.width = `${t * 100}%`;
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

async function runExpedition(agent) {
  setState({ away: new Set([...state.away, agent.id]) });
  setStatus(`${agent.name} is looking around…`);
  try {
    const places = await findNearbyPlaces(state.position);
    const knownIds = new Set([...state.visited, ...state.found.map((p) => p.id)]);
    const place = choosePlace(places, state.position, knownIds);
    if (!place) {
      setStatus(`${agent.name} couldn't find anywhere new nearby. Try walking somewhere else!`);
      return;
    }
    setStatus(`${agent.name} is heading toward ${place.title}…`);
    const [summary] = await Promise.all([
      getPlaceSummary(place.title),
      animateProgress(agent.id, expeditionDuration(place.distance)),
    ]);
    const memo = scoutMemo(place, summary);
    const foundPlace = { id: place.id, title: place.title, lat: place.lat, lon: place.lon, photo: summary.photo };
    map.addPlace(place, agent.name);
    state = { ...state, discovery: { place, summary, memo, agentId: agent.id }, found: [...state.found, foundPlace], ...gainXp(agent.id) };
    setStatus(`${agent.name} found ${place.title}!`);
    award({ landmarksFound: state.progress.landmarksFound + 1 }, agent);
    showPostcard(state.discovery);
    speakMemo(memo, agent);
  } catch (error) {
    console.error("Expedition failed:", error);
    setStatus(`${agent.name} got lost (network problem). Try again in a moment.`);
  } finally {
    setState({ away: new Set([...state.away].filter((id) => id !== agent.id)) });
  }
}

async function tellStory(agent) {
  setStatus(`${agent.name} is remembering a story…`);
  try {
    const [nearest] = (await findNearbyPlaces(state.position))
      .map((p) => ({ ...p, distance: distanceMeters(state.position, p) }))
      .sort((a, b) => a.distance - b.distance);
    if (!nearest) {
      setStatus(`${agent.name} doesn't know any stories about this spot.`);
      return;
    }
    const memo = storyMemo(nearest, await getPlaceSummary(nearest.title));
    setStatus(memo);
    speakMemo(memo, agent);
    setState(gainXp(agent.id));
    persist();
  } catch (error) {
    console.error("Story failed:", error);
    setStatus(`${agent.name} forgot the story (network problem).`);
  }
}

async function guideToDiscovery(agent) {
  const target = state.discovery?.place;
  if (!target) return;
  $("postcard").close();
  setStatus(`${agent.name} is planning a route…`);
  const route = await getWalkingRoute(state.position, target);
  map.showRoute(route.points);
  speakMemo(routeMemo(target, route), agent);
  setState(gainXp(agent.id));
  persist();
  await walkAlong(route.points);
  // Routes end on the nearest path, which can be a bit away from the landmark itself.
  const arrived = state.found.find((p) => p.id === target.id) ?? null;
  setState({ visited: new Set([...state.visited, target.id]), discovery: null, capturable: arrived });
  setStatus(`You made it to ${target.title}! 🌸 Tap 📸 Capture to add it to your album.`);
  speakMemo(`We made it to ${target.title}! Quick, take a picture!`, agent);
}

const ACTIONS = { scout: runExpedition, storyteller: tellStory, pathfinder: guideToDiscovery };

// ---------- Capture ----------

async function openCapture() {
  const place = state.capturable;
  if (!place) return;
  const scout = agentById("scout");
  $("capture-title").textContent = place.title;
  $("capture-creature").innerHTML = creatureSvg(scout, levelFor(state.xp.scout));
  $("capture").showModal();

  const video = $("camera");
  const fallback = $("capture-fallback");
  cameraStream = await startCamera(video);
  video.hidden = !cameraStream;
  fallback.hidden = Boolean(cameraStream) || !place.photo;
  if (!cameraStream && place.photo) fallback.src = place.photo;
  $("capture-hint").textContent = cameraStream
    ? "Line up the landmark in the frame, then capture."
    : "No camera here, so this uses the landmark's Wikipedia photo.";
}

function closeCapture() {
  stopCamera(cameraStream, $("camera"));
  cameraStream = null;
  if ($("capture").open) $("capture").close();
}

async function snap() {
  const place = state.capturable;
  if (!place) return;
  const scout = agentById("scout");
  $("btn-snap").disabled = true;
  try {
    const image = await composePostcard({
      source: cameraStream ? $("camera") : place.photo,
      place,
      agent: scout,
      level: levelFor(state.xp.scout),
      date: new Date(),
    });
    const card = { id: place.id, title: place.title, image, date: new Date().toISOString(), agentId: scout.id };
    state = { ...state, album: [card, ...state.album].slice(0, ALBUM_MAX_CARDS), capturable: null };
    closeCapture();
    setStatus(`${place.title} added to your album!`);
    speakMemo(`Got it! ${place.title} is in your album.`, scout);
    award({ landmarksCaptured: state.progress.landmarksCaptured + 1 }, scout);
    showTab("album");
  } catch (error) {
    console.error("Capture failed:", error);
    setStatus("Couldn't make the postcard. Try again.");
  } finally {
    $("btn-snap").disabled = false;
  }
}

// ---------- Walking ----------

// Called every animation frame, so it only updates the stats, not the agent cards.
function stepTo(position, { countDistance = true } = {}) {
  const moved = countDistance ? distanceMeters(state.position, position) : 0;
  const blooms = map.moveTo(position);
  const progress = { ...state.progress, walked: state.progress.walked + moved };
  state = { ...state, position, blooms, progress, capturable: updatedCapturable(position) };
  renderStats();
}

// Keep the landmark you arrived at capturable until you walk well away from it.
function updatedCapturable(position) {
  const nearby = nearbyCapturable(position);
  if (nearby) return nearby;
  const current = state.capturable;
  return current && distanceMeters(position, current) <= CAPTURE_RADIUS_M * 3 ? current : null;
}

function walkAlong(points) {
  setState({ walking: true, capturable: null });
  return new Promise((resolve) => {
    let segment = 0;
    let progress = 0; // meters into the current segment
    let last = performance.now();
    const tick = (now) => {
      progress += (DEMO_WALK_SPEED_MPS * (now - last)) / 1000;
      last = now;
      while (segment < points.length - 1) {
        const length = distanceMeters(points[segment], points[segment + 1]);
        if (progress < length) break;
        progress -= length;
        segment += 1;
      }
      if (segment >= points.length - 1) {
        stepTo(points[points.length - 1]);
        persist();
        setState({ walking: false });
        checkRankUp(null);
        resolve();
        return;
      }
      const length = distanceMeters(points[segment], points[segment + 1]);
      stepTo(interpolate(points[segment], points[segment + 1], length ? progress / length : 1));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

async function demoWalk() {
  setStatus("Going for a little walk…");
  try {
    const places = await findNearbyPlaces(state.position);
    const target = choosePlace(places, state.position, state.visited);
    if (!target) {
      setStatus("Nowhere new to walk to nearby.");
      return;
    }
    const route = await getWalkingRoute(state.position, target);
    const rankBefore = state.rankName;
    await walkAlong(route.points);
    if (state.rankName === rankBefore) setStatus(`Walked to ${target.title}. Send Pip to explore from here!`);
  } catch (error) {
    console.error("Demo walk failed:", error);
    setStatus("Couldn't plan a walk (network problem).");
  }
}

function useMyLocation() {
  if (!("geolocation" in navigator)) {
    setStatus("This browser can't share your location.");
    return;
  }
  setStatus("Finding you…");
  let firstFix = true;
  navigator.geolocation.watchPosition(
    async (pos) => {
      const position = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      if (firstFix) {
        firstFix = false;
        map.recenter(position);
        // The jump from the default start point to your real location isn't walking.
        if (!state.walking) stepTo(position, { countDistance: false });
        setStatus("Live walking on. Your path will bloom as you move.");
        setState({ region: await getRegion(position, state.region) });
        return;
      }
      if (!state.walking) stepTo(position);
      persist();
    },
    (error) => setStatus(`Location unavailable: ${error.message}`),
    { enableHighAccuracy: true },
  );
}

function resetProgress() {
  if (!window.confirm("Reset your steps, landmarks, album, and agent levels?")) return;
  clearAll(SAVED_KEYS);
  setState({
    progress: EMPTY_PROGRESS,
    found: [],
    album: [],
    xp: Object.fromEntries(AGENTS.map((a) => [a.id, 0])),
    trailChoice: "auto",
    rankName: RANK_START,
    capturable: null,
    discovery: null,
  });
  setStatus("Progress reset. Fresh start! 🌱");
}

// ---------- Wiring ----------

$("btn-demo-walk").addEventListener("click", demoWalk);
$("btn-locate").addEventListener("click", useMyLocation);
$("btn-capture").addEventListener("click", openCapture);
$("btn-snap").addEventListener("click", snap);
$("btn-capture-cancel").addEventListener("click", closeCapture);
$("capture").addEventListener("cancel", closeCapture); // Esc key
$("btn-reset").addEventListener("click", resetProgress);
$("rank-badge").addEventListener("click", () => showTab("ranks"));
$("btn-close").addEventListener("click", () => $("postcard").close());
$("btn-go").addEventListener("click", () => guideToDiscovery(agentById("pathfinder")));
$("btn-replay-memo").addEventListener("click", () => {
  if (state.discovery) speakMemo(state.discovery.memo, agentById(state.discovery.agentId));
});
document.querySelectorAll("[data-tab]").forEach((button) => {
  button.addEventListener("click", () => showTab(button.dataset.tab));
});
document.querySelectorAll("[data-scope]").forEach((chip) => {
  chip.addEventListener("click", () => setState({ scope: chip.dataset.scope }));
});

render();
