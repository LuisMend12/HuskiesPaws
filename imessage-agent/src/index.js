// Starts the HuskiesPaws iMessage agent on Photon Spectrum.
//   npm start          -> iMessage via Photon Cloud (needs SPECTRUM_PROJECT_ID / SPECTRUM_PROJECT_SECRET)
//   npm run terminal   -> chat in this terminal, no credentials needed
// ELEVENLABS_API_KEY (optional) turns on Moss's story voice notes.
import { Spectrum, attachment, text, voice } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";
import { terminal } from "spectrum-ts/providers/terminal";
import { setRequestHeaders } from "../../core/services.js";
import { createElevenLabs, voicesFromEnv } from "../../server/src/elevenlabs.js";
import { createGrok } from "../../server/src/grok.js";
import { createSquadTts } from "../../server/src/tts.js";
import { crewOf, handleMessage, helpText, newSession } from "./bot.js";
import { createDayClient, startDayWatch } from "./dayWatch.js";

// Wikipedia and OpenStreetMap require an identifying User-Agent.
setRequestHeaders({ "User-Agent": "HuskiesPaws/1.0 (BigRed//Hacks 2026 iMessage agent)" });

const useTerminal = process.argv.includes("--terminal");

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}. Copy .env.example to .env and fill it in (see README.md).`);
    process.exit(1);
  }
  return value;
}

const app = useTerminal
  ? await Spectrum({ providers: [terminal.config()] })
  : await Spectrum({
      projectId: requireEnv("SPECTRUM_PROJECT_ID"),
      projectSecret: requireEnv("SPECTRUM_PROJECT_SECRET"),
      providers: [imessage.config()],
    });

// Without a key, tts.enabled is false and stories stay text-only.
const grok = createGrok({ apiKey: process.env.XAI_API_KEY || process.env.GROK_API_KEY, baseUrl: process.env.XAI_BASE_URL });
const elevenlabs = createElevenLabs({ apiKey: process.env.ELEVENLABS_API_KEY, voices: voicesFromEnv(process.env) });
const tts = createSquadTts({ grok, elevenlabs });
const dayApi = createDayClient(process.env.HUSKIESPAWS_API_URL || process.env.API_URL);
const demoPhone = process.env.DEMO_PHONE_NUMBER;

const sessions = new Map(); // space id -> session (in memory; resets when the agent restarts)
const queues = new Map(); // space id -> promise, so each chat's messages run in order

const toContent = (reply) =>
  reply.imageUrl ? attachment(new URL(reply.imageUrl), { mimeType: "image/jpeg" }) : text(reply.text);

// A native iMessage voice bubble must be m4a; spectrum-ts converts MP3 with ffmpeg
// (on PATH or the ffmpeg-static package). Without it, the MP3 goes as a regular file.
async function sendAudio(space, reply) {
  if (useTerminal) return space.send(text(`[voice note: ${Math.ceil(reply.audio.length / 1024)} KB]`));
  try {
    return await space.send(voice(reply.audio, { mimeType: reply.mimeType }));
  } catch (error) {
    console.warn("Voice bubble failed, sending the story as an audio file:", error.message);
    return space.send(attachment(reply.audio, { mimeType: reply.mimeType, name: reply.name }));
  }
}

async function respond(space, incoming) {
  const send = (reply) => (reply.audio ? sendAudio(space, reply) : space.send(toContent(reply)));
  const session = sessions.get(space.id) ?? newSession();
  await space.startTyping().catch(() => {}); // typing dots are nice-to-have; ignore unsupported
  const updated = await handleMessage(incoming, session, send, { tts, dayApi, phone: demoPhone });
  await space.stopTyping().catch(() => {});
  sessions.set(space.id, updated);
}

// Optional: Pip texts this number first when the agent starts (great for demos).
async function greetDemoPhone() {
  const phone = process.env.DEMO_PHONE_NUMBER;
  if (useTerminal || !phone) return;
  try {
    const im = imessage(app);
    const space = await im.space.create(await im.user(phone));
    // Name the squad after the app's pets when the server already has them.
    const squad = (await dayApi?.getDay?.(phone).catch(() => null))?.squad ?? null;
    const crew = crewOf({ squad });
    await space.send(text(`🍊 ${crew.scout.name} here! Your HuskiesPaws squad is awake. 🐾\n\n${helpText(crew)}`));
    console.log(`Sent a welcome text to ${phone}`);
  } catch (error) {
    console.error("Couldn't send the welcome text:", error);
  }
}

await greetDemoPhone();
if (!useTerminal) {
  startDayWatch({ imessage: imessage(app), phone: demoPhone, dayClient: dayApi });
}
console.log(useTerminal ? "HuskiesPaws agent running in the terminal. Say hi!" : "HuskiesPaws agent listening on iMessage…");

for await (const [space, message] of app.messages) {
  if (message.content.type !== "text") continue;
  const previous = queues.get(space.id) ?? Promise.resolve();
  const next = previous
    .then(() => respond(space, message.content.text))
    .catch((error) => console.error(`Failed to answer in ${space.id}:`, error));
  queues.set(space.id, next);
}
