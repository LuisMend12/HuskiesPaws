import { AGENTS, choosePlace, expeditionDuration, levelFor, routeMemo, scoutMemo, storyMemo } from "./agents.js";
import { creatureSvg, postcardSvg } from "./art.js";
import { DEFAULT_CENTER, DEMO_WALK_SPEED_MPS } from "./config.js";
import { distanceMeters, interpolate } from "./geo.js";
import { createMap } from "./map.js";
import { findNearbyPlaces, getPlaceSummary, getWalkingRoute } from "./services.js";
import { speakMemo } from "./voice.js";

const $ = (id) => document.getElementById(id);
const agentById = (id) => AGENTS.find((a) => a.id === id);

let state = {
  position: DEFAULT_CENTER,
  walked: 0,
  blooms: 0,
  walking: false,
  xp: Object.fromEntries(AGENTS.map((a) => [a.id, 0])),
  away: new Set(),
  visited: new Set(),
  discovery: null, // { place, summary, memo, agentId }
};
const setState = (patch) => { state = { ...state, ...patch }; renderAgents(); renderStats(); };

const map = createMap("map", state.position);
state = { ...state, blooms: map.moveTo(state.position) };

// ---------- Rendering ----------

function renderStats() {
  $("stat-distance").textContent = `${Math.round(state.walked)} m walked`;
  $("stat-blooms").textContent = `${state.blooms} blooms`;
  $("btn-demo-walk").disabled = state.walking;
}

function renderAgents() {
  const list = $("agents");
  list.replaceChildren(...AGENTS.map(agentCard));
}

function agentCard(agent) {
  const level = levelFor(state.xp[agent.id]);
  const isAway = state.away.has(agent.id);
  const li = document.createElement("li");
  li.className = `agent${isAway ? " away" : ""}`;
  li.innerHTML = creatureSvg(agent, level); // static, trusted markup

  const info = document.createElement("div");
  const name = document.createElement("div");
  name.className = "agent-name";
  name.textContent = `${agent.name} · Lv ${level}`;
  const role = document.createElement("div");
  role.className = "agent-role";
  role.textContent = isAway ? "On an expedition…" : agent.role;
  const progress = document.createElement("div");
  progress.className = "agent-progress";
  progress.innerHTML = `<div id="progress-${agent.id}"></div>`;
  info.append(name, role, progress);

  const button = document.createElement("button");
  button.textContent = agent.action;
  button.disabled = isAway || state.walking || (agent.id === "pathfinder" && !state.discovery);
  button.addEventListener("click", () => ACTIONS[agent.id](agent));

  li.append(info, button);
  return li;
}

function setStatus(text) {
  $("status").textContent = text;
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
    const place = choosePlace(places, state.position, state.visited);
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
    const discovery = { place, summary, memo, agentId: agent.id };
    map.addPlace(place, agent.name);
    setState({ discovery, xp: { ...state.xp, [agent.id]: state.xp[agent.id] + 1 } });
    setStatus(`${agent.name} found ${place.title}!`);
    showPostcard(discovery);
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
    const summary = await getPlaceSummary(nearest.title);
    const memo = storyMemo(nearest, summary);
    setStatus(memo);
    speakMemo(memo, agent);
    setState({ xp: { ...state.xp, [agent.id]: state.xp[agent.id] + 1 } });
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
  setState({ xp: { ...state.xp, [agent.id]: state.xp[agent.id] + 1 } });
  await walkAlong(route.points);
  setState({ visited: new Set([...state.visited, state.discovery.place.id]), discovery: null });
  setStatus(`You made it to ${target.title}! 🌸`);
  speakMemo(`We made it to ${target.title}! Look at all those flowers behind us.`, agent);
}

const ACTIONS = { scout: runExpedition, storyteller: tellStory, pathfinder: guideToDiscovery };

// ---------- Walking ----------

// Called every animation frame, so it only updates the stats, not the agent cards.
function stepTo(position, { countDistance = true } = {}) {
  const walked = state.walked + (countDistance ? distanceMeters(state.position, position) : 0);
  const blooms = map.moveTo(position);
  state = { ...state, position, walked, blooms };
  renderStats();
}

function walkAlong(points) {
  setState({ walking: true });
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
        setState({ walking: false });
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
    await walkAlong(route.points);
    setStatus(`Walked to ${target.title}. Send Pip to explore from here!`);
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
    (pos) => {
      const position = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      if (firstFix) map.recenter(position);
      // The jump from the default start point to your real location isn't walking.
      if (!state.walking) stepTo(position, { countDistance: !firstFix });
      firstFix = false;
      setStatus("Live walking on. Your path will bloom as you move.");
    },
    (error) => setStatus(`Location unavailable: ${error.message}`),
    { enableHighAccuracy: true },
  );
}

// ---------- Wiring ----------

$("btn-demo-walk").addEventListener("click", demoWalk);
$("btn-locate").addEventListener("click", useMyLocation);
$("btn-close").addEventListener("click", () => $("postcard").close());
$("btn-go").addEventListener("click", () => guideToDiscovery(agentById("pathfinder")));
$("btn-replay-memo").addEventListener("click", () => {
  if (state.discovery) speakMemo(state.discovery.memo, agentById(state.discovery.agentId));
});

renderAgents();
renderStats();
