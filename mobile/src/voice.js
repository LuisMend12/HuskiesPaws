// Agent voice memos. With a server, Moss speaks through ElevenLabs and Pip/Fern
// through Grok Voice. Without a server, or on any failure, we use on-device speech.
import * as Speech from "expo-speech";
import { canUseServerVoice, playServerVoice, stopServerVoice } from "./serverVoice.js";

const DEFAULT_VOICE = { pitch: 1.2, rate: 1 };

// Bumped on every memo so a slow download can't talk over a newer one.
let memoTurn = 0;

// agent is optional: callers without a speaker (e.g. a hatch) get a cheerful default.
export function speakMemo(text, agent) {
  const voice = agent?.voice ?? DEFAULT_VOICE;
  memoTurn += 1;
  const turn = memoTurn;
  const isCurrent = () => turn === memoTurn;
  Speech.stop();
  stopServerVoice();

  const speakOnDevice = () => {
    if (isCurrent()) Speech.speak(text, { pitch: voice.pitch, rate: voice.rate });
  };
  if (!canUseServerVoice(text, agent?.id)) {
    speakOnDevice();
    return;
  }
  playServerVoice(text, agent, isCurrent).catch((error) => {
    console.warn("Server voice failed, using device speech:", error?.message ?? error);
    speakOnDevice();
  });
}
