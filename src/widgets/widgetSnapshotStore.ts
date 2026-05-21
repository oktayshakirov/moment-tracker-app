import AsyncStorage from "@react-native-async-storage/async-storage";
import type { WidgetPayload } from "./widgetSnapshot";

const CATALOG_KEY = "@timekeeper/moments-catalog";
const snapshotKey = (momentId: string) => `@timekeeper/snapshots/${momentId}`;

export async function saveWidgetCatalog(
  entries: { id: string; title: string; backgroundColor: string }[],
): Promise<void> {
  await AsyncStorage.setItem(CATALOG_KEY, JSON.stringify(entries));
}

export async function loadWidgetCatalog(): Promise<
  { id: string; title: string; backgroundColor: string }[]
> {
  const raw = await AsyncStorage.getItem(CATALOG_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as { id: string; title: string; backgroundColor: string }[];
  } catch {
    return [];
  }
}

export async function saveMomentSnapshot(
  momentId: string,
  payload: WidgetPayload,
): Promise<void> {
  await AsyncStorage.setItem(snapshotKey(momentId), JSON.stringify(payload));
}

export async function loadMomentSnapshot(
  momentId: string,
): Promise<WidgetPayload | null> {
  const raw = await AsyncStorage.getItem(snapshotKey(momentId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WidgetPayload;
  } catch {
    return null;
  }
}

export async function removeMomentSnapshot(momentId: string): Promise<void> {
  await AsyncStorage.removeItem(snapshotKey(momentId));
}
