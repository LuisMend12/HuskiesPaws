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
    grokVoice: "ara",
  },
  {
    id: "storyteller",
    name: "Moss",
    role: "Storyteller: shares the history of what's nearby",
    action: "Tell a story",
    color: "#9575cd",
    leaf: "#2e7d32",
    voice: { pitch: 0.9, rate: 0.95 },
    grokVoice: "rex",
  },
  {
    id: "pathfinder",
    name: "Fern",
    role: "Pathfinder: leads you to discoveries",
    action: "Guide me",
    color: "#4fc3f7",
    leaf: "#66bb6a",
    voice: { pitch: 1.2, rate: 1.0 },
    grokVoice: "eve",
  },
]);

export const levelFor = (xp) => Math.floor(xp / XP_PER_LEVEL) + 1;

export function expeditionDuration(meters) {
  const ms = meters * EXPEDITION_MS_PER_METER;
  return Math.min(EXPEDITION_MAX_MS, Math.max(EXPEDITION_MIN_MS, ms));
}

// Pick a not-yet-visited place among the closest candidates at least minDistance away.
export function choosePlace(places, position, visitedIds, { random = Math.random, minDistance = MIN_PLACE_DISTANCE_M } = {}) {
  const candidates = places
    .filter((p) => !visitedIds.has(p.id))
    .map((p) => ({ ...p, distance: distanceMeters(position, p) }))
    .filter((p) => p.distance >= minDistance)
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

// Moss's story: opening, place name, up to STORY_SENTENCES sentences from the
// Wikipedia extract (the only source of facts), and a closing invitation.
// Stays within STORY_MAX_CHARS so the server's text-to-speech accepts it.
export const STORY_MAX_CHARS = 600;
const STORY_SENTENCES = 3;
const STORY_CLOSING = "Shall we wander over and see it for ourselves?";
const STORY_NO_EXTRACT = "The old books are quiet about this one, so its story is still waiting to be found.";

function clipWords(text, maxChars) {
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, Math.max(0, maxChars - 3));
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim()}...`;
}

export function storyMemo(place, summary) {
  const opening = `Gather round, sprouts! Let me tell you about ${place.title}.`;
  const extract = (summary?.extract ?? "").trim();
  const build = (story) => [opening, story, STORY_CLOSING].join(" ");
  if (!extract) return build(STORY_NO_EXTRACT);
  for (let count = STORY_SENTENCES; count > 0; count -= 1) {
    const memo = build(firstSentences(extract, count));
    if (memo.length <= STORY_MAX_CHARS) return memo;
  }
  const room = STORY_MAX_CHARS - build("").length;
  return build(clipWords(firstSentences(extract, 1), room));
}

export function routeMemo(place, route) {
  if (route.approximate) {
    return `I couldn't reach the route map, so follow the straight line to ${place.title}. Watch for paths and roads!`;
  }
  const minutes = walkingMinutes(route.distance, WALKING_SPEED_MPS);
  return `Route to ${place.title} is ready: ${Math.round(route.distance)} meters, about ${minutes} minutes. Let's make it bloom!`;
}
