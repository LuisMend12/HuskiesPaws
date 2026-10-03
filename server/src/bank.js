// Nessie sandbox keys come only from the server environment. Account mappings
// are private; the phone supplies its player ID and walk, never bank credentials.
import { setupBank, transferToSavings } from "../../core/nessie.js";
import { estimateRideFare } from "../../core/savings.js";
import { HttpError, readJson, sendJson } from "./http.js";
import { playerId, validateBankWalk } from "./validate.js";

export function createBankRoutes({ store, key, client = { setupBank, transferToSavings } }) {
  const queues = new Map();
  function serialized(id, run) {
    const next = (queues.get(id) ?? Promise.resolve()).catch(() => {}).then(run);
    queues.set(id, next);
    return next.finally(() => { if (queues.get(id) === next) queues.delete(id); });
  }
  function configured() {
    if (!key) throw new HttpError(503, "Banking isn't configured on this server (set NESSIE_API_KEY).");
  }
  return {
    async connect(req, res) {
      const id = playerId((await readJson(req)).playerId);
      configured();
      const bank = await serialized(id, async () => {
        const saved = await store.getBank(id);
        if (saved) return saved;
        const created = await client.setupBank(key, "HuskiesPaws");
        await store.saveBank(id, created);
        return created;
      });
      sendJson(res, 200, { bank: { savingsId: bank.savingsId } });
    },
    async transfer(req, res) {
      const walk = validateBankWalk(await readJson(req));
      configured();
      const transfer = await serialized(walk.playerId, async () => {
        const prior = await store.getTransfer(walk.playerId, walk.tripId);
        if (prior?.status === "complete") return prior;
        // A prior pending transfer may have reached Nessie. Do not send it twice.
        if (prior) throw new HttpError(409, "This transfer needs reconciliation before it can be retried.");
        const bank = await store.getBank(walk.playerId);
        if (!bank) throw new HttpError(409, "Connect your savings account first.");
        const amount = estimateRideFare(walk.meters);
        if (!(await store.reserveTransfer(walk.playerId, walk.tripId, { status: "pending", amount }))) {
          throw new HttpError(409, "This transfer is already being processed.");
        }
        const nessieId = await client.transferToSavings(key, bank, amount, `Walked to ${walk.title} instead of riding`);
        const result = { status: "complete", nessieId, amount };
        await store.saveTransfer(walk.playerId, walk.tripId, result);
        return result;
      });
      sendJson(res, 200, transfer);
    },
  };
}
