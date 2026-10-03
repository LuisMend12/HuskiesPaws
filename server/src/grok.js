// xAI Grok client: text-to-speech (Grok Voice) and image generation (Grok Imagine).
// Endpoints per docs.x.ai: POST /v1/tts returns raw audio bytes;
// POST /v1/images/generations returns { data: [{ b64_json | url }] }.
const DEFAULT_BASE_URL = "https://api.x.ai";
const IMAGE_MODEL = "grok-imagine-image-2.0";
const TTS_TIMEOUT_MS = 20_000;
const IMAGE_TIMEOUT_MS = 60_000;

export const VOICES = Object.freeze(["eve", "ara", "rex"]);
export const MAX_SPEECH_CHARS = 600;

export function createGrok({ apiKey, baseUrl = DEFAULT_BASE_URL }) {
  const enabled = Boolean(apiKey);

  async function call(path, body, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!response.ok) {
        const detail = (await response.text().catch(() => "")).slice(0, 200);
        throw new Error(`Grok ${path} failed (${response.status}): ${detail}`);
      }
      return response;
    } finally {
      clearTimeout(timer);
    }
  }

  // Returns { audio: Buffer, contentType }.
  async function speak(text, voice) {
    const response = await call("/v1/tts", { text, voice_id: voice, language: "en" }, TTS_TIMEOUT_MS);
    return {
      audio: Buffer.from(await response.arrayBuffer()),
      contentType: response.headers.get("content-type") ?? "audio/mpeg",
    };
  }

  // Returns { image: Buffer } or { url } depending on what the API sends back.
  async function imagine(prompt) {
    const response = await call(
      "/v1/images/generations",
      { model: IMAGE_MODEL, prompt, n: 1, response_format: "b64_json" },
      IMAGE_TIMEOUT_MS,
    );
    const [first] = (await response.json()).data ?? [];
    if (first?.b64_json) return { image: Buffer.from(first.b64_json, "base64") };
    if (first?.url) return { url: first.url };
    throw new Error("Grok returned no image");
  }

  return { enabled, speak, imagine };
}

// Prompts are built here from fixed templates, never taken from the browser,
// so the API key can't be used as a general-purpose image generator.
const STYLE = "cozy storybook watercolor illustration, soft pastel colors, gentle light, no text, no words, no letters";

export function postcardPrompt({ title, fact }) {
  return `A postcard scene of ${title}. ${fact} ${STYLE}. A small round leafy creature waves in the corner.`;
}

const PET_LOOKS = Object.freeze({
  common: "simple and friendly",
  rare: "with a shimmering leaf crown",
  epic: "glowing softly with flower petals swirling around it",
  legendary: "radiant and majestic, with a halo of tiny stars and blossoms",
});

export function petPrompt({ rarity, petClass, color }) {
  const look = PET_LOOKS[rarity] ?? PET_LOOKS.common;
  return `A cute round ${color} husky-puppy-like forest spirit pet, a ${petClass} companion, ${look}, standing on a mossy path. Character portrait, centered, plain light background, ${STYLE}.`;
}
