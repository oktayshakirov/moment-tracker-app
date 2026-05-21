import type { Moment } from "@/features/moments/domain/moment";
import { getBackgroundAccent } from "@/features/moments/domain/momentAccent";
import {
  formatMomentPrimaryDisplay,
  formatMomentUnitLabel,
  formatSinceUntilLabel,
  getTickerIntervalMs,
} from "@/features/moments/domain/momentFormatters";
import { splitLeadingNumber } from "@/features/moments/domain/splitLeadingNumber";

import { DEFAULT_ACCENT, WIDGET_PLACEHOLDER_HINT_ANDROID } from "./widgetConstants";

const PLACEHOLDER_BG = "#1C2127";

export type WidgetSnapshot = {
  title: string;
  primary: string;
  subLabel: string;
  sinceUntil: string;
  backgroundColor: string;
  refreshIntervalSeconds: number;
};

export type WidgetPayload = {
  configured: boolean;
  momentId: string | null;
  snapshot: WidgetSnapshot;
};

export const WIDGET_PLACEHOLDER_SNAPSHOT: WidgetSnapshot = {
  title: "Time Keeper",
  primary: "",
  subLabel: "",
  sinceUntil: WIDGET_PLACEHOLDER_HINT_ANDROID,
  backgroundColor: PLACEHOLDER_BG,
  refreshIntervalSeconds: 3600,
};

export function buildPlaceholderPayload(): WidgetPayload {
  return {
    configured: false,
    momentId: null,
    snapshot: WIDGET_PLACEHOLDER_SNAPSHOT,
  };
}

export function buildWidgetSnapshot(
  moment: Moment,
  now: Date = new Date(),
): WidgetSnapshot {
  const primaryRaw = formatMomentPrimaryDisplay(moment, now, "compact");
  const unitLabel = formatMomentUnitLabel(moment);
  const isAuto = moment.displayUnit === "auto";
  const split = splitLeadingNumber(primaryRaw);
  const primary = split.leading || primaryRaw;
  const subLabel = isAuto
    ? split.trailing
    : [split.trailing, unitLabel].filter(Boolean).join(" ");

  const refreshMs = getTickerIntervalMs(moment.displayUnit, moment);

  return {
    title: moment.title,
    primary,
    subLabel,
    sinceUntil: formatSinceUntilLabel(moment, now),
    backgroundColor: getBackgroundAccent(moment.backgroundValue, DEFAULT_ACCENT),
    refreshIntervalSeconds: Math.max(1, Math.round(refreshMs / 1000)),
  };
}

export function buildMomentPayload(
  moment: Moment,
  now: Date = new Date(),
): WidgetPayload {
  return {
    configured: true,
    momentId: moment.id,
    snapshot: buildWidgetSnapshot(moment, now),
  };
}

/** iOS WidgetKit decodes a flat JSON object (not nested under `snapshot`). */
export type IosWidgetSnapshotJson = {
  configured: boolean;
  momentId: string | null;
} & WidgetSnapshot;

export function payloadToIosJson(payload: WidgetPayload): string {
  const ios: IosWidgetSnapshotJson = {
    configured: payload.configured,
    momentId: payload.momentId,
    ...payload.snapshot,
  };
  return JSON.stringify(ios);
}
