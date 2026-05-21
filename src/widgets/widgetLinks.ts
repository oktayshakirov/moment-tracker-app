/** Deep-link scheme — must match `scheme` in app.json. */
export const WIDGET_SCHEME = "timekeeper";

/** Default widget id for Android configure deep links. */
export const IOS_WIDGET_INSTANCE_ID = 0;

/** Opens widget-only configuration UI (Android tap / legacy). */
export function widgetPickerUri(widgetId: number): string {
  return `${WIDGET_SCHEME}://widget-picker?widgetId=${widgetId}&standalone=1`;
}

export function momentDetailUri(momentId: string): string {
  return `${WIDGET_SCHEME}://moment/${encodeURIComponent(momentId)}`;
}

export function isWidgetConfigureUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes("widget-picker");
}

export function parseWidgetPickerWidgetId(url: string): number {
  try {
    const parsed = new URL(url);
    const raw = parsed.searchParams.get("widgetId");
    if (raw == null || raw === "") return IOS_WIDGET_INSTANCE_ID;
    const id = Number(raw);
    return Number.isFinite(id) ? id : IOS_WIDGET_INSTANCE_ID;
  } catch {
    return IOS_WIDGET_INSTANCE_ID;
  }
}
