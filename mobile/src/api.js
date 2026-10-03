// Talks to the HuskiesPaws server. Base URL comes from EXPO_PUBLIC_API_URL.
// No API keys live in the app: Grok and bank secrets stay on the server.
// Every helper returns null on any failure so screens can fall back to sample data.
const TIMEOUT_MS = 15_000;
const IMAGINE_TIMEOUT_MS = 90_000;

export const apiBase = () => (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");
export const apiAvailable = () => Boolean(apiBase());

function absoluteUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = apiBase();
  return base ? `${base}${path}` : path;
}

async function call(path, { method = "GET", body, timeout = TIMEOUT_MS } = {}) {
  const base = apiBase();
  if (!base) return null;
  try {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeout),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) return null;
    return payload.data ?? payload;
  } catch (error) {
    console.warn(`${path} failed:`, error);
    return null;
  }
}

export const getJson = (path) => call(path);
export const postJson = (path, body, options = {}) => call(path, { method: "POST", body, ...options });

export async function fetchHealth() {
  return getJson("/api/health");
}

export async function fetchLeaderboard({ scope, region, me }) {
  const params = new URLSearchParams({ scope, region, me });
  return getJson(`/api/leaderboard?${params}`);
}

export async function submitScore(body) {
  return postJson("/api/score", body);
}

export async function fetchTurf(me) {
  return getJson(`/api/turf?me=${encodeURIComponent(me)}`);
}

export async function claimTurf(body) {
  return postJson("/api/turf/claim", body);
}

export async function fetchPetPortrait(body) {
  const data = await postJson("/api/imagine", { kind: "pet", ...body }, { timeout: IMAGINE_TIMEOUT_MS });
  return absoluteUrl(data?.image) ?? null;
}
