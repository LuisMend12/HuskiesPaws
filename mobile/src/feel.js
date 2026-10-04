// Light haptic feedback. Failures are ignored so Expo Go and tests stay quiet.
import * as Haptics from "expo-haptics";

export function tapFeel() {
  Haptics.selectionAsync().catch(() => {});
}

export function successFeel() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
