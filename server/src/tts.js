// Picks a TTS provider per squad member. Moss (storyteller) uses ElevenLabs when
// that key is set; Pip and Fern use Grok Voice. If only one provider is on, everyone
// uses it. Shared by the HTTP API and the iMessage agent.
const GROK_VOICE = Object.freeze({
  scout: "ara",
  storyteller: "rex",
  pathfinder: "eve",
});

export function grokVoiceFor(agent) {
  return GROK_VOICE[agent] ?? GROK_VOICE.pathfinder;
}

function pickProvider(agent, elevenlabs, grok) {
  const prefersEleven = agent === "storyteller";
  if (prefersEleven) {
    if (elevenlabs.enabled) return "elevenlabs";
    if (grok.enabled) return "grok";
    return null;
  }
  if (grok.enabled) return "grok";
  if (elevenlabs.enabled) return "elevenlabs";
  return null;
}

export function createSquadTts({ grok, elevenlabs }) {
  const agents = ["scout", "storyteller", "pathfinder"];
  const byAgent = Object.fromEntries(agents.map((id) => [id, pickProvider(id, elevenlabs, grok)]));
  const unique = [...new Set(Object.values(byAgent).filter(Boolean))];
  const summary = unique.length === 0 ? null : unique.length === 1 ? unique[0] : "mixed";

  async function speak(text, agent, voice) {
    const provider = pickProvider(agent, elevenlabs, grok);
    if (!provider) throw new Error("Text-to-speech isn't configured");
    if (provider === "elevenlabs") return elevenlabs.speak(text, agent);
    return grok.speak(text, voice || grokVoiceFor(agent));
  }

  return {
    enabled: Boolean(summary),
    summary,
    byAgent,
    speak,
    providerFor: (agent) => pickProvider(agent, elevenlabs, grok),
  };
}
