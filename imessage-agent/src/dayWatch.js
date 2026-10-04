import { dayFingerprint, formatDayUpdate, shouldNotifyDay } from "../../core/dayLog.js";
import { text } from "spectrum-ts";

const POLL_MS = 45_000;

export function createDayClient(baseUrl) {
  const base = String(baseUrl ?? "").replace(/\/$/, "");
  async function envelope(path, options = {}) {
    if (!base) return null;
    try {
      const response = await fetch(`${base}${path}`, { ...options, signal: AbortSignal.timeout(12_000) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success === false) return null;
      return payload.data ?? payload;
    } catch {
      return null;
    }
  }
  return {
    enabled: Boolean(base),
    getDay(phone) {
      return envelope(`/api/day?phone=${encodeURIComponent(phone)}`);
    },
    putDay(body) {
      return envelope("/api/day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
  };
}

export function startDayWatch({ imessage, phone, dayClient, intervalMs = POLL_MS }) {
  if (!phone || !dayClient?.enabled) return () => {};
  let last = null;
  const tick = async () => {
    const log = await dayClient.getDay(phone);
    if (!log) return;
    if (shouldNotifyDay(last, log)) {
      try {
        const space = await imessage.space.create(await imessage.user(phone));
        await space.send(text(formatDayUpdate(log)));
      } catch (error) {
        console.warn("Pip day update failed:", error.message);
      }
    }
    last = log;
  };
  tick();
  const timer = setInterval(tick, intervalMs);
  return () => clearInterval(timer);
}

export { dayFingerprint, formatDayUpdate, shouldNotifyDay };
