import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Maps a moment id to the OS notification identifiers currently scheduled for
 * it, so we can cancel/reschedule when the moment or its reminder changes.
 * Milestone reminders schedule several notifications at once; older app
 * versions stored a single id, so values may be either shape.
 */
const KEY = "reminderNotificationIds";

type IdMap = Record<string, string | string[]>;

async function readMap(): Promise<IdMap> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as IdMap;
  } catch {
    return {};
  }
}

async function writeMap(map: IdMap): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(map));
}

export async function getScheduledIds(momentId: string): Promise<string[]> {
  const map = await readMap();
  const value = map[momentId];
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export async function setScheduledIds(
  momentId: string,
  notificationIds: string[],
): Promise<void> {
  const map = await readMap();
  map[momentId] = notificationIds;
  await writeMap(map);
}

export async function clearScheduledIds(momentId: string): Promise<void> {
  const map = await readMap();
  if (momentId in map) {
    delete map[momentId];
    await writeMap(map);
  }
}
