// `npm run tunnel`: start Expo behind a free Cloudflare quick tunnel (no account).
// Replaces `expo start --tunnel`, whose shared ngrok account keeps failing with
// "Cannot read properties of undefined (reading 'body')" (ERR_NGROK_108: too many sessions).
// A second tunnel fronts the local API so Tell a story can reach ElevenLabs.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { Tunnel, bin, install } from "cloudflared";

const METRO_PORT = 8081;
const API_PORT = Number(process.env.PORT) || 8765;

if (!existsSync(bin)) {
  console.log("Downloading cloudflared (first run only)...");
  await install(bin);
}

async function quickTunnel(origin, label) {
  const tunnel = Tunnel.quick(origin);
  const url = await new Promise((resolve, reject) => {
    tunnel.once("url", resolve);
    tunnel.once("error", reject);
    tunnel.once("exit", (code) => reject(new Error(`${label} cloudflared exited early (code ${code})`)));
  });
  await new Promise((resolve) => tunnel.once("connected", resolve));
  return { tunnel, url };
}

console.log("Starting the Cloudflare tunnels...");
const metro = await quickTunnel(`http://localhost:${METRO_PORT}`, "Expo");
// Only front the local API when it's actually running. Pointing the app at a
// tunnel with nothing behind it made every server call fail (claims did nothing,
// voices fell back) instead of letting the app play offline.
async function localApiUp() {
  try {
    const response = await fetch(`http://127.0.0.1:${API_PORT}/api/health`, { signal: AbortSignal.timeout(1500) });
    return response.ok;
  } catch {
    return false;
  }
}

let api = null;
if (process.env.EXPO_PUBLIC_API_URL) {
  // A deployed API is configured (see below); no local API tunnel needed.
} else if (await localApiUp()) {
  try {
    api = await quickTunnel(`http://127.0.0.1:${API_PORT}`, "API");
    console.log(`API tunnel: ${api.url}`);
    console.log("Keep the server (`npm --prefix ../server start`) running so Moss can use ElevenLabs.");
  } catch (error) {
    console.warn(`API tunnel failed (${error.message}). The app will play offline.`);
  }
} else {
  console.log(`No local API on port ${API_PORT}: the app plays offline (local claims, on-device voices).`);
  console.log("For Grok/ElevenLabs voices and shared turf, run `npm --prefix ../server start` (from mobile/) in another terminal first, then restart this.");
}

// Expo Go loads exp:// links over plain HTTP, which the quick tunnel also serves.
const proxyUrl = metro.url.replace(/^https:/, "http:");
console.log(`Tunnel ready: ${metro.url}`);

const extra = process.argv.slice(2);
// expo-dev-client makes bare `expo start` prefer a native binary. Default the
// tunnel to Expo Go so `npm run tunnel` still works on a phone without a
// development build. Garden map: `npm run tunnel -- --dev-client`.
const expoFlags = extra.length ? extra : ["--go"];
const expoEnv = {
  ...process.env,
  EXPO_PACKAGER_PROXY_URL: proxyUrl,
};
// A deployed API (Render) in EXPO_PUBLIC_API_URL / mobile/.env wins over the local tunnel.
const existingApi = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");
if (existingApi) {
  expoEnv.EXPO_PUBLIC_API_URL = existingApi;
  console.log(`Using existing EXPO_PUBLIC_API_URL (${existingApi})`);
} else if (api?.url) {
  expoEnv.EXPO_PUBLIC_API_URL = api.url.replace(/\/$/, "");
}

const expo = spawn("npx", ["expo", "start", "--port", String(METRO_PORT), ...expoFlags], {
  stdio: "inherit",
  shell: true,
  env: expoEnv,
});

const stop = () => {
  metro.tunnel.stop();
  api?.tunnel.stop();
  expo.kill();
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
expo.on("exit", (code) => {
  metro.tunnel.stop();
  api?.tunnel.stop();
  process.exit(code ?? 0);
});
