// Voice memos. Only stories ("Tell a story") use the server voice (ElevenLabs),
// played from a temporary file; every other line uses on-device speech to save
// voice credits. On-device speech is also the fallback when the server fails.
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { File, Paths } from "expo-file-system";
import * as Speech from "expo-speech";
import { fetchVoice } from "./api.js";

const DEFAULT_VOICE = { pitch: 1.2, rate: 1 };

let generation = 0;
let controller = null;
let cleanup = null;

export function stopMemo() {
  generation += 1;
  controller?.abort();
  controller = null;
  cleanup?.();
  cleanup = null;
  Speech.stop();
}

// story: true for "Tell a story" (server voice); anything else speaks on-device.
export async function speakMemo(text, agent, { story = false } = {}) {
  stopMemo();
  const token = generation;
  controller = new AbortController();
  const fallback = () => {
    if (token !== generation) return;
    const voice = agent?.voice ?? DEFAULT_VOICE;
    Speech.speak(text, { pitch: voice.pitch, rate: voice.rate });
  };
  if (!story) {
    fallback();
    return;
  }
  let file;
  let player;
  let subscription;
  let timeout;
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    clearTimeout(timeout);
    subscription?.remove();
    player?.remove();
    if (file?.exists) file.delete();
    if (cleanup === dispose) cleanup = null;
  };
  try {
    // Stories always ask for the storyteller voice, which the server serves with ElevenLabs.
    const bytes = await fetchVoice(text, { agent: "storyteller", signal: controller.signal });
    if (token !== generation) return;
    if (!bytes?.length) {
      fallback();
      return;
    }
    file = new File(Paths.cache, `memo-${Date.now()}-${token}.mp3`);
    file.create();
    file.write(bytes);
    await setAudioModeAsync({ playsInSilentMode: true });
    if (token !== generation) { dispose(); return; }
    player = createAudioPlayer(file.uri);
    cleanup = dispose;
    subscription = player.addListener("playbackStatusUpdate", (status) => {
      if (status.error) { dispose(); fallback(); }
      else if (status.didJustFinish) dispose();
      else if (status.isLoaded) clearTimeout(timeout);
    });
    timeout = setTimeout(() => { dispose(); fallback(); }, 8000);
    player.play();
  } catch {
    dispose();
    fallback();
  }
}
