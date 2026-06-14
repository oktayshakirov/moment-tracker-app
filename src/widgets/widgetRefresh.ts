import { Platform } from "react-native";
import { requestWidgetUpdateById } from "react-native-android-widget";
import { getWidgetMomentId } from "./widgetBindingStore";
import { renderWidgetTree } from "./previewWidgetRender";
import {
  buildPlaceholderPayload,
  type WidgetPayload,
} from "./widgetSnapshot";
import { loadMomentSnapshot } from "./widgetSnapshotStore";

const ANDROID_WIDGET_NAME = "Preview";

export async function refreshAndroidWidget(
  widgetId: number,
  payload: WidgetPayload,
): Promise<void> {
  if (Platform.OS !== "android") return;

  await requestWidgetUpdateById({
    widgetName: ANDROID_WIDGET_NAME,
    widgetId,
    renderWidget: (info) =>
      renderWidgetTree(payload, widgetId, {
        width: info.width,
        height: info.height,
      }),
  });
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
