// Supabase storage through its REST API (PostgREST), with the service-role key
// kept on the server. Tables: see ../../supabase/schema.sql.
// UNTESTED against a live project: verify after creating the tables.

export function createSupabaseStore({ url, serviceKey }) {
  const base = `${url.replace(/\/$/, "")}/rest/v1`;
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };

  async function request(path, { method = "GET", body, prefer } = {}) {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: prefer ? { ...headers, Prefer: prefer } : headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw new Error(`Supabase ${method} ${path} failed (${response.status}): ${(await response.text()).slice(0, 200)}`);
    }
    return response.status === 204 ? null : response.json();
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

    // Not atomic across instances (fine for a single hackathon server); a real
    // version would do the power check in a Postgres function.
    async claimTurf(landmarkId, decide) {
      const outcome = decide(await this.getTurf(landmarkId), await this.listTurf());
      if (outcome.claim) {
        await request("/turf?on_conflict=landmark_id", {
          method: "POST",
          prefer: "resolution=merge-duplicates",
          body: fromTurf(outcome.claim),
        });
      }
      return outcome;
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
