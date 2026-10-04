// Development-only diagnostics for the 3D freeze hunt. Lines show in the Metro
// terminal. Remove once the freeze is found.
const on = typeof __DEV__ !== "undefined" && __DEV__;
const t0 = Date.now();
export const diag = (...args) => on && console.log(`[diag +${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...args);

let started = false;
// Logs every 2 s and how late the timer fired: a long gap means the JS thread was blocked.
export function startHeartbeat() {
  if (!on || started) return;
  started = true;
  let last = Date.now();
  setInterval(() => {
    const now = Date.now();
    diag(`heartbeat (late by ${now - last - 2000} ms)`);
    last = now;
  }, 2000);
}
