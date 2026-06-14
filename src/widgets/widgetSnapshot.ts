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
  /** iOS: filename of the widget image inside the App Group container. */
  backgroundImageName: string | null;
  /** Android: absolute file:// URI of the downscaled widget image. */
  backgroundImageUri: string | null;
  /** Android: width/height of the widget image, for aspect-correct cover cropping. */
  backgroundImageAspect: number | null;
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
  backgroundImageName: null,
  backgroundImageUri: null,
  backgroundImageAspect: null,
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
  // Widgets refresh at most about once a minute, so seconds would always look
  // stale. Minutes is the smallest unit shown; seconds stay in the app only.
  const effectiveUnit =
    moment.displayUnit === "seconds" ? "minutes" : moment.displayUnit;
  const isAuto = effectiveUnit === "auto";

  let primary: string;
  let primaryUnit: string;
  let subLabel: string;

  if (isAuto) {
    const rows = formatDurationRows(moment, now).filter(
      (r) => r.unit !== "Seconds",
    );
    if (rows.length === 0) {
      primary = "1";
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
    const raw = formatDisplayUnit(getMomentDeltaMs(moment, now), effectiveUnit);
    // Never show "0 minutes" — round up to a meaningful "1".
    primary = effectiveUnit === "minutes" && raw === "0" ? "1" : raw;
    primaryUnit = FIXED_UNIT_LABELS[effectiveUnit] ?? "";
    subLabel = "";
  }

  return {
    title: moment.title,
    primary,
    primaryUnit,
    subLabel,
    sinceUntil: formatSinceUntilLabel(moment, now),
    backgroundColor: moment.accentColor,
    backgroundImageName: null,
    backgroundImageUri: null,
    backgroundImageAspect: null,
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
