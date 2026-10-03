// Leaderboards. Other players are deterministic sample data until there is a
// backend; the real app fetches these rows from the server per region.
import { hashString } from "./geo.js";

export const SCOPES = Object.freeze([
  { id: "local", label: "Local", regionKey: "local", size: 15, maxScore: 1600 },
  { id: "state", label: "Statewide", regionKey: "state", size: 25, maxScore: 5000 },
  { id: "national", label: "National", regionKey: "national", size: 40, maxScore: 12000 },
]);

const DEMO_NAMES = [
  "TrailBlazer", "MossyMaya", "SproutSam", "PetalPete", "GorgeWalker", "FernFan",
  "BloomBot", "QuadQueen", "SlopeHiker", "AcornAce", "LilyLopes", "CloverKai",
  "WillowWu", "MapleMo", "DaisyDev", "OakOlu", "IvyIsa", "AsterAri",
  "BirchBen", "PoppyPark", "RowanRay", "HazelHo", "SageSol", "JuniperJo",
  "LarkLee", "RiverRen", "MeadowMei", "PinePrya", "BrambleBo", "ThistleTi",
  "LotusLu", "CedarCy", "WrenWen", "AlderAl", "HollyHan", "BasilBea",
  "TulipTae", "OrchidOz", "SorrelSky", "YarrowYu",
];

// mulberry32: small seeded random generator so sample data is stable.
function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function demoPlayers(scope, regionName) {
  const random = seededRandom(hashString(`${scope.id}:${regionName}`));
  const offset = Math.floor(random() * DEMO_NAMES.length);
  return Array.from({ length: scope.size }, (_, i) => ({
    id: `demo-${scope.id}-${i}`,
    name: DEMO_NAMES[(offset + i) % DEMO_NAMES.length],
    score: Math.round(random() ** 2 * scope.maxScore),
    isYou: false,
  }));
}

export function buildLeaderboard(players, you) {
  return [...players, { ...you, isYou: true }]
    .sort((a, b) => b.score - a.score)
    .map((player, i) => ({ ...player, position: i + 1 }));
}

// Top N rows, plus your own row at the end if you're not in the top N.
export function topWithYou(board, count) {
  const top = board.slice(0, count);
  const you = board.find((p) => p.isYou);
  return top.some((p) => p.isYou) || !you ? top : [...top, you];
}
