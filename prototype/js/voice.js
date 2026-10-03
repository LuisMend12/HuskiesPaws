// Voice memos. Placeholder for the Grok Voice API: the demo uses the browser's
// built-in speech so it runs without keys. Swap speakMemo's body for a call to a
// small backend that holds the Grok key (never put the key in browser code).

export function speakMemo(text, agent) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.pitch = agent.voice.pitch;
  utterance.rate = agent.voice.rate;
  window.speechSynthesis.speak(utterance);
}
