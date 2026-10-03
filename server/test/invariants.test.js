import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createApp } from "../src/app.js";
import { HttpError, clientIp, readJson } from "../src/http.js";
import { createFileStore } from "../src/store/fileStore.js";
import { createSquadTts } from "../src/tts.js";
import { decideClaim } from "../src/turf.js";
import { validateSpeech } from "../src/validate.js";

const hour = 3_600_000;
const pet = (power) => ({
  id: "pet-000001", name: "Biscuit", rarity: "rare", petClass: "Guardian", power, color: "mint",
});
const attempt = (playerId, power) => ({
  playerId, playerName: playerId, landmarkId: "L1", title: "Bailey Hall",
  lat: 42.45, lon: -76.48, pet: pet(power),
});

test("equal-power pets cannot steal a live landmark", () => {
  const defender = {
    ownerId: "player-owner1", ownerName: "Olivia", claimedAt: new Date().toISOString(),
    maxHp: 20, pet: pet(20),
  };
  const outcome = decideClaim({ defender, allTurf: [defender], attempt: attempt("player-rival1", 20) });
  assert.equal(outcome.result, "defended");
  assert.equal(outcome.claim, undefined);
});

test("dead holdings do not count toward the three-landmark cap", () => {
  const now = 5 * hour;
  const dead = (id) => ({
    landmarkId: id, ownerId: "player-me", ownerName: "Me",
    claimedAt: new Date(0).toISOString(), maxHp: 10, pet: pet(10),
  });
  const allTurf = ["A", "B", "C"].map(dead);
  const outcome = decideClaim({
    defender: null, allTurf, attempt: { ...attempt("player-me", 12), landmarkId: "D", title: "New" }, now,
  });
  assert.equal(outcome.result, "claimed");
});

test("file store survives a truncated db and missing collections", async () => {
  const dir = await mkdtemp(join(tmpdir(), "paws-store-"));
  await writeFile(join(dir, "db.json"), "{not json");
  const store = createFileStore(dir);
  assert.deepEqual(await store.listTurf(), []);
  await store.upsertPlayer({ id: "player-aaaaaa", name: "Ana", score: 1, region: { local: "Ithaca", state: "NY", national: "US" } });
  const top = await store.topPlayers("local", "Ithaca", 10);
  assert.equal(top[0].name, "Ana");
  await rm(dir, { recursive: true, force: true });
});

test("file store treats a db with null collections as empty", async () => {
  const dir = await mkdtemp(join(tmpdir(), "paws-null-"));
  await writeFile(join(dir, "db.json"), JSON.stringify({ players: null, turf: null, images: null }));
  const store = createFileStore(dir);
  assert.deepEqual(await store.listTurf(), []);
  assert.deepEqual(await store.topPlayers("local", "Ithaca", 5), []);
  await rm(dir, { recursive: true, force: true });
});

test("speech validation rejects blank and oversized text", () => {
  const voices = ["eve", "ara", "rex"];
  assert.throws(() => validateSpeech({ text: "   " }, voices, 600), HttpError);
  assert.throws(() => validateSpeech({ text: "hi", agent: "moss" }, voices, 600), HttpError);
  const ok = validateSpeech({ text: "  Hello pups.  ", agent: "storyteller" }, voices, 600);
  assert.equal(ok.text, "Hello pups.");
  assert.equal(ok.agent, "storyteller");
  assert.equal(ok.voice, "rex");
});

test("squad TTS prefers ElevenLabs for Moss and Grok for Pip when both keys exist", () => {
  const grok = { enabled: true, async speak() { return { audio: Buffer.from("g"), contentType: "audio/mpeg" }; } };
  const elevenlabs = { enabled: true, async speak() { return { audio: Buffer.from("e"), contentType: "audio/mpeg" }; } };
  const tts = createSquadTts({ grok, elevenlabs });
  assert.equal(tts.summary, "mixed");
  assert.equal(tts.providerFor("storyteller"), "elevenlabs");
  assert.equal(tts.providerFor("scout"), "grok");
  assert.equal(tts.providerFor("pathfinder"), "grok");
});

test("oversized JSON bodies are 413 and invalid JSON is 400", async () => {
  const app = createApp({
    config: { dataDir: await mkdtemp(join(tmpdir(), "paws-http-")), limits: { voice: { perMinute: 10, perDay: 10 }, image: { perMinute: 10, perDay: 10 } } },
    store: { kind: "file" },
    grok: { enabled: false },
  });
  await new Promise((resolve) => app.listen(0, resolve));
  const base = `http://localhost:${app.address().port}`;
  try {
    const huge = await fetch(`${base}/api/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "x".repeat(20_000),
    });
    assert.equal(huge.status, 413);
    const bad = await fetch(`${base}/api/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    assert.equal(bad.status, 400);
  } finally {
    await new Promise((resolve) => app.close(resolve));
  }
});

test("clientIp uses the first X-Forwarded-For hop", () => {
  assert.equal(clientIp({ headers: { "x-forwarded-for": " 1.2.3.4, 5.6.7.8" }, socket: { remoteAddress: "9.9.9.9" } }), "1.2.3.4");
  assert.equal(clientIp({ headers: {}, socket: { remoteAddress: "10.0.0.1" } }), "10.0.0.1");
});

test("readJson on an empty body is {}", async () => {
  const req = createServer(); // placeholder
  void req;
  const empty = {
    async *[Symbol.asyncIterator]() {},
  };
  assert.deepEqual(await readJson(empty), {});
});
