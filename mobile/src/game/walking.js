// Movement: simulated walks, live GPS, the step counter, blooms and trails.
import * as Location from "expo-location";
import { Pedometer } from "expo-sensors";
import { BLOOM_EVERY_M, CAPTURE_RADIUS_M, DEMO_WALK_SPEED_MPS } from "../core/config.js";
import { addDaySteps, mergeDayLogs, todayKey } from "../core/dayLog.js";
import { distanceMeters, interpolate } from "../core/geo.js";
import { stepsFromMeters, walkingXpFromSteps } from "../core/rank.js";
import { currentTrail } from "./state.js";

const WALK_TICK_MS = 100; // 10 updates a second is smooth enough and cheap to render
const MAX_BLOOMS = 150; // keep the map fast: oldest flowers fade out
const BLOOM_COLORS = ["#f48fb1", "#ffd54f", "#2e9d4f", "#6ec6ff", "#ff7a59"];
const ARRIVAL_RADIUS_M = 40;
const MID_WALK_EVERY = 10; // ticks: check eggs about once a second during a simulated walk

const toCoord = (p) => ({ latitude: p.lat, longitude: p.lon });

export function createWalking(store, { onArrive, onRegionFound, persist, onWalk } = {}) {
  const get = store.getState;
  let lastBloom = null;
  let bloomCount = 0;
  let stepsLast = null;
  let cancelWalk = null;
  let locationSubscription = null;
  let stepSubscription = null;
  let watchEpoch = 0;
  let locationStart = null;

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
    const color = BLOOM_COLORS[bloomCount % BLOOM_COLORS.length];
    bloomCount += 1;
    return [...blooms, { id: `${bloomCount}`, ...position, emoji, color }].slice(-MAX_BLOOMS);
  }

  function withWalkXp(progress, addedSteps, boost) {
    return {
      ...progress,
      walkXp: (progress.walkXp ?? 0) + walkingXpFromSteps(addedSteps, boost),
    };
  }

  function bumpDaySteps(added) {
    if (!added || added <= 0) return get().dayLog;
    return addDaySteps(get().dayLog, added);
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
      dayLog: bumpDaySteps(addedSteps),
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
    cancelWalk?.();
    if (!points?.length) return Promise.resolve(false);
    store.setState({ walking: true, capturable: null });
    return new Promise((resolve) => {
      let segment = 0;
      let ticks = 0;
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
          cancelWalk = null;
          stepTo(points.at(-1), { notifyWalk: false });
          store.setState({ walking: false });
          persist();
          onWalk?.();
          resolve(true);
          return;
        }
        const length = distanceMeters(points[segment], points[segment + 1]);
        stepTo(interpolate(points[segment], points[segment + 1], length ? into / length : 1), { notifyWalk: false });
        ticks += 1;
        if (ticks % MID_WALK_EVERY === 0) onWalk?.({ final: false }); // eggs appear and hatch mid-walk
      }, WALK_TICK_MS);
      cancelWalk = () => {
        clearInterval(timer);
        cancelWalk = null;
        store.setState({ walking: false });
        resolve(false);
      };
    });
  }

  async function startPedometer(epoch) {
    try {
      if (!(await Pedometer.isAvailableAsync())) return false;
      const { granted } = await Pedometer.requestPermissionsAsync();
      if (!granted || epoch !== watchEpoch) return false;
      try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const counted = await Pedometer.getStepCountAsync(start, new Date());
        if (epoch === watchEpoch && Number.isFinite(counted?.steps) && counted.steps > 0) {
          store.setState({
            dayLog: mergeDayLogs(get().dayLog, { date: todayKey(), steps: Math.floor(counted.steps), places: [] }),
          });
        }
      } catch { /* Android / Expo Go may not support a daily query. */ }
      stepSubscription = Pedometer.watchStepCount(({ steps }) => {
        if (epoch !== watchEpoch) return;
        const added = stepsLast === null ? steps : steps - stepsLast;
        stepsLast = steps;
        if (added <= 0 || get().walking || get().resetting) return;
        const state = get();
        store.setState({
          progress: withWalkXp(
            { ...state.progress, steps: state.progress.steps + added },
            added,
            state.xpBoost ?? 1,
          ),
          dayLog: bumpDaySteps(added),
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

  async function beginLocation(epoch) {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (epoch !== watchEpoch) return false;
    if (!granted) {
      store.setState({ status: "Location permission denied. Demo walks still work." });
      return false;
    }
    const hasPedometer = await startPedometer(epoch);
    if (epoch !== watchEpoch) return false;
    let firstFix = true;
    const subscription = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 5 },
      ({ coords }) => {
        const position = { lat: coords.latitude, lon: coords.longitude };
        if (epoch !== watchEpoch || get().walking || get().resetting) return;
        stepTo(position, { countDistance: !firstFix, countSteps: !hasPedometer });
        if (firstFix) {
          firstFix = false;
          store.setState({ mapFocus: { ...position, key: Date.now() } });
          onRegionFound?.(position);
        }
        persist();
      },
      (error) => { if (epoch === watchEpoch) store.setState({ status: `Location unavailable: ${error}` }); },
    );
    if (epoch !== watchEpoch) { subscription.remove(); return false; }
    locationSubscription = subscription;
    store.setState({ liveLocation: true, status: "Live walking on. Your path will bloom as you move." });
    return true;
  }

  function startLiveLocation() {
    if (get().resetting || !get().loaded) return Promise.resolve(false);
    if (get().liveLocation) return Promise.resolve(true);
    if (locationStart) return locationStart;
    const epoch = ++watchEpoch;
    const pending = beginLocation(epoch).catch(() => {
      if (epoch === watchEpoch) {
        stop();
        store.setState({ status: "Location unavailable. Try Go live again." });
      }
      return false;
    }).finally(() => { if (locationStart === pending) locationStart = null; });
    locationStart = pending;
    return pending;
  }

  function resetTrail() {
    lastBloom = null;
    bloomCount = 0;
  }

  function stop() {
    watchEpoch += 1;
    locationStart = null;
    cancelWalk?.();
    locationSubscription?.remove();
    stepSubscription?.remove();
    locationSubscription = null;
    stepSubscription = null;
    stepsLast = null;
    store.setState({ liveLocation: false, pedometer: false });
  }

  return { stepTo, walkAlong, startLiveLocation, resetTrail, stop };
}
