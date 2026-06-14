import React from "react";
import { PlaceholderWidgetCard } from "./PlaceholderWidgetCard.android";
import { PreviewWidgetCard } from "./PreviewWidgetCard.android";
import type { WidgetPayload } from "./widgetSnapshot";

export function renderWidgetTree(
  payload: WidgetPayload,
  widgetId: number,
  size?: { width: number; height: number },
): React.JSX.Element {
  if (!payload.configured || !payload.momentId) {
    return <PlaceholderWidgetCard widgetId={widgetId} />;
  }

  return (
    <PreviewWidgetCard
      snapshot={payload.snapshot}
      momentId={payload.momentId}
      size={size}
    />
  );
}
