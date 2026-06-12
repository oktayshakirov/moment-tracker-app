import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * Thin wrapper around expo-notifications. Lazy-imported so the app keeps
 * working where the native module is unavailable (Expo Go, web).
 */
type NotificationsModule = typeof import("expo-notifications");

let modulePromise: Promise<NotificationsModule | null> | null = null;

export function notificationsSupported(): boolean {
  // Local scheduled notifications need a dev/standalone build.
  return Platform.OS !== "web" && Constants.appOwnership !== "expo";
}

async function loadModule(): Promise<NotificationsModule | null> {
  if (!notificationsSupported()) return null;
  if (!modulePromise) {
    modulePromise = (async () => {
      try {
        return await import("expo-notifications");
      } catch {
        return null;
      }
    })();
  }
  return modulePromise;
}

let configured = false;

/** Set the foreground handler + Android channel. Safe to call repeatedly. */
export async function configureNotifications(): Promise<void> {
  const Notifications = await loadModule();
  if (!Notifications || configured) return;
  configured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("reminders", {
      name: "Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

/** Ask for permission. Returns true if granted. */
export async function ensureNotificationPermission(): Promise<boolean> {
  const Notifications = await loadModule();
  if (!Notifications) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

export async function getNotificationsModule(): Promise<NotificationsModule | null> {
  return loadModule();
}
