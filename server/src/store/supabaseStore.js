// Supabase storage through its REST API (PostgREST), with the service-role key
// kept on the server. Tables: see ../../supabase/schema.sql.
// UNTESTED against a live project: verify after creating the tables.

export function createSupabaseStore({ url, serviceKey, fetchImpl = fetch }) {
  const base = `${url.replace(/\/$/, "")}/rest/v1`;
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };

  async function request(path, { method = "GET", body, prefer } = {}) {
    const response = await fetchImpl(`${base}${path}`, {
      method,
      headers: prefer ? { ...headers, Prefer: prefer } : headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      throw new Error(`Supabase ${method} ${path} failed (${response.status}): ${(await response.text()).slice(0, 200)}`);
    }
    const text = await response.text();
    return text.trim() ? JSON.parse(text) : null;
  }

  const toPlayer = (row) => ({
    id: row.id,
    name: row.name,
    score: row.score,
    region: { local: row.region_local, state: row.region_state, national: row.region_national },
  });
  const toTurf = (row) => row && ({
    landmarkId: row.landmark_id,
    title: row.title,
    lat: row.lat,
    lon: row.lon,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    pet: row.pet,
    claimedAt: row.claimed_at,
  });
  const fromTurf = (t) => ({
    landmark_id: t.landmarkId,
    title: t.title,
    lat: t.lat,
    lon: t.lon,
    owner_id: t.ownerId,
    owner_name: t.ownerName,
    pet: t.pet,
    claimed_at: t.claimedAt,
  });
  const column = { local: "region_local", state: "region_state", national: "region_national" };

  return {
    kind: "supabase",

    async upsertPlayer(p) {
      await request("/players?on_conflict=id", {
        method: "POST",
        prefer: "resolution=merge-duplicates",
        body: {
          id: p.id,
          name: p.name,
          score: p.score,
          region_local: p.region.local,
          region_state: p.region.state,
          region_national: p.region.national,
          updated_at: new Date().toISOString(),
        },
      });
      return p;
    },

    async topPlayers(scopeKey, regionName, limit) {
      const query = new URLSearchParams({
        select: "*",
        [column[scopeKey]]: `eq.${regionName}`,
        order: "score.desc",
        limit: String(limit),
      });
      return (await request(`/players?${query}`)).map(toPlayer);
    },

    async listTurf() {
      return (await request("/turf?select=*")).map(toTurf);
    },

    async getTurf(landmarkId) {
      const rows = await request(`/turf?select=*&landmark_id=eq.${encodeURIComponent(landmarkId)}`);
      return toTurf(rows[0]) ?? null;
    },

    // The database revision covers ALL turf, including the per-owner cap.
    // A conflict requires a new snapshot and a new decision, never a blind upsert.
    async claimTurf(landmarkId, decide) {
      for (let retry = 0; retry < 10; retry += 1) {
        const snapshot = await request("/rpc/turf_snapshot", { method: "POST", body: {} });
        const all = snapshot.turf.map(toTurf);
        const outcome = decide(all.find((t) => t.landmarkId === landmarkId) ?? null, all);
        if (!outcome.claim) return outcome;
        const committed = await request("/rpc/commit_turf", {
          method: "POST",
          body: { expected_revision: snapshot.revision, claim: fromTurf(outcome.claim) },
        });
        if (committed) return outcome;
      }
      throw new Error("Turf changed too often; retry the claim");
    },

    async recallGuard(ownerId, petId) {
      return request("/rpc/recall_guard", { method: "POST", body: { player_id: ownerId, pet_id: petId } });
    },

    async getBank(playerId) {
      const rows = await request(`/banks?select=bank&player_id=eq.${encodeURIComponent(playerId)}`);
      return rows[0]?.bank ?? null;
    },

    async saveBank(playerId, bank) {
      await request("/banks?on_conflict=player_id", {
        method: "POST", prefer: "resolution=merge-duplicates", body: { player_id: playerId, bank },
      });
    },

    async getTransfer(playerId, tripId) {
      const query = new URLSearchParams({ select: "transfer", player_id: `eq.${playerId}`, trip_id: `eq.${tripId}` });
      const rows = await request(`/bank_transfers?${query}`);
      return rows[0]?.transfer ?? null;
    },

    async saveTransfer(playerId, tripId, transfer) {
      await request("/bank_transfers?on_conflict=player_id,trip_id", {
        method: "POST", prefer: "resolution=merge-duplicates", body: { player_id: playerId, trip_id: tripId, transfer },
      });
    },

    async reserveTransfer(playerId, tripId, transfer) {
      return request("/rpc/reserve_transfer", {
        method: "POST", body: { owner: playerId, trip: tripId, pending: transfer },
      });
    },

    async getImage(key) {
      const rows = await request(`/images?select=path&key=eq.${encodeURIComponent(key)}`);
      return rows[0]?.path ?? null;
    },

    async saveImage(key, path) {
      await request("/images?on_conflict=key", { method: "POST", prefer: "resolution=merge-duplicates", body: { key, path } });
    },
  };
}
