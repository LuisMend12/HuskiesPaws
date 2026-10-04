// Voice provider choice: Moss prefers ElevenLabs, others Grok; TTS_PROVIDER can
// put one first for everyone; a failing provider falls back to the other.
import assert from "node:assert/strict";
import { test } from "node:test";
import { createSquadTts } from "../src/tts.js";

const fake = (name, { fail = false } = {}) => ({
  enabled: true,
  calls: [],
  async speak(text, who) {
    this.calls.push(who);
    if (fail) throw new Error(`${name} out of credits`);
    return { audio: Buffer.from(name), contentType: "audio/mpeg" };
  },
});

test("default: Moss on ElevenLabs, Pip and Fern on Grok", () => {
  const tts = createSquadTts({ grok: fake("grok"), elevenlabs: fake("eleven") });
  assert.deepEqual(tts.byAgent, { scout: "grok", storyteller: "elevenlabs", pathfinder: "grok" });
});

test("prefer elevenlabs puts ElevenLabs first for everyone", () => {
  const tts = createSquadTts({ grok: fake("grok"), elevenlabs: fake("eleven"), prefer: "elevenlabs" });
  assert.deepEqual(tts.byAgent, { scout: "elevenlabs", storyteller: "elevenlabs", pathfinder: "elevenlabs" });
  assert.equal(tts.summary, "elevenlabs");
});

test("a failing provider falls back to the other one", async () => {
  const grok = fake("grok", { fail: true });
  const elevenlabs = fake("eleven");
  const tts = createSquadTts({ grok, elevenlabs });
  const { audio } = await tts.speak("Hi from Pip", "scout", "ara");
  assert.equal(audio.toString(), "eleven");
  assert.equal(grok.calls.length, 1, "tried Grok first");
});
