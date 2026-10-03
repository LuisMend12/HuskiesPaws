// Protects the Grok budget: per-IP limits per minute, plus a daily cap for the
// whole server. In memory, so limits reset when the server restarts.
const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

export function createRateLimiter({ perMinute, perDay }) {
  const perIp = new Map(); // ip -> { windowStart, count }
  let day = { start: Date.now(), count: 0 };

  return function allow(ip, now = Date.now()) {
    if (now - day.start >= DAY_MS) day = { start: now, count: 0 };
    if (day.count >= perDay) return { ok: false, reason: "Daily limit reached for this server. Try again tomorrow." };

    const entry = perIp.get(ip);
    const current = !entry || now - entry.windowStart >= MINUTE_MS ? { windowStart: now, count: 0 } : entry;
    if (current.count >= perMinute) return { ok: false, reason: "Too many requests. Wait a minute and try again." };

    perIp.set(ip, { ...current, count: current.count + 1 });
    day = { ...day, count: day.count + 1 };
    return { ok: true };
  };
}
