// End-to-end API tests: real server + file store, with a fake xAI server that
// records requests and returns canned audio and images.
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer, request } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";
import { createApp } from "../src/app.js";
import { createGrok } from "../src/grok.js";
import { createFileStore } from "../src/store/fileStore.js";

const PNG = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex"); // PNG signature + header start
const MP3 = Buffer.from("ID3fake-mp3-bytes");

function startFakeXai() {
  const calls = [];
  const server = createServer(async (req, res) => {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    calls.push({ path: req.url, auth: req.headers.authorization, body: JSON.parse(raw || "{}") });
    if (req.url === "/v1/tts") {
      res.writeHead(200, { "Content-Type": "audio/mpeg" });
      res.end(MP3);
      return;
    }
    if (req.url === "/v1/images/generations") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ data: [{ b64_json: PNG.toString("base64") }] }));
      return;
    }
    res.writeHead(404).end();
  });
  return new Promise((resolve) => server.listen(0, () => resolve({ server, calls, url: `http://localhost:${server.address().port}` })));
}

async function startApp({ apiKey, xaiUrl, dataDir, limits }) {
  const config = {
    webRoot: join(import.meta.dirname, "..", "..", "prototype"),
    dataDir,
    mapboxToken: "pk.test-token",
    limits: limits ?? { voice: { perMinute: 100, perDay: 1000 }, image: { perMinute: 100, perDay: 1000 } },
  };
  const server = createApp({ config, store: createFileStore(dataDir), grok: createGrok({ apiKey, baseUrl: xaiUrl }) });
  await new Promise((resolve) => server.listen(0, resolve));
  return { server, base: `http://localhost:${server.address().port}` };
}

function rawGetStatus(base, path) {
  const { port } = new URL(base);
  return new Promise((resolve, reject) => {
    request({ host: "localhost", port, path, method: "GET" }, (res) => {
      res.resume();
      resolve(res.statusCode);
    }).on("error", reject).end();
  });
}

