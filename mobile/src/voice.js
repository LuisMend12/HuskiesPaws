// Agent voice memos. Placeholder for the Grok Voice API (required for the Cursor
// track): call Grok from a small backend that holds the key, and play the audio.
import * as Speech from "expo-speech";

export function speakMemo(text, agent) {
  Speech.stop();
  Speech.speak(text, { pitch: agent.voice.pitch, rate: agent.voice.rate });
}
