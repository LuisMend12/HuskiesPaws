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

// Provider order for an agent: Moss (storyteller) prefers ElevenLabs, Pip and
// Fern prefer Grok, unless prefer forces one (env TTS_PROVIDER=elevenlabs|grok).
// Only enabled providers are listed.
function providerOrder(agent, elevenlabs, grok, prefer) {
  const elevenFirst = prefer ? prefer === "elevenlabs" : agent === "storyteller";
  const order = elevenFirst ? ["elevenlabs", "grok"] : ["grok", "elevenlabs"];
  return order.filter((name) => (name === "elevenlabs" ? elevenlabs : grok).enabled);
}

function pickProvider(agent, elevenlabs, grok, prefer) {
  return providerOrder(agent, elevenlabs, grok, prefer)[0] ?? null;
}

// prefer: "elevenlabs" or "grok" to put that provider first for every agent.
export function createSquadTts({ grok, elevenlabs, prefer = null }) {
  const agents = ["scout", "storyteller", "pathfinder"];
  const byAgent = Object.fromEntries(agents.map((id) => [id, pickProvider(id, elevenlabs, grok, prefer)]));
  const unique = [...new Set(Object.values(byAgent).filter(Boolean))];
  const summary = unique.length === 0 ? null : unique.length === 1 ? unique[0] : "mixed";

  // Tries the agent's providers in order, so a failure (e.g. Grok out of
  // credits) falls back to the other service instead of to on-device speech.
  async function speak(text, agent, voice) {
    const order = providerOrder(agent, elevenlabs, grok, prefer);
    if (order.length === 0) throw new Error("Text-to-speech isn't configured");
    let lastError = null;
    for (const provider of order) {
      try {
        return provider === "elevenlabs" ? await elevenlabs.speak(text, agent) : await grok.speak(text, voice || grokVoiceFor(agent));
      } catch (error) {
        lastError = error;
        console.warn(`${provider} voice failed for ${agent}${order.length > 1 ? ", trying the next provider" : ""}:`, error.message);
      }
    }
    throw lastError;
  }

  return {
    enabled: Boolean(summary),
    summary,
    byAgent,
    speak,
    providerFor: (agent) => pickProvider(agent, elevenlabs, grok, prefer),
  };
}
