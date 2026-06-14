import AsyncStorage from "@react-native-async-storage/async-storage";
import type { WidgetBindingsMap } from "./widgetCatalog";

const BINDINGS_KEY = "@momenttracker/widgetBindings";

export async function getWidgetBindings(): Promise<WidgetBindingsMap> {
  const raw = await AsyncStorage.getItem(BINDINGS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as WidgetBindingsMap;
  } catch {
    return {};
  }
}

async function saveBindings(bindings: WidgetBindingsMap): Promise<void> {
  await AsyncStorage.setItem(BINDINGS_KEY, JSON.stringify(bindings));
}

export async function getWidgetMomentId(
  widgetId: number,
): Promise<string | null> {
  const bindings = await getWidgetBindings();
  return bindings[String(widgetId)] ?? null;
}

export async function setWidgetMomentId(
  widgetId: number,
  momentId: string | null,
): Promise<void> {
  const bindings = await getWidgetBindings();
  const key = String(widgetId);
  if (momentId) {
    bindings[key] = momentId;
  } else {
    delete bindings[key];
  }
  await saveBindings(bindings);
}

export async function clearWidgetBinding(widgetId: number): Promise<void> {
  await setWidgetMomentId(widgetId, null);
}

/** Number of widgets currently bound to a moment. */
export async function countWidgetBindings(): Promise<number> {
  const bindings = await getWidgetBindings();
  return Object.keys(bindings).length;
}
