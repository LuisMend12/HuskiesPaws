// End-to-end API tests: real server + file store, with fake xAI and ElevenLabs
// servers that record requests and return canned audio and images.
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer, request } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";
import { createApp } from "../src/app.js";
import { ELEVEN_VOICES, createElevenLabs } from "../src/elevenlabs.js";
import { createGrok } from "../src/grok.js";
import { createFileStore } from "../src/store/fileStore.js";
import { createSquadTts } from "../src/tts.js";

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

const ELEVEN_MP3 = Buffer.from("ID3eleven-mp3-bytes");

function startFakeElevenLabs() {
  const calls = [];
  const server = createServer(async (req, res) => {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    calls.push({ path: req.url, key: req.headers["xi-api-key"], body: JSON.parse(raw || "{}") });
    if (req.method === "POST" && req.url.startsWith("/v1/text-to-speech/")) {
      res.writeHead(200, { "Content-Type": "audio/mpeg" });
      res.end(ELEVEN_MP3);
      return;
    }
    res.writeHead(404).end();
  });
  return new Promise((resolve) => server.listen(0, () => resolve({ server, calls, url: `http://localhost:${server.address().port}` })));
}

async function startApp({ apiKey, xaiUrl, elevenKey = "", elevenUrl, dataDir, limits }) {
  const config = {
    dataDir,
    limits: limits ?? { voice: { perMinute: 100, perDay: 1000 }, image: { perMinute: 100, perDay: 1000 } },
  };
  const grok = createGrok({ apiKey, baseUrl: xaiUrl });
  const elevenlabs = createElevenLabs({ apiKey: elevenKey, baseUrl: elevenUrl });
  const server = createApp({
    config,
    store: createFileStore(dataDir),
    grok,
    elevenlabs,
    tts: createSquadTts({ grok, elevenlabs }),
  });
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
const pet = (power, id = "pet-000001") => ({
  id, name: `Pup${power}`, rarity: "rare", petClass: "Guardian", power, emoji: "🐾", color: "mint", spaceBorn: false,
});
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

  test("health reports features without leaking secrets", async () => {
    const health = await json(await fetch(`${app.base}/api/health`));
    assert.deepEqual(health.data, { grok: true, tts: "grok", ttsByAgent: { scout: "grok", storyteller: "grok", pathfinder: "grok" }, storage: "file" });
    assert.doesNotMatch(JSON.stringify(health), /test-key/);
  });

  test("serves no web pages and blocks path traversal out of /images", async () => {
    assert.equal((await fetch(`${app.base}/`)).status, 404);
    assert.equal((await fetch(`${app.base}/env.js`)).status, 404);
    assert.equal((await fetch(`${app.base}/images/..%2f..%2fpackage.json`)).status, 404);
    // fetch() cleans up "../" itself, so send a raw request to really try escaping.
    for (const path of ["/images/../../package.json", "/images/..\\..\\package.json", "/images/%2e%2e%2f%2e%2e%2fpackage.json"]) {
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
    assert.equal((await post(app.base, "/api/imagine", { kind: "pet", petId: "pet-123456", rarity: "rare", petClass: "Scout", color: "gold" })).status, 400);

    const petArt = await json(await post(app.base, "/api/imagine", { kind: "pet", petId: "pet-123456", rarity: "rare", petClass: "Scout", color: "mint" }));
    assert.equal(petArt.success, true);
    const petCall = xai.calls.findLast((c) => c.path === "/v1/images/generations");
    assert.match(petCall.body.prompt, /collectible husky-inspired pup/);
    assert.match(petCall.body.prompt, /leaf sprout/);
    assert.match(petCall.body.prompt, /diamond badge/);
  });

  test("leaderboard marks you without exposing player ids", async () => {
    await post(app.base, "/api/score", { playerId: "player-aaaaaa", name: "Ana", score: 300, region });
    await post(app.base, "/api/score", { playerId: "player-bbbbbb", name: "Ben", score: 900, region });
    await post(app.base, "/api/score", { playerId: "player-aaaaaa", name: "Ana", score: 1200, region }); // update
    const board = await json(await fetch(`${app.base}/api/leaderboard?scope=state&region=New%20York&me=player-aaaaaa`));
    // Sample players rank alongside real ones, so check the real rows' order and marks.
    const rows = board.data.players;
    const ana = rows.find((r) => r.name === "Ana");
    const ben = rows.find((r) => r.name === "Ben");
    assert.equal(ana.isYou, true, "your row is always included, even outside the top 10");
    if (ben) assert.ok(ana.position < ben.position && !ben.isYou, "higher score ranks higher");
    assert.equal(rows.filter((r) => r.isYou).length, 1);
    assert.ok(rows.length > 2, "sample players fill the board");
    rows.slice(0, 10).forEach((r, i) => assert.equal(r.position, i + 1));
    assert.doesNotMatch(JSON.stringify(board), /player-|demo-/);
  });

  test("score validation", async () => {
    assert.equal((await post(app.base, "/api/score", { playerId: "x", name: "A", score: 1, region })).status, 400);
    assert.equal((await post(app.base, "/api/score", { playerId: "player-cccccc", name: "A", score: -5, region })).status, 400);
    assert.equal((await post(app.base, "/api/leaderboard", {})).status, 404);
  });

  test("recall checks ownership, releases the guard, and is idempotent", async () => {
    await post(app.base, "/api/turf/claim", claim("player-recall", "recall-landmark", 30));
    const wrong = await json(await post(app.base, "/api/turf/recall", { playerId: "player-other", petId: "pet-000001" }));
    assert.equal(wrong.data.recalled, false);
    const recalled = await json(await post(app.base, "/api/turf/recall", { playerId: "player-recall", petId: "pet-000001" }));
    assert.equal(recalled.data.recalled, true);
    const again = await json(await post(app.base, "/api/turf/recall", { playerId: "player-recall", petId: "pet-000001" }));
    assert.equal(again.data.recalled, false);
    const turf = await json(await fetch(`${app.base}/api/turf?me=player-recall`));
    assert.equal(turf.data.turf.some((t) => t.landmarkId === "recall-landmark"), false);
    assert.equal((await post(app.base, "/api/turf/recall", { playerId: "x" })).status, 400);
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
    const guarded = list.data.turf.find((t) => t.landmarkId === "L1");
    assert.equal(guarded.pet.power, 50);
    assert.equal(guarded.pet.color, "mint");
    assert.equal(guarded.pet.spaceBorn, false);
    assert.equal(guarded.hp, 50);
    assert.equal(guarded.maxHp, 50);
    assert.doesNotMatch(JSON.stringify(list), /player-/);
  });

  test("day log carries the app's squad for the iMessage agent, and keeps it", async () => {
    const phone = "+16075550199";
    const squad = [{ name: "Nova", petClass: "Scout", species: "cat" }, { name: "Clover", petClass: "Storyteller", species: "bunny" }];
    assert.equal((await post(app.base, "/api/day", { phone, steps: 10, squad })).status, 200);
    await post(app.base, "/api/day", { phone, steps: 20 }); // an update without a squad keeps the old one
    const day = await json(await fetch(`${app.base}/api/day?phone=${encodeURIComponent(phone)}`));
    assert.deepEqual(day.data.squad, squad);
    assert.equal((await post(app.base, "/api/day", { phone, squad: [{ name: "X", petClass: "Wizard" }] })).status, 400);
  });

  test("day log merges phone steps with iMessage places", async () => {
    const phone = "+18609890738";
    const first = await json(await post(app.base, "/api/day", {
      phone,
      steps: 400,
      places: [{ id: "lib", title: "Uris Library" }],
    }));
    assert.equal(first.status, 200);
    assert.equal(first.data.steps, 400);
    const linked = await json(await post(app.base, "/api/day", {
      playerId: "player-walker",
      phone,
      steps: 2500,
      places: [{ id: "sage", title: "Sage Chapel" }],
    }));
    assert.equal(linked.data.steps, 2500);
    assert.equal(linked.data.places.length, 2);
    const byPhone = await json(await fetch(`${app.base}/api/day?phone=${encodeURIComponent(phone)}`));
    assert.equal(byPhone.data.steps, 2500);
    assert.equal((await post(app.base, "/api/day", { steps: 3 })).status, 400);
    assert.equal((await fetch(`${app.base}/api/day`)).status, 400);
  });
});

