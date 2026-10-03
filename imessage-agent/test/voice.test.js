// Moss's story voice notes, offline: Wikipedia is stubbed and ElevenLabs is a fake,
// so no network, Photon or ElevenLabs keys are needed.
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { VOICE_NOTE_NAME, handleMessage, newSession } from "../src/bot.js";

const PLACE = { pageid: 1, title: "McGraw Tower", lat: 42.4475, lon: -76.4851 };
const EXTRACT = "McGraw Tower is a bell tower at Cornell. Its chimes ring every day.";

const realFetch = globalThis.fetch;
const realConsoleError = console.error;

function fakeWikipedia(url) {
  const body = String(url).includes("geosearch") ? { query: { geosearch: [PLACE] } } : { extract: EXTRACT };
  return Promise.resolve(new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } }));
}

beforeEach(() => {
  globalThis.fetch = fakeWikipedia;
  console.error = () => {}; // the failure test logs on purpose
});

afterEach(() => {
  globalThis.fetch = realFetch;
  console.error = realConsoleError;
});

function fakeTts({ fail = false } = {}) {
  const calls = [];
  return {
    calls,
    enabled: true,
    async speak(text, agent) {
      calls.push({ text, agent });
      if (fail) throw new Error("ElevenLabs TTS failed (401): bad key");
      return { audio: Buffer.from("fake mp3 bytes"), contentType: "audio/mpeg" };
    },
  };
}

async function story(tts) {
  const replies = [];
  await handleMessage("story", newSession(), async (reply) => replies.push(reply), { tts });
  return replies;
}

test("story sends the text first, then Moss's voice note of the same story", async () => {
  const tts = fakeTts();
  const replies = await story(tts);

  assert.equal(replies.length, 2);
  assert.match(replies[0].text, /McGraw Tower/);
  assert.equal(tts.calls.length, 1);
  assert.equal(tts.calls[0].agent, "storyteller");
  assert.ok(replies[0].text.endsWith(tts.calls[0].text), "the voice note reads the story text");
  assert.deepEqual(replies[1], { audio: Buffer.from("fake mp3 bytes"), mimeType: "audio/mpeg", name: VOICE_NOTE_NAME });
});

test("a TTS failure still sends the story text", async () => {
  const replies = await story(fakeTts({ fail: true }));

  assert.equal(replies.length, 1);
  assert.match(replies[0].text, /McGraw Tower/);
  assert.doesNotMatch(replies[0].text, /network snag/);
});

test("a failed voice note upload doesn't trigger the error reply", async () => {
  const replies = [];
  const send = async (reply) => {
    if (reply.audio) throw new Error("upload failed");
    replies.push(reply);
  };
  await handleMessage("story", newSession(), send, { tts: fakeTts() });

  assert.equal(replies.length, 1);
  assert.match(replies[0].text, /McGraw Tower/);
});

test("without an ElevenLabs key, stories stay text-only", async () => {
  const tts = { ...fakeTts(), enabled: false };
  const replies = await story(tts);

  assert.equal(replies.length, 1);
  assert.equal(tts.calls.length, 0);
  assert.equal((await story(undefined)).length, 1);
});
