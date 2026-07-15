import { Platform } from "react-native";
import { requestWidgetUpdateById } from "react-native-android-widget";
import { getWidgetMomentId } from "./widgetBindingStore";
import { renderWidgetTree } from "./previewWidgetRender";
import {
  buildPlaceholderPayload,
  type WidgetPayload,
} from "./widgetSnapshot";
import { loadMomentSnapshot } from "./widgetSnapshotStore";

// The two registered home-screen widgets (small + wide). A given widgetId
// belongs to exactly one of them, but the binding store doesn't record which,
// so refresh tries both names — requestWidgetUpdateById is a no-op for the name
// that doesn't own the id.
const ANDROID_WIDGET_NAMES = ["Preview", "PreviewMedium"];

export async function refreshAndroidWidget(
  widgetId: number,
  payload: WidgetPayload,
): Promise<void> {
  if (Platform.OS !== "android") return;

  for (const widgetName of ANDROID_WIDGET_NAMES) {
    await requestWidgetUpdateById({
      widgetName,
      widgetId,
      renderWidget: (info) =>
        renderWidgetTree(payload, widgetId, {
          width: info.width,
          height: info.height,
        }),
    });
  }
}

/** Headless Android task — resolve payload from binding + per-moment snapshot. */
export async function loadPayloadForWidgetTask(
  widgetId: number,
): Promise<WidgetPayload> {
  const momentId = await getWidgetMomentId(widgetId);
  if (!momentId) {
    return buildPlaceholderPayload();
  }
  return (await loadMomentSnapshot(momentId)) ?? buildPlaceholderPayload();
}
