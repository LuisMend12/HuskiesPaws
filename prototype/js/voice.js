// Agent voice memos. Uses Grok Voice (text-to-speech through the server, which
// holds the key) and falls back to the browser's built-in speech when Grok
// isn't available or a request fails.
import { fetchSpeech, grokAvailable } from "./api.js";

const MAX_GROK_CHARS = 600; // the server's limit; longer memos use browser speech
let current = null; // { audio, url } for the memo playing now
let grokFailed = false; // after a failure, stop trying Grok for this session

function stopCurrent() {
  window.speechSynthesis?.cancel();
  if (!current) return;
  current.audio.pause();
  URL.revokeObjectURL(current.url);
  current = null;
}

function speakWithBrowser(text, agent) {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.pitch = agent.voice.pitch;
  utterance.rate = agent.voice.rate;
  window.speechSynthesis.speak(utterance);
}

async function speakWithGrok(text, agent) {
  const blob = await fetchSpeech(text, agent.grokVoice ?? "eve");
  stopCurrent(); // a newer memo may have started while this one loaded
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  current = { audio, url };
  audio.addEventListener("ended", () => {
    if (current?.audio === audio) stopCurrent();
  });
  await audio.play();
}

export async function speakMemo(text, agent) {
  stopCurrent();
  if (grokAvailable() && !grokFailed && text.length <= MAX_GROK_CHARS) {
    try {
      await speakWithGrok(text, agent);
      return;
    } catch (error) {
      // Autoplay blocks and network errors land here; browser speech still works.
      console.warn("Grok Voice unavailable, using browser speech:", error);
      if (error.name !== "NotAllowedError") grokFailed = true;
    }
  }
  speakWithBrowser(text, agent);
}
