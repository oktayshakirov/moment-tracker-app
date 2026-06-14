import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { clearWidgetBinding } from "./widgetBindingStore";
import { loadPayloadForWidgetTask } from "./widgetRefresh";
import { renderWidgetTree } from "./previewWidgetRender";
import { buildPlaceholderPayload } from "./widgetSnapshot";

/** Renders placeholder or bound moment per home-screen widget instance. */
export async function previewWidgetHandler({
  widgetInfo,
  widgetAction,
  renderWidget,
}: WidgetTaskHandlerProps): Promise<void> {
  const { widgetId, width, height } = widgetInfo;
  const size = { width, height };

  if (widgetAction === "WIDGET_DELETED") {
    await clearWidgetBinding(widgetId);
    return;
  }

  if (widgetAction === "WIDGET_ADDED") {
    const placeholder = buildPlaceholderPayload();
    renderWidget(renderWidgetTree(placeholder, widgetId, size));
    return;
  }

  const payload = await loadPayloadForWidgetTask(widgetId);
  renderWidget(renderWidgetTree(payload, widgetId, size));
}
