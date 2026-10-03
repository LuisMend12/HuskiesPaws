// Starts the HuskiesPaws iMessage agent on Photon Spectrum.
//   npm start          -> iMessage via Photon Cloud (needs SPECTRUM_PROJECT_ID / SPECTRUM_PROJECT_SECRET)
//   npm run terminal   -> chat in this terminal, no credentials needed
import { Spectrum, attachment, text } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";
import { terminal } from "spectrum-ts/providers/terminal";
import { setRequestHeaders } from "../../core/services.js";
import { HELP, handleMessage, newSession } from "./bot.js";

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

const sessions = new Map(); // space id -> session (in memory; resets when the agent restarts)
const queues = new Map(); // space id -> promise, so each chat's messages run in order

const toContent = (reply) =>
  reply.imageUrl ? attachment(new URL(reply.imageUrl), { mimeType: "image/jpeg" }) : text(reply.text);

async function respond(space, incoming) {
  const send = (reply) => space.send(toContent(reply));
  const session = sessions.get(space.id) ?? newSession();
  await space.startTyping().catch(() => {}); // typing dots are nice-to-have; ignore unsupported
  const updated = await handleMessage(incoming, session, send);
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
    await space.send(text(`🍊 Pip here! Your HuskiesPaws squad is awake. 🐾\n\n${HELP}`));
    console.log(`Sent a welcome text to ${phone}`);
  } catch (error) {
    console.error("Couldn't send the welcome text:", error);
  }
}

await greetDemoPhone();
console.log(useTerminal ? "HuskiesPaws agent running in the terminal. Say hi!" : "HuskiesPaws agent listening on iMessage…");

for await (const [space, message] of app.messages) {
  if (message.content.type !== "text") continue;
  const previous = queues.get(space.id) ?? Promise.resolve();
  const next = previous
    .then(() => respond(space, message.content.text))
    .catch((error) => console.error(`Failed to answer in ${space.id}:`, error));
  queues.set(space.id, next);
}
