// Each squad pet's status, shared by the Squad tab and the map so they agree.
// Uses pet.status from the backend when it exists; until then, a pet is
// "exploring" while the agent for its class is away (the first pet of that
// class in the squad stands in for the agent).

export const CLASS_AGENT = Object.freeze({ Scout: "scout", Storyteller: "storyteller", Pathfinder: "pathfinder" });

// [{ pet, status, agentId }] in squad order.
export function squadStatuses(squad, state) {
  const seen = new Set();
  return squad.map((pet) => {
    const agentId = CLASS_AGENT[pet.petClass] ?? null;
    const firstOfClass = !seen.has(pet.petClass);
    seen.add(pet.petClass);
    const away = Boolean(agentId) && firstOfClass && state.away.includes(agentId);
    return { pet, agentId, status: pet.status ?? (away ? "exploring" : "with-you") };
  });
}

// Squad slots: 3, plus one at Gold and one at Crystal (backend's squadSize wins).
export const BASE_SLOTS = 3;
export const SLOT_UNLOCKS = Object.freeze([{ tier: 2, name: "Gold" }, { tier: 4, name: "Crystal" }]);
export function squadSizeFor(state, leagueTier) {
  return state.squadSize ?? BASE_SLOTS + SLOT_UNLOCKS.filter((u) => leagueTier >= u.tier).length;
}
