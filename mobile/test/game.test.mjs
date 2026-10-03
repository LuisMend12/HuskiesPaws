import assert from "node:assert/strict";
import { test } from "node:test";
import { deferred, flush, runtime } from "./harness.mjs";

const place = { id: "landmark-1", title: "Library", lat: 42.449, lon: -76.48 };
const pet = { id: "pet-starter-pip", name: "Pip", rarity: "common", petClass: "Scout", color: "mint", basePower: 12, hatchedAtWalked: 0 };
const envelope = (data) => Response.json({ success: true, data });

test("online failure returns unconfirmed outcome without awarding territory", async () => {
  const r = await runtime({ api: "https://fake.invalid", fetchImpl: async (url) => {
    if (url.endsWith("/api/turf/claim")) return new Response(null, { status: 502 });
    if (url.includes("/api/turf?")) return envelope({ turf: [], serverNow: Date.now() });
    return envelope({ players: [], saved: true });
  } });
  try {
    r.game.set({ position: place, found: [place], pets: [pet], squad: [pet.id] });
    const result = await r.game.claimTurf(place.id, pet.id);
    assert.equal(result.result, "unavailable");
    assert.equal(result.won, false);
    assert.equal(r.game.store.getState().turf.length, 0);
    assert.equal(r.game.store.getState().xpBoost, 1);
  } finally { r.game.dispose(); }
});

test("recall succeeds server-side and clears local guard even if refresh fails", async () => {
  let recalled = false;
  const r = await runtime({ api: "https://fake.invalid", fetchImpl: async (url, options) => {
    if (url.endsWith("/api/turf/recall")) { recalled = JSON.parse(options.body).petId === pet.id; return envelope({ recalled }); }
    if (url.includes("/api/turf?")) return new Response(null, { status: 502 });
    return envelope({ players: [], saved: true });
  } });
  try {
    r.game.set({ turf: [{ mine: true, pet, landmarkId: place.id }], xpBoost: 1.1 });
    assert.equal(await r.game.recallGuard(pet.id), true);
    assert.equal(recalled, true);
    assert.equal(r.game.store.getState().turf.length, 0);
    assert.equal(r.game.store.getState().xpBoost, 1);
  } finally { r.game.dispose(); }
});

test("reset ignores expedition results started before the reset", async () => {
  const pending = deferred();
  const r = await runtime({ fetchImpl: async (url) => {
    if (url.includes("geosearch")) return pending.promise;
    return Response.json({});
  } });
  try {
    const expedition = r.game.runAgent({ id: "scout", name: "Pip" });
    await flush();
    await r.game.resetProgress();
    pending.resolve(Response.json({ query: { geosearch: [{ pageid: 1, title: "Library", lat: 42.452, lon: -76.48 }] } }));
    await expedition;
    assert.equal(r.game.store.getState().found.length, 0);
    assert.equal(r.game.store.getState().discovery, null);
    assert.equal(r.game.store.getState().away.length, 0);
    assert.equal(r.game.store.getState().progress.landmarksFound, 0);
  } finally { r.game.dispose(); }
});

test("reset cancels a running demo walk and prevents its savings award", async () => {
  const r = await runtime({ fetchImpl: async (url) => {
    if (url.includes("geosearch")) return Response.json({ query: { geosearch: [{ pageid: 1, title: "Library", lat: 42.46, lon: -76.48 }] } });
    if (url.includes("routed-foot")) return Response.json({ routes: [{ geometry: { coordinates: [[-76.48, 42.449], [-76.48, 42.46]] }, distance: 1200 }] });
    return Response.json({});
  } });
  try {
    const walk = r.game.demoWalk();
    await flush();
    assert.equal(r.game.store.getState().walking, true);
    for (const { run, ms } of r.intervals.values()) if (ms === 100) run();
    await r.game.resetProgress();
    await walk;
    assert.equal(r.game.store.getState().progress.walked, 0);
    assert.equal(r.game.store.getState().trips.length, 0);
    assert.equal(r.game.store.getState().walking, false);
    assert.equal([...r.intervals.values()].some((t) => t.ms === 100), false);
    assert.equal(JSON.parse(r.data.get("wanderlings:progress")).walked, 0);
  } finally { r.game.dispose(); }
});

