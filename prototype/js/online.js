// Online features through the server: your player identity, live leaderboards,
// and turf. Everything here is optional; without the server the app keeps
// working with sample leaderboards and no turf.
import { apiAvailable, getJson, postJson } from "./api.js";
import { load, save } from "./storage.js";

const SUBMIT_DELAY_MS = 1500; // batch quick score changes into one request
const NAME_MAX = 24;

function newPlayer() {
  const id = `p-${crypto.randomUUID()}`;
  return { id, name: `Husky-${id.slice(-4).toUpperCase()}` };
}

export function createOnline({ onChange }) {
  let player = load("player", null) ?? newPlayer();
  save("player", player);
  let boards = {}; // "scope|region" -> rows from the server
  let turf = { list: [], myHeldXp: 0 };
  let submitTimer = null;
  let lastSubmitted = null;
  const requested = new Set(); // leaderboard keys already fetched once

  const boardKey = (scope, region) => `${scope}|${region}`;

  async function refreshBoard(scope, region) {
    if (!apiAvailable()) return;
    try {
      const params = new URLSearchParams({ scope, region, me: player.id });
      const data = await getJson(`/api/leaderboard?${params}`);
      boards = { ...boards, [boardKey(scope, region)]: data.players };
      onChange();
    } catch (error) {
      console.warn("Leaderboard unavailable:", error);
    }
  }

  async function sendScore(score, region, refresh) {
    try {
      await postJson("/api/score", { playerId: player.id, name: player.name, score, region });
      lastSubmitted = `${score}|${player.name}|${region.local}`;
      await refresh();
    } catch (error) {
      console.warn("Couldn't save score online:", error);
    }
  }

  async function refreshTurf() {
    if (!apiAvailable()) return;
    try {
      const data = await getJson(`/api/turf?me=${encodeURIComponent(player.id)}`);
      turf = { list: data.turf, myHeldXp: data.myHeldXp };
      onChange();
    } catch (error) {
      console.warn("Turf unavailable:", error);
    }
  }

  return {
    available: apiAvailable,
    player: () => player,

    rename(name) {
      const clean = name.trim().replace(/[\u0000-\u001f]/g, "").slice(0, NAME_MAX);
      if (!clean) return false;
      player = { ...player, name: clean };
      save("player", player);
      lastSubmitted = null; // make the next submit go through with the new name
      return true;
    },

    // Your own row is appended when you're not in the top 10.
    rows(scope, region, myScore) {
      const rows = boards[boardKey(scope, region)];
      if (!rows) return null;
      return rows.some((r) => r.isYou) ? rows : [...rows, { position: "—", name: player.name, score: myScore, isYou: true }];
    },

    refreshBoard,

    // Fetches a leaderboard the first time it's shown (renders happen often).
    ensureBoard(scope, region) {
      const key = boardKey(scope, region);
      if (requested.has(key)) return;
      requested.add(key);
      refreshBoard(scope, region);
    },

    submitScore(score, region, scope) {
      if (!apiAvailable() || `${score}|${player.name}|${region.local}` === lastSubmitted) return;
      clearTimeout(submitTimer);
      submitTimer = setTimeout(() => sendScore(score, region, () => refreshBoard(scope, region[scope])), SUBMIT_DELAY_MS);
    },

    turf: () => turf,
    refreshTurf,

    async claim(place, pet, power) {
      const data = await postJson("/api/turf/claim", {
        playerId: player.id,
        playerName: player.name,
        landmarkId: String(place.id),
        title: place.title,
        lat: place.lat,
        lon: place.lon,
        pet: { id: pet.id, name: pet.name, rarity: pet.rarity, petClass: pet.petClass, power, emoji: "🐾", art: pet.art },
      });
      await refreshTurf();
      return data;
    },
  };
}
