// Server text-to-speech. The key stays on the server. Moss uses ElevenLabs;
// Pip and Fern use Grok Voice when that key is set. The app posts text and plays MP3.
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { File, Paths } from "expo-file-system";
import { apiAvailable, apiBase } from "./api.js";

const VOICE_TIMEOUT_MS = 15_000;
export const VOICE_MAX_CHARS = 600;

let player = null;

// Small stable hash so the same memo from the same agent replays from cache.
function hashText(text) {
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) hash = ((hash * 33) ^ text.charCodeAt(i)) >>> 0;
  return `${hash.toString(36)}${text.length.toString(36)}`;
}

function cacheFile(text, agentId) {
  return new File(Paths.cache, `voice-${agentId}-${hashText(text)}.mp3`);
}

async function fetchVoiceFile(text, agent) {
  const agentId = agent.id;
  const file = cacheFile(text, agentId);
  if (file.exists) return file;
  // AbortController + timer: AbortSignal.timeout isn't in every React Native runtime.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VOICE_TIMEOUT_MS);
  let bytes;
  try {
    const response = await fetch(`${apiBase()}/api/voice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        agent: agentId,
        ...(agentId === "storyteller" ? {} : { voice: agent.grokVoice }),
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`/api/voice returned ${response.status}`);
    bytes = new Uint8Array(await response.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
  if (bytes.length === 0) throw new Error("/api/voice returned no audio");
  try {
    file.write(bytes);
  } catch (error) {
    if (file.exists) file.delete();
    throw error;
  }
  return file;
}

function getPlayer() {
  if (!player) {
    player = createAudioPlayer(null);
    setAudioModeAsync({ playsInSilentMode: true }).catch((error) => console.warn("Audio mode failed:", error));
  }
  return player;
}

export function canUseServerVoice(text, agentId) {
  return apiAvailable() && Boolean(agentId) && text.length <= VOICE_MAX_CHARS;
}

// Rejects on any failure so the caller can fall back to on-device speech.
// isCurrent() lets a newer memo cancel this one while the audio downloads.
export async function playServerVoice(text, agent, isCurrent) {
  const file = await fetchVoiceFile(text, agent);
  if (!isCurrent()) return;
  const audio = getPlayer();
  audio.replace({ uri: file.uri });
  audio.play();
}

export function stopServerVoice() {
  player?.pause();
}
