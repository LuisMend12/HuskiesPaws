// `npm run tunnel`: start Expo behind a free Cloudflare quick tunnel (no account).
// Replaces `expo start --tunnel`, whose shared ngrok account keeps failing with
// "Cannot read properties of undefined (reading 'body')" (ERR_NGROK_108: too many sessions).
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { Tunnel, bin, install } from "cloudflared";

const PORT = 8081; // Metro's default port

if (!existsSync(bin)) {
  console.log("Downloading cloudflared (first run only)...");
  await install(bin);
}

console.log("Starting the Cloudflare tunnel...");
const tunnel = Tunnel.quick(`http://localhost:${PORT}`);
const url = await new Promise((resolve, reject) => {
  tunnel.once("url", resolve);
  tunnel.once("error", reject);
  tunnel.once("exit", (code) => reject(new Error(`cloudflared exited early (code ${code})`)));
});
await new Promise((resolve) => tunnel.once("connected", resolve));

// Expo Go loads exp:// links over plain HTTP, which the quick tunnel also serves.
const proxyUrl = url.replace(/^https:/, "http:");
console.log(`Tunnel ready: ${url}`);

const extra = process.argv.slice(2);
// expo-dev-client makes bare `expo start` prefer a native binary. Default the
// tunnel to Expo Go so `npm run tunnel` still works on a phone without a
// development build. Garden map: `npm run tunnel -- --dev-client`.
const expoFlags = extra.length ? extra : ["--go"];
const expo = spawn("npx", ["expo", "start", "--port", String(PORT), ...expoFlags], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, EXPO_PACKAGER_PROXY_URL: proxyUrl },
});

const stop = () => {
  tunnel.stop();
  expo.kill();
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
expo.on("exit", (code) => {
  tunnel.stop();
  process.exit(code ?? 0);
});
