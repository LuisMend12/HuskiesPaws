// Full conversation against live Wikipedia / OpenStreetMap / routing APIs
// (needs internet, not Photon credentials).
import assert from "node:assert/strict";
import { test } from "node:test";
import { setRequestHeaders } from "../../core/services.js";
import { handleMessage, newSession } from "../src/bot.js";

setRequestHeaders({ "User-Agent": "Wanderlings/1.0 (BigRed//Hacks 2026 agent tests)" });

async function chat(session, message) {
  const replies = [];
  const updated = await handleMessage(message, session, async (reply) => replies.push(reply));
  return { session: updated, replies, all: replies.map((r) => r.text ?? `[image ${r.imageUrl}]`).join("\n") };
}

test("help lists the commands", async () => {
  const { all } = await chat(newSession(), "hi");
  assert.match(all, /explore/);
  assert.match(all, /take me there/);
});

test("guide and arrive need a discovery first", async () => {
  assert.match((await chat(newSession(), "take me there")).all, /explore" first/);
  assert.match((await chat(newSession(), "arrived")).all, /Arrived where/);
});

test("unknown text gets help", async () => {
  assert.match((await chat(newSession(), "banana")).all, /didn't catch that/);
});

test("full walk: locate, explore, guide, arrive, savings", { timeout: 60_000 }, async () => {
  let step = await chat(newSession(), "I'm at Klarman Hall, Ithaca");
  assert.match(step.all, /Got it, you're near/);
  assert.ok(Math.abs(step.session.position.lat - 42.449) < 0.01, "geocoded near Klarman Hall");

  step = await chat(step.session, "explore");
  assert.match(step.all, /heading out/);
  assert.match(step.all, /I'm back! I found/);
  assert.ok(step.session.discovery, "Pip found a place");

  step = await chat(step.session, "take me there");
  assert.match(step.all, /maps\.apple\.com/);
  assert.ok(step.session.pendingTrip.meters > 0);

  step = await chat(step.session, "arrived");
  assert.match(step.all, /You made it to/);
  assert.match(step.all, /You skipped a ~\$\d+\.\d\d ride/, "a walk worth a ride grows savings");

  step = await chat(step.session, "how much have I saved?");
  assert.doesNotMatch(step.all, /saved \$0\.00/);
  console.log(step.all);
});
