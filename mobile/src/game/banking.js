import { connectBank, transferWalk } from "../api.js";
import { formatDollars } from "../core/savings.js";

export function createBanking({ get, set, persist, say }) {
  const current = (token) => get().generation === token && !get().resetting;
  async function syncTrip(trip) {
    const state = get();
    if (!state.bank) return;
    const result = await transferWalk({
      playerId: state.player.id, tripId: trip.id, title: trip.title, meters: trip.meters,
    });
    if (!current(state.generation)) return;
    if (!result?.nessieId) {
      say(`Saved ${formatDollars(trip.amount)} locally. The server couldn't confirm a Nessie transfer.`);
      return;
    }
    set({ trips: get().trips.map((t) => t.id === trip.id ? { ...t, nessieId: result.nessieId } : t) });
    persist();
  }
  async function connect() {
    const token = get().generation;
    if (!get().player || get().resetting) return false;
    say("Connecting your savings account…");
    const result = await connectBank(get().player.id);
    if (!current(token)) return false;
    if (!result?.bank) { say("Couldn't connect savings. Your walks still save to the local ledger."); return false; }
    set({ bank: result.bank, status: "Connected! New walks will move savings through the server." });
    persist();
    return true;
  }
  return { connect, syncTrip };
}
