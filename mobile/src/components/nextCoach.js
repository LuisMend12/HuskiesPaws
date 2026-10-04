// Pure coach logic for the sheet: what to do next, and how a tap should follow it.
import { distanceMeters } from "../core/geo.js";
import { eggProgress } from "../core/pets.js";

function readyEgg(state) {
  const walked = state.progress?.walked ?? 0;
  return (state.eggs ?? []).find((egg) => eggProgress(egg, walked) >= 1) ?? null;
}

export function remainingWalkMeters(state) {
  const points = state.route;
  if (!points?.length || !state.position) {
    const hinted = state.guide?.meters;
    return Number.isFinite(hinted) ? Math.round(hinted) : null;
  }
  let nearest = 0;
  let best = Infinity;
  for (let i = 0; i < points.length; i += 1) {
    const d = distanceMeters(state.position, points[i]);
    if (d < best) {
      best = d;
      nearest = i;
    }
  }
  let rest = 0;
  for (let i = nearest; i < points.length - 1; i += 1) {
    rest += distanceMeters(points[i], points[i + 1]);
  }
  return Math.max(0, Math.round(rest));
}

export function formatMeters(m) {
  if (m == null || !Number.isFinite(m)) return null;
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}

export function walkHud(state) {
  if (!state.walking && !state.guide && !state.planning) return null;
  if (state.planning) return "Planning a route…";
  const left = formatMeters(remainingWalkMeters(state));
  const dest = state.guide?.place?.title ?? state.discovery?.place?.title;
  if (left && dest) return `${dest} · ${left} left`;
  if (left) return `${left} left`;
  return dest ? `Walking to ${dest}` : "On the trail";
}

export function nextStep(state) {
  if (state.hatching) {
    return { title: "Your egg hatched", body: `Meet ${state.hatching.name}!`, cta: null, intent: null };
  }
  if (state.capturable && !state.walking) {
    return {
      title: "Capture this place",
      body: `Save ${state.capturable.title} to your album.`,
      cta: "Capture",
      intent: "capture",
    };
  }
  if (readyEgg(state) && !state.walking && !state.planning) {
    return {
      title: "An egg is ready",
      body: state.issOverhead ? "Hatch now — the ISS makes rarer pets more likely." : "Tap to hatch it.",
      cta: "Hatch",
      intent: "hatch",
    };
  }
  if (state.planning) {
    return { title: "Planning a route", body: "Hang on — a path is being drawn.", cta: null, intent: null };
  }
  if (state.walking) {
    const left = formatMeters(remainingWalkMeters(state));
    const dest = state.guide?.place?.title ?? state.discovery?.place?.title;
    return {
      title: state.demoMode ? "Practice walk" : "On the trail",
      body: left
        ? `${dest ? `${dest} · ` : ""}${left} left. Flowers bloom as you go.`
        : "Flowers bloom along the path as you go.",
      cta: null,
      intent: null,
    };
  }
  if (state.guide) {
    return {
      title: "Walk there",
      body: `Head to ${state.guide.place.title}. We'll cheer when you arrive.`,
      cta: "Open place",
      intent: "guide",
    };
  }
  if (state.discovery) {
    return {
      title: "A place is waiting",
      body: `Walk to ${state.discovery.place.title}, then capture it.`,
      cta: "See postcard",
      intent: "postcard",
    };
  }
  if (state.away?.length) {
    const trip = state.expedition;
    const left = trip ? Math.max(0, Math.ceil((trip.startedAt + trip.durationMs - Date.now()) / 1000)) : null;
    return {
      title: "Exploring",
      body: left != null ? `Your scout is looking. Back in ${left}s.` : "Your scout is looking for somewhere new.",
      cta: null,
      intent: null,
    };
  }
  if (!state.progress.landmarksFound) {
    return {
      title: "Find a place",
      body: "Open Squad and send your Scout exploring.",
      cta: "Open Squad",
      intent: "squad",
    };
  }
  return {
    title: "Keep exploring",
    body: "Tap a landmark on the map, or send a Scout.",
    cta: "Open Squad",
    intent: "squad",
  };
}

export function followNext(state, game, openLandmark) {
  const { intent } = nextStep(state);
  if (intent === "capture") game.set({ captureOpen: true });
  else if (intent === "hatch") {
    game.set({ tab: "pets" });
    game.hatchEgg?.();
  } else if (intent === "guide" && state.guide?.place?.id) openLandmark?.(state.guide.place.id);
  else if (intent === "postcard") game.set({ postcardOpen: true });
  else if (intent === "squad") game.set({ tab: "squad" });
}

export function eggIsReady(state) {
  return Boolean(readyEgg(state));
}
