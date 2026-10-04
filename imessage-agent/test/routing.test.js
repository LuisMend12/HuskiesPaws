import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { handleMessage, newSession } from "../src/bot.js";

const realFetch = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = async (url) => {
    const href = String(url);
    if (href.includes("nominatim")) return new Response("[]", { headers: { "Content-Type": "application/json" } });
    if (href.includes("geosearch")) return Response.json({ query: { geosearch: [] } });
    return Response.json({});
  };
});
afterEach(() => { globalThis.fetch = realFetch; });

async function chat(message, session = newSession()) {
  const replies = [];
  const next = await handleMessage(message, session, async (reply) => replies.push(reply));
  return { session: next, all: replies.map((r) => r.text ?? "").join("\n") };
}

test("come here is not treated as arriving at a landmark", async () => {
  const { all } = await chat("come here");
  assert.doesNotMatch(all, /Arrived where/);
  assert.match(all, /didn't catch that/);
});

test("I'm at with no place name does not call the geocoder as empty", async () => {
  let searched = false;
  globalThis.fetch = async (url) => {
    if (String(url).includes("nominatim")) searched = true;
    return new Response("[]", { headers: { "Content-Type": "application/json" } });
  };
  const { all } = await chat("I'm at");
  assert.equal(searched, false);
  assert.match(all, /didn't catch that|near/);
});

test("today and arrived report places passed and daily steps", async () => {
  const empty = await chat("today");
  assert.match(empty.all, /0 steps/);
  const pending = {
    ...newSession(),
    pendingTrip: { place: { id: 9, title: "Sage Chapel", lat: 42.45, lon: -76.48 }, meters: 800 },
  };
  const first = await chat("arrived", pending);
  assert.match(first.all, /Sage Chapel/);
  assert.match(first.all, /steps/);
  assert.equal(first.session.dayLog.places[0].title, "Sage Chapel");
  assert.ok(first.session.dayLog.steps > 0);
  const tally = await chat("today", first.session);
  assert.match(tally.all, /Sage Chapel/);
});

test("arrived twice does not log a second walk", async () => {
  const pending = {
    ...newSession(),
    pendingTrip: { place: { id: 1, title: "Library", lat: 42.45, lon: -76.48 }, meters: 400 },
  };
  const first = await chat("arrived", pending);
  assert.match(first.all, /You made it to Library/);
  const second = await chat("arrived", first.session);
  assert.match(second.all, /Arrived where/);
  assert.equal(second.session.trips.length, first.session.trips.length);
});

test("whitespace-only messages get help, not a crash", async () => {
  const { all } = await chat("   ");
  assert.match(all, /didn't catch that|squad/);
});
