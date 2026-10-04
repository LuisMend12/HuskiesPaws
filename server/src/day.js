import { mergeDayLogs, rollDay, todayKey } from "../../core/dayLog.js";
import { HttpError, readJson, sendJson } from "./http.js";
import { playerId } from "./validate.js";

const PHONE = /^\+[1-9]\d{7,14}$/;

function optionalPhone(value) {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || !PHONE.test(value.trim())) {
    throw new HttpError(400, "phone must be E.164, like +16075551234");
  }
  return value.trim();
}

function placesOf(list) {
  if (list == null) return [];
  if (!Array.isArray(list) || list.length > 20) throw new HttpError(400, "places must be a list of at most 20 stops");
  return list.map((place, i) => {
    if (!place || typeof place !== "object") throw new HttpError(400, `places[${i}] is invalid`);
    const id = String(place.id ?? "").trim().slice(0, 40);
    const title = String(place.title ?? "").trim().slice(0, 80);
    if (!id || !title) throw new HttpError(400, `places[${i}] needs id and title`);
    return { id, title };
  });
}

const SQUAD_CLASSES = ["Scout", "Storyteller", "Pathfinder", "Guardian"];

// The app's current squad, so the iMessage agent can use the pets' names.
function squadOf(list) {
  if (list == null) return null;
  if (!Array.isArray(list) || list.length > 5) throw new HttpError(400, "squad must be a list of at most 5 pets");
  return list.map((pet, i) => {
    const name = String(pet?.name ?? "").trim().slice(0, 24);
    if (!name || !SQUAD_CLASSES.includes(pet?.petClass)) throw new HttpError(400, `squad[${i}] needs a name and petClass`);
    return { name, petClass: pet.petClass, species: String(pet.species ?? "").slice(0, 16) || null };
  });
}

export function validateDayLog(body) {
  const hasPlayer = body.playerId != null && body.playerId !== "";
  const phone = optionalPhone(body.phone);
  if (!hasPlayer && !phone) throw new HttpError(400, "playerId or phone is required");
  const steps = body.steps == null ? 0 : Math.floor(Number(body.steps));
  if (!Number.isFinite(steps) || steps < 0 || steps > 200_000) {
    throw new HttpError(400, "steps must be 0-200000");
  }
  return {
    playerId: hasPlayer ? playerId(body.playerId) : null,
    phone,
    steps,
    places: placesOf(body.places),
    squad: squadOf(body.squad),
  };
}

// squad: the latest squad, or null to keep the one stored before.
export function nextDayRecord(days, phones, { playerId, phone, incoming, squad = null, now = new Date() }) {
  const owner = playerId || phones[phone] || phone;
  const previous = mergeDayLogs(
    mergeDayLogs(days[owner], phone ? days[phone] : null, now),
    playerId ? days[playerId] : null,
    now,
  );
  const next = {
    ...mergeDayLogs(previous, incoming, now),
    phone: phone || days[owner]?.phone || null,
    squad: squad ?? days[owner]?.squad ?? null,
    updatedAt: now.toISOString(),
  };
  return { owner, next, dayPhones: phone ? { ...phones, [phone]: owner } : phones };
}

export function createDayRoutes({ store }) {
  return {
    async putDay(req, res) {
      const input = validateDayLog(await readJson(req));
      const now = new Date();
      const incoming = {
        date: todayKey(now),
        steps: input.steps,
        places: input.places,
      };
      const saved = await store.upsertDayLog({
        playerId: input.playerId,
        phone: input.phone,
        incoming,
        squad: input.squad,
        now,
      });
      sendJson(res, 200, saved);
    },

    async getDay(req, res, url) {
      const player = url.searchParams.get("playerId");
      const phone = url.searchParams.get("phone");
      if (!player && !phone) throw new HttpError(400, "playerId or phone is required");
      if (player) playerId(player);
      if (phone) optionalPhone(phone);
      const log = await store.getDayLog({ playerId: player || null, phone: phone || null });
      sendJson(res, 200, { ...rollDay(log), squad: log?.squad ?? null });
    },
  };
}

export function attachDayLogs(store) {
  if (typeof store.upsertDayLog === "function") return store;
  const days = {};
  const phones = {};
  return {
    ...store,
    async upsertDayLog({ playerId, phone, incoming, now = new Date() }) {
      const { owner, next, dayPhones } = nextDayRecord(days, phones, { playerId, phone, incoming, now });
      Object.assign(phones, dayPhones);
      days[owner] = next;
      return next;
    },
    async getDayLog({ playerId, phone }) {
      const owner = playerId || (phone && phones[phone]) || phone;
      return owner ? days[owner] ?? null : null;
    },
  };
}
