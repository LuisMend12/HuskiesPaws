// JSON-file storage for local development and simple deploys. Same interface as
// supabaseStore.js. Writes are serialized so concurrent requests can't clobber
// each other. On hosts with ephemeral disks, data resets on redeploy.
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const EMPTY = Object.freeze({ players: {}, turf: {}, images: {}, banks: {}, transfers: {} });

export function createFileStore(dataDir) {
  const file = join(dataDir, "db.json");
  let cache = null;
  let queue = Promise.resolve();

  function asMap(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function normalize(raw) {
    return {
      players: asMap(raw.players),
      turf: asMap(raw.turf),
      images: asMap(raw.images),
      banks: asMap(raw.banks),
      transfers: asMap(raw.transfers),
    };
  }

  async function load() {
    if (cache) return cache;
    try {
      cache = normalize({ ...EMPTY, ...JSON.parse(await readFile(file, "utf8")) });
    } catch (error) {
      if (error.code !== "ENOENT") console.warn("Could not read store, starting empty:", error.message);
      cache = { ...EMPTY };
    }
    return cache;
  }

  // Applies an immutable update and saves it, one write at a time.
  function update(change) {
    const run = queue.then(async () => {
      const next = change(await load());
      await mkdir(dirname(file), { recursive: true });
      await writeFile(`${file}.tmp`, JSON.stringify(next));
      await rename(`${file}.tmp`, file);
      cache = next;
      return next;
    });
    queue = run.catch(() => {});
    return run;
  }

  return {
    kind: "file",

    async upsertPlayer(player) {
      await update((db) => ({ ...db, players: { ...db.players, [player.id]: player } }));
      return player;
    },

    async topPlayers(scopeKey, regionName, limit) {
      const db = await load();
      return Object.values(db.players)
        .filter((p) => p.region?.[scopeKey] === regionName)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    },

    async listTurf() {
      return Object.values((await load()).turf);
    },

    async getTurf(landmarkId) {
      return (await load()).turf[landmarkId] ?? null;
    },

    // Claims are checked inside the serialized update, so two challengers
    // can't both win the same landmark at the same moment.
    async claimTurf(landmarkId, decide) {
      let outcome = null;
      await update((db) => {
        outcome = decide(db.turf[landmarkId] ?? null, Object.values(db.turf));
        return outcome.claim ? { ...db, turf: { ...db.turf, [landmarkId]: outcome.claim } } : db;
      });
      return outcome;
    },

    async getImage(key) {
      return (await load()).images[key] ?? null;
    },

    async recallGuard(ownerId, petId) {
      let recalled = false;
      await update((db) => {
        const turf = Object.fromEntries(Object.entries(db.turf).filter(([, t]) => {
          const remove = t.ownerId === ownerId && t.pet?.id === petId;
          recalled ||= remove;
          return !remove;
        }));
        return { ...db, turf };
      });
      return recalled;
    },

    async getBank(playerId) { return (await load()).banks[playerId] ?? null; },
    async saveBank(playerId, bank) {
      await update((db) => ({ ...db, banks: { ...db.banks, [playerId]: bank } }));
    },
    async getTransfer(playerId, tripId) { return (await load()).transfers[`${playerId}:${tripId}`] ?? null; },
    async saveTransfer(playerId, tripId, transfer) {
      await update((db) => ({ ...db, transfers: { ...db.transfers, [`${playerId}:${tripId}`]: transfer } }));
    },
    async reserveTransfer(playerId, tripId, transfer) {
      let reserved = false;
      await update((db) => {
        const key = `${playerId}:${tripId}`;
        if (db.transfers[key]) return db;
        reserved = true;
        return { ...db, transfers: { ...db.transfers, [key]: transfer } };
      });
      return reserved;
    },

    async saveImage(key, path) {
      await update((db) => ({ ...db, images: { ...db.images, [key]: path } }));
    },
  };
}
