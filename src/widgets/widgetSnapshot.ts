import type { Moment } from "@/features/moments/domain/moment";
import {
  formatDisplayUnit,
  formatDurationRows,
  formatSinceUntilLabel,
  getMomentDeltaMs,
} from "@/features/moments/domain/momentFormatters";

import { WIDGET_PLACEHOLDER_HINT_ANDROID } from "./widgetConstants";

const PLACEHOLDER_BG = "#1C2127";

export type WidgetSnapshot = {
  title: string;
  primary: string;
  primaryUnit: string;
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
  title: "Moment Tracker",
  primary: "",
  primaryUnit: "",
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

const FIXED_UNIT_LABELS: Record<string, string> = {
  seconds: "Seconds",
  minutes: "Minutes",
  hours: "Hours",
  days: "Days",
  weeks: "Weeks",
  months: "Months",
  years: "Years",
};

function widgetRefreshSeconds(moment: Moment, now: Date): number {
  const isAuto = moment.displayUnit === "auto";
  if (isAuto) {
    const target = new Date(moment.targetDateTime);
    const totalMs = Math.abs(now.getTime() - target.getTime());
    if (totalMs < 3_600_000) return 60;      // showing minutes → refresh every minute
    if (totalMs < 86_400_000) return 300;    // showing hours → every 5 min
    return 900;                               // showing days+ → every 15 min
  }
  switch (moment.displayUnit) {
    case "seconds":
    case "minutes": return 60;
    case "hours": return 300;
    default: return 900;
  }
}

export function buildWidgetSnapshot(
  moment: Moment,
  now: Date = new Date(),
): WidgetSnapshot {
  const isAuto = moment.displayUnit === "auto";

  let primary: string;
  let primaryUnit: string;
  let subLabel: string;

  if (isAuto) {
    const rows = formatDurationRows(moment, now);
    if (rows.length === 0) {
      primary = "0";
      primaryUnit = "Minutes";
      subLabel = "";
    } else {
      primary = rows[0].value;
      primaryUnit = rows[0].unit;
      subLabel = rows
        .slice(1, 3)
        .map((r) => `${r.value} ${r.unit.toLowerCase()}`)
        .join(", ");
    }
  } else {
    primary = formatDisplayUnit(getMomentDeltaMs(moment, now), moment.displayUnit);
    primaryUnit = FIXED_UNIT_LABELS[moment.displayUnit] ?? "";
    subLabel = "";
  }

  return {
    title: moment.title,
    primary,
    primaryUnit,
    subLabel,
    sinceUntil: formatSinceUntilLabel(moment, now),
    backgroundColor: moment.accentColor,
    refreshIntervalSeconds: widgetRefreshSeconds(moment, now),
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
