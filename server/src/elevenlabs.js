// ElevenLabs text-to-speech client. Per elevenlabs.io/docs:
// POST /v1/text-to-speech/{voice_id}?output_format=mp3_44100_128
// headers { "xi-api-key": key }, body { text, model_id } -> raw MP3 bytes.
// Shared by the server (/api/voice) and the iMessage agent (voice notes).
const DEFAULT_BASE_URL = "https://api.elevenlabs.io";
const MODEL_ID = "eleven_flash_v2_5"; // fast and cheap; good for short memos
const OUTPUT_FORMAT = "mp3_44100_128";
const TTS_TIMEOUT_MS = 20_000;

// Premade ElevenLabs voices, one per squad member. Override with ELEVENLABS_VOICE_<AGENT>.
export const ELEVEN_VOICES = Object.freeze({
  scout: "pFZP5JQG7iQjIQuC4Bku", // Lily: bright and quick, for Pip
  storyteller: "JBFqnCBsd6RMkjVDRZzb", // George: warm British narrator, for Moss
  pathfinder: "EXAVITQu4vr4xnSDxMDL", // Sarah: calm and clear, for Fern
  default: "EXAVITQu4vr4xnSDxMDL",
});

export function voicesFromEnv(env = {}) {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(ELEVEN_VOICES).map(([agent, id]) => [agent, env[`ELEVENLABS_VOICE_${agent.toUpperCase()}`] || id]),
    ),
  );
}

export function createElevenLabs({ apiKey, baseUrl = DEFAULT_BASE_URL, voices = ELEVEN_VOICES }) {
  const enabled = Boolean(apiKey);

  // agent is a squad id ("scout", "storyteller", "pathfinder"); unknown ids use the default voice.
  // Returns { audio: Buffer, contentType }.
  async function speak(text, agent) {
    const voiceId = voices[agent] ?? voices.default;
    const response = await fetch(`${baseUrl}/v1/text-to-speech/${voiceId}?output_format=${OUTPUT_FORMAT}`, {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: MODEL_ID }),
      signal: AbortSignal.timeout(TTS_TIMEOUT_MS),
    });
    if (!response.ok) {
      const detail = (await response.text().catch(() => "")).slice(0, 200);
      throw new Error(`ElevenLabs TTS failed (${response.status}): ${detail}`);
    }
    return {
      audio: Buffer.from(await response.arrayBuffer()),
      contentType: response.headers.get("content-type") ?? "audio/mpeg",
    };
  }

  return { enabled, speak };
}
