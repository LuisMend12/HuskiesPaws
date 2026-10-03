// Talks to the HuskiesPaws server (server/). When the page is served without it
// (python serve.py, GitHub Pages), apiAvailable() is false and the app falls back
// to browser speech, SVG art, and sample leaderboards.
const env = () => window.WANDERLINGS_ENV ?? {};
const API_TIMEOUT_MS = 15_000;
const IMAGINE_TIMEOUT_MS = 90_000;

export const apiAvailable = () => env().API === true;
export const grokAvailable = () => apiAvailable() && env().GROK === true;

async function call(path, { method = "GET", body, timeout = API_TIMEOUT_MS, raw = false } = {}) {
  const response = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeout),
  });
  if (raw) {
    if (!response.ok) throw new Error(`${path} failed (${response.status})`);
    return response;
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.success) throw new Error(payload.error ?? `${path} failed (${response.status})`);
  return payload.data;
}

export const getJson = (path) => call(path);
export const postJson = (path, body, options = {}) => call(path, { method: "POST", body, ...options });

// Grok Voice: returns an audio Blob.
export async function fetchSpeech(text, voice) {
  const response = await call("/api/voice", { method: "POST", body: { text, voice }, raw: true });
  return response.blob();
}

// Grok Imagine: returns a server image path like "/images/abc.png".
export async function fetchImage(request) {
  const data = await postJson("/api/imagine", request, { timeout: IMAGINE_TIMEOUT_MS });
  return data.image;
}
