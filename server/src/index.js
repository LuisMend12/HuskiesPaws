// HuskiesPaws server entry point. Reads settings from .env (repo root, then server/).
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
import { createApp } from "./app.js";
import { createElevenLabs, voicesFromEnv } from "./elevenlabs.js";
import { createGrok } from "./grok.js";
import { createFileStore } from "./store/fileStore.js";
import { createSupabaseStore } from "./store/supabaseStore.js";
import { createSquadTts } from "./tts.js";

const here = dirname(fileURLToPath(import.meta.url));
const serverDir = join(here, "..");

function loadEnvFiles() {
  // Root first, then server/.env fills any keys still unset (same as the old Node flags).
  for (const file of [join(serverDir, "..", ".env"), join(serverDir, ".env")]) {
    if (!existsSync(file)) continue;
    const parsed = parseEnv(readFileSync(file, "utf8"));
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

loadEnvFiles();
const env = process.env;

const config = {
  port: Number(env.PORT) || 8765,
  dataDir: env.DATA_DIR || join(here, "..", "data"),
  limits: {
    voice: { perMinute: Number(env.VOICE_PER_MINUTE) || 20, perDay: Number(env.VOICE_PER_DAY) || 1000 },
    image: { perMinute: Number(env.IMAGES_PER_MINUTE) || 6, perDay: Number(env.IMAGES_PER_DAY) || 200 },
  },
};

const store = env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY
  ? createSupabaseStore({ url: env.SUPABASE_URL, serviceKey: env.SUPABASE_SERVICE_KEY })
  : createFileStore(config.dataDir);
// GROK_API_KEY is accepted too, since the repo-root .env uses that name.
const grok = createGrok({ apiKey: env.XAI_API_KEY || env.GROK_API_KEY, baseUrl: env.XAI_BASE_URL });
const elevenlabs = createElevenLabs({
  apiKey: env.ELEVENLABS_API_KEY,
  baseUrl: env.ELEVENLABS_BASE_URL || undefined,
  voices: voicesFromEnv(env),
});
const tts = createSquadTts({ grok, elevenlabs });
const voiceLabel = tts.summary === "mixed" ? "ElevenLabs (Moss) + Grok Voice (Pip, Fern)" : tts.summary === "elevenlabs" ? "ElevenLabs" : tts.summary === "grok" ? "Grok Voice" : "off (set ELEVENLABS_API_KEY or XAI_API_KEY)";

createApp({ config, store, grok, elevenlabs, tts }).listen(config.port, "0.0.0.0", () => {
  console.log(`HuskiesPaws running at http://localhost:${config.port}`);
  console.log(`  Grok: ${grok.enabled ? "on" : "off (set XAI_API_KEY)"} · voice: ${voiceLabel} · storage: ${store.kind}`);
});
