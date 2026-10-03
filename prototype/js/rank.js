// Rank system: steps walked + landmarks found + landmarks captured = points.
import { POINTS, STEP_LENGTH_M } from "./config.js";

export const RANKS = Object.freeze([
  { name: "Seedling", emoji: "🌱", min: 0 },
  { name: "Sprout", emoji: "🌿", min: 100 },
  { name: "Bud", emoji: "🌷", min: 300 },
  { name: "Blossom", emoji: "🌸", min: 700 },
  { name: "Grove", emoji: "🌳", min: 1500 },
  { name: "Ancient Oak", emoji: "🌲", min: 3000 },
]);

export const stepsFromMeters = (meters) => Math.round(meters / STEP_LENGTH_M);

export function scoreFor({ steps, landmarksFound, landmarksCaptured }) {
  return (
    Math.floor(steps / POINTS.stepsPerPoint) +
    landmarksFound * POINTS.landmarkFound +
    landmarksCaptured * POINTS.landmarkCaptured
  );
}

export function rankFor(score) {
  const index = RANKS.findLastIndex((rank) => score >= rank.min);
  const current = RANKS[Math.max(0, index)];
  const next = RANKS[index + 1] ?? null;
  const progress = next ? (score - current.min) / (next.min - current.min) : 1;
  return { current, next, progress };
}
