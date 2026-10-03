// HuskiesPaws server entry point. Reads settings from .env (repo root, then server/).
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createApp } from "./app.js";
import { createGrok } from "./grok.js";
import { createFileStore } from "./store/fileStore.js";
import { createSupabaseStore } from "./store/supabaseStore.js";

const here = dirname(fileURLToPath(import.meta.url));
const env = process.env;

const config = {
  port: Number(env.PORT) || 8765,
  dataDir: env.DATA_DIR || join(here, "..", "data"),
  nessieKey: env.NESSIE_API_KEY,
  limits: {
    voice: { perMinute: Number(env.VOICE_PER_MINUTE) || 20, perDay: Number(env.VOICE_PER_DAY) || 1000 },
    image: { perMinute: Number(env.IMAGES_PER_MINUTE) || 6, perDay: Number(env.IMAGES_PER_DAY) || 200 },
  },
};

const store = env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY
  ? createSupabaseStore({ url: env.SUPABASE_URL, serviceKey: env.SUPABASE_SERVICE_KEY })
  : createFileStore(config.dataDir);
const grok = createGrok({ apiKey: env.XAI_API_KEY, baseUrl: env.XAI_BASE_URL });

createApp({ config, store, grok }).listen(config.port, () => {
  console.log(`HuskiesPaws running at http://localhost:${config.port}`);
  console.log(`  Grok: ${grok.enabled ? "on" : "off (set XAI_API_KEY)"} · storage: ${store.kind}`);
});