const post = (base, path, body) =>
  fetch(`${base}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const json = async (response) => ({ status: response.status, ...(await response.json()) });

const region = { local: "Ithaca", state: "New York", national: "United States" };
const pet = (power, id = "pet-000001") => ({ id, name: `Pup${power}`, rarity: "rare", petClass: "Guardian", power, emoji: "🐾" });
const claim = (playerId, landmarkId, power) => ({
  playerId, playerName: playerId.endsWith("owner1") ? "Olivia" : "Riley", landmarkId, title: `Landmark ${landmarkId}`, lat: 42.45, lon: -76.48, pet: pet(power),
});

describe("HuskiesPaws API", () => {
  let xai;
  let app;
  let dataDir;

  before(async () => {
    xai = await startFakeXai();
    dataDir = await mkdtemp(join(tmpdir(), "huskiespaws-"));
    app = await startApp({ apiKey: "test-key", xaiUrl: xai.url, dataDir });
  });

  after(async () => {
    app.server.close();
    xai.server.close();
    await rm(dataDir, { recursive: true, force: true });
  });

  test("health and env.js report features without leaking secrets", async () => {
    const health = await json(await fetch(`${app.base}/api/health`));
    assert.deepEqual(health.data, { grok: true, storage: "file" });
    const env = await (await fetch(`${app.base}/env.js`)).text();
    assert.match(env, /"MAPBOX_TOKEN":"pk.test-token"/);
    assert.match(env, /"GROK":true/);
    assert.doesNotMatch(env, /test-key/);
  });

  test("serves the web app but blocks path traversal", async () => {
    assert.equal((await fetch(`${app.base}/`)).status, 200);
    assert.equal((await fetch(`${app.base}/js/agents.js`)).status, 200);
    assert.equal((await fetch(`${app.base}/..%2fserver%2fpackage.json`)).status, 404);
    // fetch() cleans up "../" itself, so send a raw request to really try escaping.
    for (const path of ["/../server/package.json", "/..\\server\\package.json", "/%2e%2e%2fserver%2fpackage.json"]) {
      assert.equal(await rawGetStatus(app.base, path), 404, path);
    }
  });

  test("voice sends the documented TTS request and returns audio", async () => {
    const response = await post(app.base, "/api/voice", { text: "Hi from Pip!", voice: "ara" });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "audio/mpeg");
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), MP3);
    const call = xai.calls.findLast((c) => c.path === "/v1/tts");
    assert.equal(call.auth, "Bearer test-key");
    assert.deepEqual(call.body, { text: "Hi from Pip!", voice_id: "ara", language: "en" });
  });

  test("voice rejects bad input before calling Grok", async () => {
    const before = xai.calls.length;
    assert.equal((await post(app.base, "/api/voice", { text: "", voice: "ara" })).status, 400);
    assert.equal((await post(app.base, "/api/voice", { text: "hi", voice: "nobody" })).status, 400);
    assert.equal((await post(app.base, "/api/voice", { text: "x".repeat(601) })).status, 400);
    assert.equal(xai.calls.length, before);
  });

  test("imagine builds the prompt server-side, saves the image, and caches it", async () => {
    const request = { kind: "postcard", placeId: "12345", title: "Bailey Hall", fact: "The largest auditorium at Cornell." };
    const first = await json(await post(app.base, "/api/imagine", request));
    assert.equal(first.success, true);
    assert.match(first.data.image, /^\/images\/[\w-]+\.png$/);
    const call = xai.calls.findLast((c) => c.path === "/v1/images/generations");
    assert.equal(call.body.model, "grok-imagine-image-2.0");
    assert.equal(call.body.response_format, "b64_json");
    assert.match(call.body.prompt, /Bailey Hall/);

    const imagesBefore = xai.calls.filter((c) => c.path === "/v1/images/generations").length;
    const second = await json(await post(app.base, "/api/imagine", request));
    assert.equal(second.data.image, first.data.image);
    assert.equal(second.data.cached, true);
    assert.equal(xai.calls.filter((c) => c.path === "/v1/images/generations").length, imagesBefore, "no second Grok call");

    const image = await fetch(`${app.base}${first.data.image}`);
    assert.equal(image.headers.get("content-type"), "image/png");
    assert.deepEqual(Buffer.from(await image.arrayBuffer()), PNG);
  });

  test("imagine only accepts known kinds (no free-form prompts)", async () => {
    assert.equal((await post(app.base, "/api/imagine", { kind: "anything", prompt: "draw a logo" })).status, 400);
    assert.equal((await post(app.base, "/api/imagine", { kind: "pet", petId: "pet-123456", rarity: "mythic", petClass: "Scout", color: "gold" })).status, 400);
  });

  test("leaderboard marks you without exposing player ids", async () => {
    await post(app.base, "/api/score", { playerId: "player-aaaaaa", name: "Ana", score: 300, region });
    await post(app.base, "/api/score", { playerId: "player-bbbbbb", name: "Ben", score: 900, region });
    await post(app.base, "/api/score", { playerId: "player-aaaaaa", name: "Ana", score: 1200, region }); // update
    const board = await json(await fetch(`${app.base}/api/leaderboard?scope=state&region=New%20York&me=player-aaaaaa`));
    assert.deepEqual(board.data.players, [
      { position: 1, name: "Ana", score: 1200, isYou: true },
      { position: 2, name: "Ben", score: 900, isYou: false },
    ]);
    assert.doesNotMatch(JSON.stringify(board), /player-/);
  });

  test("score validation", async () => {
    assert.equal((await post(app.base, "/api/score", { playerId: "x", name: "A", score: 1, region })).status, 400);
    assert.equal((await post(app.base, "/api/score", { playerId: "player-cccccc", name: "A", score: -5, region })).status, 400);
    assert.equal((await post(app.base, "/api/leaderboard", {})).status, 404);
  });

  test("turf: claim, defend, capture, reinforce, and cap", async () => {
    const claimed = await json(await post(app.base, "/api/turf/claim", claim("player-owner1", "L1", 30)));
    assert.equal(claimed.data.result, "claimed");

    const defended = await json(await post(app.base, "/api/turf/claim", claim("player-rival1", "L1", 20)));
    assert.equal(defended.data.result, "defended");
    assert.equal(defended.data.won, false);

    const captured = await json(await post(app.base, "/api/turf/claim", claim("player-rival1", "L1", 45)));
    assert.equal(captured.data.result, "captured");

    const reinforced = await json(await post(app.base, "/api/turf/claim", claim("player-rival1", "L1", 50)));
    assert.equal(reinforced.data.result, "reinforced");

    for (const id of ["L2", "L3"]) await post(app.base, "/api/turf/claim", claim("player-rival1", id, 40));
    const capped = await json(await post(app.base, "/api/turf/claim", claim("player-rival1", "L4", 40)));
    assert.equal(capped.data.result, "capped");

    const list = await json(await fetch(`${app.base}/api/turf?me=player-rival1`));
    assert.equal(list.data.turf.filter((t) => t.mine).length, 3);
    assert.equal(list.data.turf.find((t) => t.landmarkId === "L1").pet.power, 50);
    assert.doesNotMatch(JSON.stringify(list), /player-/);
  });
});

describe("without a Grok key", () => {
  test("Grok endpoints say they're not configured", async () => {
    const dataDir = await mkdtemp(join(tmpdir(), "huskiespaws-"));
    const app = await startApp({ apiKey: "", xaiUrl: "http://localhost:1", dataDir });
    try {
      assert.deepEqual((await json(await fetch(`${app.base}/api/health`))).data.grok, false);
      const voice = await json(await post(app.base, "/api/voice", { text: "hi" }));
      assert.equal(voice.status, 503);
      assert.match(voice.error, /XAI_API_KEY/);
    } finally {
      app.server.close();
      await rm(dataDir, { recursive: true, force: true });
    }
  });
});

describe("rate limits", () => {
  test("voice requests over the per-minute limit get 429", async () => {
    const xai = await startFakeXai();
    const dataDir = await mkdtemp(join(tmpdir(), "huskiespaws-"));
    const app = await startApp({
      apiKey: "k", xaiUrl: xai.url, dataDir,
      limits: { voice: { perMinute: 2, perDay: 100 }, image: { perMinute: 1, perDay: 100 } },
    });
    try {
      const statuses = [];
      for (let i = 0; i < 3; i++) statuses.push((await post(app.base, "/api/voice", { text: `hi ${i}` })).status);
      assert.deepEqual(statuses, [200, 200, 429]);
    } finally {
      app.server.close();
      xai.server.close();
      await rm(dataDir, { recursive: true, force: true });
    }
  });
});
