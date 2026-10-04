// Pure coach logic for the sheet: what to do next, and how a tap should follow it.
import { eggProgress } from "../core/pets.js";

function readyEgg(state) {
  const walked = state.progress?.walked ?? 0;
  return (state.eggs ?? []).find((egg) => eggProgress(egg, walked) >= 1) ?? null;
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
    return {
      title: state.demoMode ? "Practice walk" : "On the trail",
      body: "Flowers bloom along the path as you go.",
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
    return { title: "Exploring", body: "Your scout is looking for somewhere new.", cta: null, intent: null };
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
