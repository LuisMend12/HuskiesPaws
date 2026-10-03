// Saved progress. Uses localStorage in the browser; in the mobile app, swap this
// file for AsyncStorage (React Native) with the same load/save interface.
const PREFIX = "wanderlings:";

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn(`Could not load "${key}", using defaults:`, error);
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Could not save "${key}":`, error);
    return false;
  }
}

export function clearAll(keys) {
  try {
    keys.forEach((key) => localStorage.removeItem(PREFIX + key));
  } catch (error) {
    console.warn("Could not clear saved progress:", error);
  }
}