test("legacy bank keys are removed from phone storage and state", async () => {
  const r = await runtime({ saved: { nessieKey: "legacy-secret", bank: { checkingId: "old", savingsId: "old" } } });
  try {
    assert.equal(r.data.has("wanderlings:nessieKey"), false);
    assert.equal("nessieKey" in r.game.store.getState(), false);
    assert.equal(r.game.store.getState().bank, null);
  } finally { r.game.dispose(); }
});

test("Grok audio is requested and played; failed requests fall back to speech", async () => {
  let fail = false;
  const calls = [];
  const r = await runtime({ api: "https://fake.invalid", fetchImpl: async (url, options) => {
    if (url.endsWith("/api/voice")) {
      calls.push(JSON.parse(options.body));
      return new Response(fail ? null : "ID3audio", { status: fail ? 503 : 200 });
    }
    return envelope({ turf: [], players: [], saved: true });
  } });
  try {
    const voice = await r.module("src/voice.js");
    await voice.speakMemo("Hi from Pip", { grokVoice: "ara" });
    assert.equal(calls[0].voice, "ara");
    assert.equal(r.audio.length, 1);
    assert.equal(r.speech.length, 0);
    fail = true;
    await voice.speakMemo("Fallback memo");
    assert.equal(r.speech.at(-1), "Fallback memo");
  } finally { r.game.dispose(); }
});

test("refresh updates live board and removes expired territory boosts", async () => {
  const r = await runtime({ api: "https://fake.invalid", fetchImpl: async (url) => {
    if (url.includes("/api/leaderboard")) return envelope({ players: [{ position: 1, name: "Real player", score: 99, isYou: false }] });
    if (url.includes("/api/turf?")) return envelope({ serverNow: Date.now(), turf: [] });
    return envelope({ saved: true });
  } });
  try {
    r.game.set({ turf: [{ mine: true, decaysAt: Date.now() - 7_200_000, maxHp: 12, pet }], xpBoost: 1.1 });
    r.game.refreshOnline();
    assert.equal(r.game.store.getState().xpBoost, 1);
    await flush();
    assert.equal(r.game.store.getState().leaderboard.rows[0].name, "Real player");
    assert.equal(r.game.store.getState().leaderboard.region, r.game.store.getState().region.local);
  } finally { r.game.dispose(); }
});

test("expeditions request Grok postcard art and discard a late image after reset", async () => {
  const art = deferred();
  let postcard;
  const r = await runtime({ api: "https://fake.invalid", fetchImpl: async (url, options) => {
    if (url.includes("geosearch")) return Response.json({ query: { geosearch: [{ pageid: 99, title: "Library", lat: 42.46, lon: -76.48 }] } });
    if (url.includes("/page/summary/")) return Response.json({ extract: "A sourced place fact. ".repeat(30), content_urls: { desktop: { page: "https://en.wikipedia.org/wiki/Library" } } });
    if (url.endsWith("/api/imagine")) { postcard = JSON.parse(options.body); return art.promise; }
    if (url.endsWith("/api/voice")) return new Response(null, { status: 503 });
    return envelope({ turf: [], players: [], saved: true });
  } });
  try {
    const expedition = r.game.runAgent({ id: "scout", name: "Pip" });
    await flush();
    for (const { run, ms } of r.timeouts.values()) if (ms < 25_000) run();
    await expedition;
    await flush();
    assert.equal(postcard.kind, "postcard");
    assert.equal(postcard.placeId, "99");
    assert.equal(postcard.fact.length, 300);
    assert.equal(r.game.store.getState().discovery.place.id, 99);
    await r.game.resetProgress();
    art.resolve(envelope({ image: "/images/library.png" }));
    await flush();
    assert.equal(r.game.store.getState().discovery, null);
    assert.equal(r.game.store.getState().found.length, 0);
  } finally { r.game.dispose(); }
});
