// `npm run tunnel`: start Expo behind a free Cloudflare quick tunnel (no account).
// Replaces `expo start --tunnel`, whose shared ngrok account keeps failing with
// "Cannot read properties of undefined (reading 'body')" (ERR_NGROK_108: too many sessions).
//
// Cloudflare 530 / error 1033 ("unable to reach the host") happens if the quick
// tunnel comes up before Metro is listening on 8081. A small local proxy always
// answers HTTP so Cloudflare stays connected, then pipes to Metro once it is up.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
import { Tunnel, bin, install } from "cloudflared";

const METRO_PORT = 8081;
const PROXY_PORT = 8091;
const API_PORT = Number(process.env.PORT) || 8765;

if (!existsSync(bin)) {
  console.log("Downloading cloudflared (first run only)...");
  await install(bin);
}

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: "127.0.0.1" }, () => {
      socket.end();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
  });
}

async function waitForPort(port, label, ms = 90_000) {
  const started = Date.now();
  while (Date.now() - started < ms) {
    if (await portOpen(port)) return true;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`${label} did not open on port ${port} after ${Math.round(ms / 1000)}s`);
}

// Always-on listener for cloudflared. If Metro is down, return HTTP 200 so the
// tunnel hostname does not go into Error 1033. If Metro is up, pipe bytes
// (HTTP and the Metro websocket).
function startOriginProxy(listenPort, targetPort) {
  return net.createServer((client) => {
    const dest = net.connect({ port: targetPort, host: "127.0.0.1" });
    dest.once("connect", () => {
      client.pipe(dest);
      dest.pipe(client);
    });
    dest.once("error", () => {
      try {
        client.end("HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 8\r\nConnection: close\r\n\r\nstarting");
      } catch {
        client.destroy();
      }
    });
    client.on("error", () => dest.destroy());
  }).listen(listenPort, "127.0.0.1");
}

async function quickTunnel(origin, label) {
  const tunnel = Tunnel.quick(origin);
  const url = await Promise.race([
    new Promise((resolve, reject) => {
      tunnel.once("url", resolve);
      tunnel.once("error", reject);
      tunnel.once("exit", (code) => reject(new Error(`${label} cloudflared exited early (code ${code})`)));
    }),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out waiting for a trycloudflare URL`)), 45_000);
    }),
  ]);
  await Promise.race([
    new Promise((resolve) => tunnel.once("connected", resolve)),
    new Promise((resolve) => setTimeout(resolve, 8_000)),
  ]);
  return { tunnel, url };
}

async function localApiUp() {
  try {
    const response = await fetch(`http://127.0.0.1:${API_PORT}/api/health`, { signal: AbortSignal.timeout(1500) });
    return response.ok;
  } catch {
    return false;
  }
}

if (await portOpen(PROXY_PORT)) {
  throw new Error(`Port ${PROXY_PORT} is already in use. Stop the other npm run tunnel and try again.`);
}

const proxy = startOriginProxy(PROXY_PORT, METRO_PORT);
console.log(`Origin proxy http://127.0.0.1:${PROXY_PORT} → Metro :${METRO_PORT}`);

console.log("Starting the Cloudflare tunnel...");
const metro = await quickTunnel(`http://127.0.0.1:${PROXY_PORT}`, "Expo");
const proxyUrl = metro.url.replace(/^https:/, "http:");
console.log(`Tunnel hostname: ${metro.url}`);
console.log("Starting Expo. Do not scan a QR code until it says Metro is ready.");

const extra = process.argv.slice(2);
const expoFlags = extra.length ? extra : ["--go"];
const expoEnv = { ...process.env, EXPO_PACKAGER_PROXY_URL: proxyUrl };

let api = null;
const existingApi = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");
if (existingApi) {
  expoEnv.EXPO_PUBLIC_API_URL = existingApi;
  console.log(`Using existing EXPO_PUBLIC_API_URL (${existingApi})`);
} else if (await localApiUp()) {
  try {
    api = await quickTunnel(`http://127.0.0.1:${API_PORT}`, "API");
    expoEnv.EXPO_PUBLIC_API_URL = api.url.replace(/\/$/, "");
    console.log(`API tunnel: ${api.url}`);
  } catch (error) {
    console.warn(`API tunnel failed (${error.message}). The app will play offline.`);
  }
} else {
  console.log(`No local API on port ${API_PORT}: on-device speech and local turf until the server is running.`);
}

const expo = spawn("npx", ["expo", "start", "--port", String(METRO_PORT), ...expoFlags], {
  stdio: "inherit",
  shell: true,
  env: expoEnv,
});

try {
  await waitForPort(METRO_PORT, "Expo Metro");
  console.log("");
  console.log("Metro is up. Scan THIS run's QR (exp://….trycloudflare.com).");
  console.log("An old trycloudflare link from a previous run causes Cloudflare 530 / 1033.");
  console.log("");
} catch (error) {
  console.warn(error.message);
  console.warn("If Expo Go shows Cloudflare 530, wait for Metro, then scan the new QR.");
}

const stop = () => {
  metro.tunnel.stop();
  api?.tunnel.stop();
  expo.kill();
  proxy.close();
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
expo.on("exit", (code) => {
  metro.tunnel.stop();
  api?.tunnel.stop();
  proxy.close();
  process.exit(code ?? 0);
});
