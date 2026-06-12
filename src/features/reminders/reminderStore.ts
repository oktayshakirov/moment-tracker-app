import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Maps a moment id to the OS notification identifier currently scheduled for
 * it, so we can cancel/reschedule when the moment or its reminder changes.
 */
const KEY = "reminderNotificationIds";

type IdMap = Record<string, string>;

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

export async function getScheduledId(momentId: string): Promise<string | null> {
  const map = await readMap();
  return map[momentId] ?? null;
}

export async function setScheduledId(
  momentId: string,
  notificationId: string,
): Promise<void> {
  const map = await readMap();
  map[momentId] = notificationId;
  await writeMap(map);
}

export async function clearScheduledId(momentId: string): Promise<void> {
  const map = await readMap();
  if (momentId in map) {
    delete map[momentId];
    await writeMap(map);
  }
}
