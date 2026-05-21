import { Platform } from "react-native";
import type { MomentRepository } from "@/features/moments/data/momentRepository";
import { syncWidgetCatalog } from "./widgetCatalogSync";
import {
  clearWidgetBinding,
  getWidgetBindings,
  getWidgetMomentId,
  setWidgetMomentId,
} from "./widgetBindingStore";
import { refreshAndroidWidget } from "./widgetRefresh";
import { reloadIosWidgetTimelines } from "./iosWidgetBridge";
import { loadMomentSnapshot } from "./widgetSnapshotStore";
import {
  buildMomentPayload,
  buildPlaceholderPayload,
  type WidgetPayload,
} from "./widgetSnapshot";

export async function resolveWidgetPayload(
  widgetId: number,
  moments: MomentRepository,
): Promise<WidgetPayload> {
  const momentId = await getWidgetMomentId(widgetId);
  if (!momentId) {
    return buildPlaceholderPayload();
  }

  const cached = await loadMomentSnapshot(momentId);
  if (cached) {
    return cached;
  }

  const moment = await moments.getById(momentId);
  if (!moment) {
    await clearWidgetBinding(widgetId);
    return buildPlaceholderPayload();
  }

  return buildMomentPayload(moment);
}

export async function bindWidgetToMoment(
  moments: MomentRepository,
  widgetId: number,
  momentId: string,
): Promise<void> {
  const moment = await moments.getById(momentId);
  if (!moment) {
    throw new Error("Moment not found");
  }

  await setWidgetMomentId(widgetId, momentId);
  await syncWidgetCatalog(moments);

  if (Platform.OS === "android") {
    const payload = await resolveWidgetPayload(widgetId, moments);
    await refreshAndroidWidget(widgetId, payload);
  }
}

/** Rebuild catalog/snapshots and refresh all placed widgets. */
export async function syncAllWidgets(moments: MomentRepository): Promise<void> {
  await syncWidgetCatalog(moments);

  if (Platform.OS === "android") {
    const bindings = await getWidgetBindings();
    for (const [widgetIdStr, momentId] of Object.entries(bindings)) {
      const widgetId = Number(widgetIdStr);
      if (!Number.isFinite(widgetId)) continue;
      const payload =
        (await loadMomentSnapshot(momentId)) ??
        (await resolveWidgetPayload(widgetId, moments));
      await refreshAndroidWidget(widgetId, payload);
    }
    return;
  }

  if (Platform.OS === "ios") {
    await reloadIosWidgetTimelines();
  }
}
