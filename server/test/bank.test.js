import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createApp } from "../src/app.js";
import { createFileStore } from "../src/store/fileStore.js";

test("banking keeps credentials server-side and sends each walk only once", async () => {
  const dir = await mkdtemp(join(tmpdir(), "paws-bank-"));
  const store = createFileStore(dir);
  const calls = [];
  const app = createApp({
    config: { dataDir: dir, nessieKey: "server-only-secret", limits: { voice: {}, image: {} } },
    store, grok: { enabled: false },
    bankClient: {
      async setupBank(key) { calls.push(key); return { checkingId: "checking", savingsId: "savings" }; },
      async transferToSavings(key, bank, amount) { calls.push({ key, bank, amount }); return "transfer-1"; },
    },
  });
  await new Promise((resolve) => app.listen(0, resolve));
  const base = `http://localhost:${app.address().port}`;
  const post = async (path, body) => {
    const response = await fetch(`${base}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { status: response.status, ...(await response.json()) };
  };
  try {
    const connect = await post("/api/bank/connect", { playerId: "player-bank", key: "untrusted-phone-key" });
    assert.deepEqual(connect.data.bank, { savingsId: "savings" });
    await post("/api/bank/connect", { playerId: "player-bank" });
    const walk = { playerId: "player-bank", tripId: "trip-000001", title: "Library", meters: 400, amount: 500 };
    const transfers = await Promise.all([post("/api/bank/transfer", walk), post("/api/bank/transfer", walk)]);
    assert.equal(transfers[0].data.nessieId, "transfer-1");
    assert.equal(transfers[1].data.nessieId, "transfer-1");
    assert.equal(calls.length, 2, "one setup and one transfer");
    assert.equal(calls[1].key, "server-only-secret");
    assert.equal(calls[1].amount, 8, "fare computed by server");
    assert.doesNotMatch(JSON.stringify(transfers), /server-only-secret|checking/);
    assert.equal((await post("/api/bank/transfer", { ...walk, playerId: "player-nobank" })).status, 409);
    assert.equal((await post("/api/bank/transfer", { ...walk, meters: -1 })).status, 400);
    // Unknown outcome stays pending; retrying must not duplicate a bank debit.
    await store.reserveTransfer("player-bank", "trip-pending", { status: "pending" });
    assert.equal((await post("/api/bank/transfer", { ...walk, tripId: "trip-pending" })).status, 409);
    assert.equal(calls.length, 2);
  } finally {
    await new Promise((resolve) => app.close(resolve));
    await rm(dir, { recursive: true, force: true });
  }
});
