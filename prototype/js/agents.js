// Agent definitions and the decisions they make. Memo text is built only from
// tool results (Wikipedia, routing), so agents cannot invent facts about places.
import {
  EXPEDITION_MAX_MS,
  EXPEDITION_MIN_MS,
  EXPEDITION_MS_PER_METER,
  MIN_PLACE_DISTANCE_M,
  SCOUT_CANDIDATES,
  WALKING_SPEED_MPS,
  XP_PER_LEVEL,
} from "./config.js";
import { distanceMeters, walkingMinutes } from "./geo.js";

export const AGENTS = Object.freeze([
  {
    id: "scout",
    name: "Pip",
    role: "Scout: finds places you've never been",
    action: "Explore",
    color: "#ffb74d",
    leaf: "#43a047",
    voice: { pitch: 1.5, rate: 1.1 },
  },
  {
    id: "storyteller",
    name: "Moss",
    role: "Storyteller: shares the history of what's nearby",
    action: "Tell a story",
    color: "#9575cd",
    leaf: "#2e7d32",
    voice: { pitch: 0.9, rate: 0.95 },
  },
  {
    id: "pathfinder",
    name: "Fern",
    role: "Pathfinder: leads you to discoveries",
    action: "Guide me",
    color: "#4fc3f7",
    leaf: "#66bb6a",
    voice: { pitch: 1.2, rate: 1.0 },
  },
]);

export const levelFor = (xp) => Math.floor(xp / XP_PER_LEVEL) + 1;

export function expeditionDuration(meters) {
  const ms = meters * EXPEDITION_MS_PER_METER;
  return Math.min(EXPEDITION_MAX_MS, Math.max(EXPEDITION_MIN_MS, ms));
}

// Pick a not-yet-visited place among the closest candidates.
export function choosePlace(places, position, visitedIds, random = Math.random) {
  const candidates = places
    .filter((p) => !visitedIds.has(p.id))
    .map((p) => ({ ...p, distance: distanceMeters(position, p) }))
    .filter((p) => p.distance >= MIN_PLACE_DISTANCE_M)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, SCOUT_CANDIDATES);
  if (candidates.length === 0) return null;
  return candidates[Math.floor(random() * candidates.length)];
}

export function firstSentences(text, count) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  return sentences.slice(0, count).map((s) => s.trim()).join(" ");
}

export function scoutMemo(place, summary) {
  const meters = Math.round(place.distance / 10) * 10;
  const fact = firstSentences(summary.extract, 1);
  return `I'm back! I found ${place.title}, about ${meters} meters away as the crow flies. ${fact} Want me to lead you there?`;
}

export function storyMemo(place, summary) {
  const story = firstSentences(summary.extract, 2);
  return `Gather round! The closest story is ${place.title}. ${story}`;
}

export function routeMemo(place, route) {
  if (route.approximate) {
    return `I couldn't reach the route map, so follow the straight line to ${place.title}. Watch for paths and roads!`;
  }
  const minutes = walkingMinutes(route.distance, WALKING_SPEED_MPS);
  return `Route to ${place.title} is ready: ${Math.round(route.distance)} meters, about ${minutes} minutes. Let's make it bloom!`;
}