describe("ElevenLabs voice", () => {
  let xai;
  let eleven;
  let app;
  let dataDir;

  before(async () => {
    xai = await startFakeXai();
    eleven = await startFakeElevenLabs();
    dataDir = await mkdtemp(join(tmpdir(), "huskiespaws-"));
    app = await startApp({ apiKey: "xai-key", xaiUrl: xai.url, elevenKey: "eleven-key", elevenUrl: eleven.url, dataDir });
  });

  after(async () => {
    app.server.close();
    xai.server.close();
    eleven.server.close();
    await rm(dataDir, { recursive: true, force: true });
  });

  test("health reports mixed TTS without leaking keys", async () => {
    const health = await json(await fetch(`${app.base}/api/health`));
    assert.deepEqual(health.data, {
      grok: true,
      tts: "mixed",
      ttsByAgent: { scout: "grok", storyteller: "elevenlabs", pathfinder: "grok" },
      storage: "file",
    });
    assert.doesNotMatch(JSON.stringify(health), /eleven-key|xai-key/);
  });

  test("Moss's stories use ElevenLabs; Pip uses Grok Voice", async () => {
    const grokBefore = xai.calls.length;
    const moss = await post(app.base, "/api/voice", { text: "Once upon a trail...", agent: "storyteller" });
    assert.equal(moss.status, 200);
    assert.deepEqual(Buffer.from(await moss.arrayBuffer()), ELEVEN_MP3);
    const elevenCall = eleven.calls.at(-1);
    assert.equal(elevenCall.path, `/v1/text-to-speech/${ELEVEN_VOICES.storyteller}?output_format=mp3_44100_128`);
    assert.equal(elevenCall.body.text, "Once upon a trail...");
    assert.equal(xai.calls.length, grokBefore, "Moss does not call Grok");

    const pip = await post(app.base, "/api/voice", { text: "I found a place!", agent: "scout" });
    assert.equal(pip.status, 200);
    assert.deepEqual(Buffer.from(await pip.arrayBuffer()), MP3);
    const grokCall = xai.calls.findLast((c) => c.path === "/v1/tts");
    assert.deepEqual(grokCall.body, { text: "I found a place!", voice_id: "ara", language: "en" });
  });

  test("without an agent, Grok Voice is used when it is on", async () => {
    const elevenBefore = eleven.calls.length;
    assert.equal((await post(app.base, "/api/voice", { text: "Hello", voice: "rex" })).status, 200);
    const grokCall = xai.calls.findLast((c) => c.path === "/v1/tts");
    assert.deepEqual(grokCall.body, { text: "Hello", voice_id: "rex", language: "en" });
    assert.equal(eleven.calls.length, elevenBefore);
  });

  test("bad agent gets 400 without calling out", async () => {
    const before = eleven.calls.length + xai.calls.length;
    const bad = await json(await post(app.base, "/api/voice", { text: "hi", agent: "wizard" }));
    assert.equal(bad.status, 400);
    assert.match(bad.error, /agent/);
    assert.equal((await post(app.base, "/api/voice", { text: "hi", agent: 7 })).status, 400);
    assert.equal(eleven.calls.length + xai.calls.length, before);
  });
});

describe("without a Grok key", () => {
  test("Grok endpoints say they're not configured", async () => {
    const dataDir = await mkdtemp(join(tmpdir(), "huskiespaws-"));
    const app = await startApp({ apiKey: "", xaiUrl: "http://localhost:1", dataDir });
    try {
      const health = (await json(await fetch(`${app.base}/api/health`))).data;
      assert.equal(health.grok, false);
      assert.equal(health.tts, null);
      const voice = await json(await post(app.base, "/api/voice", { text: "hi" }));
      assert.equal(voice.status, 503);
      assert.match(voice.error, /ELEVENLABS_API_KEY/);
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
