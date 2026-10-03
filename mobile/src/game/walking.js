// Movement: simulated walks, live GPS, the step counter, blooms and trails.
import * as Location from "expo-location";
import { Pedometer } from "expo-sensors";
import { BLOOM_EVERY_M, CAPTURE_RADIUS_M, DEMO_WALK_SPEED_MPS } from "../core/config.js";
import { distanceMeters, interpolate } from "../core/geo.js";
import { stepsFromMeters, walkingXpFromSteps } from "../core/rank.js";
import { currentTrail } from "./state.js";

const WALK_TICK_MS = 100; // 10 updates a second is smooth enough and cheap to render
const MAX_BLOOMS = 150; // keep the map fast: oldest flowers fade out
const ARRIVAL_RADIUS_M = 40;

const toCoord = (p) => ({ latitude: p.lat, longitude: p.lon });

export function createWalking(store, { onArrive, onRegionFound, persist, onWalk } = {}) {
  const get = store.getState;
  let lastBloom = null;
  let bloomCount = 0;
  let stepsLast = null;

  function capturableAt(position, state) {
    const captured = new Set(state.album.map((card) => card.id));
    const nearby = state.found.find(
      (p) => !captured.has(p.id) && distanceMeters(position, p) <= CAPTURE_RADIUS_M,
    );
    if (nearby) return nearby;
    const current = state.capturable;
    return current && distanceMeters(position, current) <= CAPTURE_RADIUS_M * 3 ? current : null;
  }

  function extendTrail(segments, position, trail) {
    const coord = toCoord(position);
    const last = segments.at(-1);
    if (last && last.trailId === trail.id) {
      return [...segments.slice(0, -1), { ...last, coords: [...last.coords, coord] }];
    }
    const start = last ? [last.coords.at(-1), coord] : [coord];
    return [...segments, { id: `${segments.length}`, trailId: trail.id, color: trail.color, coords: start }];
  }

  function bloomsAfter(blooms, position, trail) {
    if (lastBloom && distanceMeters(lastBloom, position) < BLOOM_EVERY_M) return blooms;
    lastBloom = position;
    const emoji = trail.flowers[bloomCount % trail.flowers.length];
    bloomCount += 1;
    return [...blooms, { id: `${bloomCount}`, ...position, emoji }].slice(-MAX_BLOOMS);
  }

  function withWalkXp(progress, addedSteps, boost) {
    return {
      ...progress,
      walkXp: (progress.walkXp ?? 0) + walkingXpFromSteps(addedSteps, boost),
    };
  }

  // countSteps: estimate steps from distance (simulated walks, or no pedometer).
  function stepTo(position, { countDistance = true, countSteps = true, notifyWalk = true } = {}) {
    const state = get();
    const moved = countDistance ? distanceMeters(state.position, position) : 0;
    const addedSteps = countSteps ? stepsFromMeters(moved) : 0;
    const progress = withWalkXp(
      {
        ...state.progress,
        walked: state.progress.walked + moved,
        steps: state.progress.steps + addedSteps,
      },
      addedSteps,
      state.xpBoost ?? 1,
    );
    const trail = currentTrail({ ...state, progress });
    store.setState({
      position,
      progress,
      blooms: bloomsAfter(state.blooms, position, trail),
      trailSegments: extendTrail(state.trailSegments, position, trail),
      capturable: capturableAt(position, state),
    });
    checkArrival(position);
    if (notifyWalk) onWalk?.();
  }

  function checkArrival(position) {
    const { guide } = get();
    if (guide && distanceMeters(position, guide.place) <= ARRIVAL_RADIUS_M) onArrive(guide.place, guide.meters);
  }

  function walkAlong(points) {
    store.setState({ walking: true, capturable: null });
    return new Promise((resolve) => {
      let segment = 0;
      let into = 0; // meters into the current segment
      const timer = setInterval(() => {
        into += (DEMO_WALK_SPEED_MPS * WALK_TICK_MS) / 1000;
        while (segment < points.length - 1) {
          const length = distanceMeters(points[segment], points[segment + 1]);
          if (into < length) break;
          into -= length;
          segment += 1;
        }
        if (segment >= points.length - 1) {
          clearInterval(timer);
          stepTo(points.at(-1), { notifyWalk: false });
          store.setState({ walking: false });
          persist();
          onWalk?.();
          resolve();
          return;
        }
        const length = distanceMeters(points[segment], points[segment + 1]);
        stepTo(interpolate(points[segment], points[segment + 1], length ? into / length : 1), { notifyWalk: false });
      }, WALK_TICK_MS);
    });
  }

  async function startPedometer() {
    try {
      if (!(await Pedometer.isAvailableAsync())) return false;
      const { granted } = await Pedometer.requestPermissionsAsync();
      if (!granted) return false;
      Pedometer.watchStepCount(({ steps }) => {
        const added = stepsLast === null ? steps : steps - stepsLast;
        stepsLast = steps;
        if (added <= 0) return;
        const state = get();
        store.setState({
          progress: withWalkXp(
            { ...state.progress, steps: state.progress.steps + added },
            added,
            state.xpBoost ?? 1,
          ),
        });
        onWalk?.();
      });
      store.setState({ pedometer: true });
      return true;
    } catch (error) {
      console.warn("Step counter unavailable:", error);
      return false;
    }
  }

  async function startLiveLocation() {
    if (get().liveLocation) return true;
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) {
      store.setState({ status: "Location permission denied. Demo walks still work." });
      return false;
    }
    const hasPedometer = await startPedometer();
    let firstFix = true;
    await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 5 },
      ({ coords }) => {
        const position = { lat: coords.latitude, lon: coords.longitude };
        if (get().walking) return; // a simulated walk is playing
        stepTo(position, { countDistance: !firstFix, countSteps: !hasPedometer });
        if (firstFix) {
          firstFix = false;
          store.setState({ mapFocus: { ...position, key: Date.now() } });
          onRegionFound(position);
        }
        persist();
      },
      (error) => store.setState({ status: `Location unavailable: ${error}` }),
    );
    store.setState({ liveLocation: true, status: "Live walking on. Your path will bloom as you move." });
    return true;
  }

  function resetTrail() {
    lastBloom = null;
    bloomCount = 0;
  }

  return { stepTo, walkAlong, startLiveLocation, resetTrail };
}
