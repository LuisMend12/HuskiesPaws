// Agent voice memos. Placeholder for the Grok Voice API (required for the Cursor
// track): call Grok from a small backend that holds the key, and play the audio.
import * as Speech from "expo-speech";

const DEFAULT_VOICE = { pitch: 1.2, rate: 1 };

// agent is optional: callers without a speaker (e.g. a hatch) get a cheerful default.
export function speakMemo(text, agent) {
  const voice = agent?.voice ?? DEFAULT_VOICE;
  Speech.stop();
  Speech.speak(text, { pitch: voice.pitch, rate: voice.rate });
}
