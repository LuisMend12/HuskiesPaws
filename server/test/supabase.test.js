import assert from "node:assert/strict";
import { test } from "node:test";
import { createSupabaseStore } from "../src/store/supabaseStore.js";
import { decideClaim } from "../src/turf.js";

const attempt = (landmarkId, owner = "player-owner", power = 30) => ({
  landmarkId, playerId: owner, playerName: owner, title: landmarkId, lat: 42.45, lon: -76.48,
  pet: { id: `pet-${owner}`, name: "Pip", power, rarity: "common", petClass: "Scout" },
});

test("empty 201 and 204 write responses are successful", async () => {
  for (const status of [201, 204]) {
    const store = createSupabaseStore({ url: "https://fake.invalid", serviceKey: "test", fetchImpl: async () => new Response(null, { status }) });
    const player = { id: "player-123", name: "Ana", score: 1, region: { local: "Ithaca", state: "NY", national: "US" } };
    assert.deepEqual(await store.upsertPlayer(player), player);
    await store.saveImage("pet:123", "/images/test.png");
    await store.saveBank(player.id, { savingsId: "saving-123" });
  }
});

function fakeDatabase() {
  let revision = 0;
  const turf = new Map();
  let conflicts = 0;
  const fetchImpl = async (url, options) => {
    const body = JSON.parse(options.body);
    // Yield so separate instances read the same revision before committing.
    await Promise.resolve();
    let result;
    if (url.endsWith("/rpc/turf_snapshot")) result = { revision: String(revision), turf: [...turf.values()] };
    else if (url.endsWith("/rpc/commit_turf")) {
      result = Number(body.expected_revision) === revision;
      if (result) { turf.set(body.claim.landmark_id, body.claim); revision += 1; }
      else conflicts += 1;
    } else if (url.endsWith("/rpc/recall_guard")) {
      result = false;
      for (const [id, t] of turf) {
        if (t.owner_id === body.player_id && t.pet.id === body.pet_id) { turf.delete(id); result = true; }
      }
      revision += 1;
    } else throw new Error(`Unexpected URL ${url}`);
    return Response.json(result);
  };
  return { fetchImpl, turf, get conflicts() { return conflicts; } };
}

test("concurrent claims across Supabase instances recheck the three-landmark cap", async () => {
  const db = fakeDatabase();
  const stores = [0, 1, 2, 3].map(() => createSupabaseStore({ url: "https://fake.invalid", serviceKey: "test", fetchImpl: db.fetchImpl }));
  const outcomes = await Promise.all(stores.map((s, i) => {
    const a = attempt(`L${i}`);
    return s.claimTurf(a.landmarkId, (defender, allTurf) => decideClaim({ defender, allTurf, attempt: a }));
  }));
  assert.equal(outcomes.filter((o) => o.claim).length, 3);
  assert.equal(outcomes.filter((o) => o.result === "capped").length, 1);
  assert.equal(db.turf.size, 3);
  assert.ok(db.conflicts > 0, "actually exercised revision conflicts");
});

test("two equal-power challengers cannot both win an empty landmark", async () => {
  const db = fakeDatabase();
  const stores = [1, 2].map(() => createSupabaseStore({ url: "https://fake.invalid", serviceKey: "test", fetchImpl: db.fetchImpl }));
  const outcomes = await Promise.all(stores.map((s, i) => {
    const a = attempt("shared", `player-${i}`);
    return s.claimTurf(a.landmarkId, (defender, allTurf) => decideClaim({ defender, allTurf, attempt: a }));
  }));
  assert.equal(outcomes.filter((o) => o.claim).length, 1);
  assert.equal(outcomes.filter((o) => o.result === "defended").length, 1);
});
