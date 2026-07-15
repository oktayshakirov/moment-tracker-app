import { Platform } from "react-native";
import type { MomentRepository } from "@/features/moments/data/momentRepository";
import {
  pushCatalogToIos,
  pushSnapshotToIos,
  removeSnapshotOnIos,
} from "./iosWidgetBridge";
import {
  loadWidgetCatalog,
  removeMomentSnapshot,
  saveMomentSnapshot,
  saveWidgetCatalog,
} from "./widgetSnapshotStore";
import type { WidgetCatalogEntry } from "./widgetCatalog";
import { buildMomentPayload, payloadToIosJson } from "./widgetSnapshot";
import { prepareWidgetImage, removeWidgetImage } from "./widgetImageService";
/** Rebuild catalog + per-moment snapshot files from the database. */
export async function syncWidgetCatalog(
  moments: MomentRepository,
): Promise<void> {
  const list = await moments.listAll();
  const catalog: WidgetCatalogEntry[] = list.map((m) => ({
    id: m.id,
    title: m.title,
    backgroundColor: m.accentColor,
  }));

  const activeIds = new Set(list.map((m) => m.id));
  const previousCatalog = await loadWidgetCatalog();
  for (const entry of previousCatalog) {
    if (!activeIds.has(entry.id)) {
      await removeMomentSnapshot(entry.id);
      await removeWidgetImage(entry.id);
      if (Platform.OS === "ios") {
        removeSnapshotOnIos(entry.id);
      }
    }
  }

  await saveWidgetCatalog(catalog);

  for (const moment of list) {
    const payload = buildMomentPayload(moment);
    const image = await prepareWidgetImage(moment);
    payload.snapshot.backgroundImageName = image.backgroundImageName;
    payload.snapshot.backgroundImageUri = image.backgroundImageUri;
    payload.snapshot.backgroundImageAspect = image.backgroundImageAspect;
    await saveMomentSnapshot(moment.id, payload);
    if (Platform.OS === "ios") {
      pushSnapshotToIos(moment.id, payloadToIosJson(payload));
    }
  }

  if (Platform.OS === "ios") {
    pushCatalogToIos(JSON.stringify(catalog));
  }
}
