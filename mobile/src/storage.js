// Saved progress on the phone (AsyncStorage). Mirrors prototype/js/storage.js,
// but async: load everything once at startup, then save in batches.
import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "wanderlings:";

export async function loadAll(defaults) {
  const keys = Object.keys(defaults);
  try {
    const pairs = await AsyncStorage.multiGet(keys.map((key) => PREFIX + key));
    return Object.fromEntries(
      pairs.map(([, raw], i) => [keys[i], raw ? JSON.parse(raw) : defaults[keys[i]]]),
    );
  } catch (error) {
    console.warn("Could not load saved progress, using defaults:", error);
    return defaults;
  }
}

export async function saveAll(values) {
  try {
    await AsyncStorage.multiSet(
      Object.entries(values).map(([key, value]) => [PREFIX + key, JSON.stringify(value)]),
    );
  } catch (error) {
    console.warn("Could not save progress:", error);
  }
}

export async function clearKeys(keys) {
  try {
    await AsyncStorage.multiRemove(keys.map((key) => PREFIX + key));
  } catch (error) {
    console.warn("Could not clear saved progress:", error);
  }
}
