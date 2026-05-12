import { intervalToDuration } from "date-fns";
import type { DisplayUnit, Moment, MomentMode } from "./moment";

/** Past or present target → count up (since); future → countdown (until). */
export function modeFromTargetDate(
  target: Date,
  now: Date = new Date(),
): MomentMode {
  return target.getTime() <= now.getTime() ? "since" : "until";
}

export function parseMomentDate(m: Moment): Date {
  return new Date(m.targetDateTime);
}

/** Signed ms from perspective of target vs now (positive = span to show). Uses live dates, not stored mode. */
export function getMomentDeltaMs(m: Moment, now: Date = new Date()): number {
  const target = parseMomentDate(m);
  if (target.getTime() <= now.getTime()) {
    return now.getTime() - target.getTime();
  }
  return target.getTime() - now.getTime();
}

/** UI label: target in past or now → "Since"; future → "Until". */
export function formatSinceUntilLabel(
  m: Moment,
  now: Date = new Date(),
): string {
  return modeFromTargetDate(parseMomentDate(m), now) === "since"
    ? "Since"
    : "Until";
}

export type FixedDisplayUnit = Exclude<DisplayUnit, "auto">;

export function formatDisplayUnit(ms: number, unit: FixedDisplayUnit): string {
  const abs = Math.abs(ms);
  const sec = abs / 1000;
  const sign = ms < 0 ? "−" : "";
  const n = (v: number) => `${sign}${Math.floor(v).toLocaleString()}`;

  switch (unit) {
    case "seconds":
      return n(sec);
    case "minutes":
      return n(sec / 60);
    case "hours":
      return n(sec / 3600);
    case "days":
      return n(sec / 86400);
    case "weeks":
      return n(sec / (86400 * 7));
    case "months":
      return n(sec / (86400 * 30.4375));
    case "years":
      return n(sec / (86400 * 365.25));
    default: {
      const _exhaustive: never = unit;
      return _exhaustive;
    }
  }
}

export function formatUnitLabel(unit: FixedDisplayUnit): string {
  const labels: Record<FixedDisplayUnit, string> = {
    seconds: "sec",
    minutes: "min",
    hours: "hrs",
    days: "days",
    weeks: "wks",
    months: "mos",
    years: "yrs",
  };
  return labels[unit];
}

export type DurationDisplayVariant = "compact" | "full";
export type DurationRow = { value: string; unit: string };

function unitWord(n: number, singular: string, plural: string): string {
  return `${n.toLocaleString()} ${n === 1 ? singular : plural}`;
}

function orderedDurationParts(m: Moment, now: Date) {
  const target = parseMomentDate(m);
  const start = target <= now ? target : now;
  const end = target <= now ? now : target;
  const totalMs = end.getTime() - start.getTime();
  const d = intervalToDuration({ start, end });
  const years = d.years ?? 0;
  const months = d.months ?? 0;
  const daysTotal = d.days ?? 0;
  const hours = d.hours ?? 0;
  const minutes = d.minutes ?? 0;
  const seconds = d.seconds ?? 0;
  const weeks = Math.floor(daysTotal / 7);
  const remDays = daysTotal % 7;
  return {
    totalMs,
    years,
    months,
    weeks,
    days: remDays,
    hours,
    minutes,
    seconds,
  };
}

/** Calendar-based compound phrase for `displayUnit === 'auto'`. */
export function formatAutoCompoundDuration(
  m: Moment,
  now: Date,
  variant: DurationDisplayVariant,
): string {
  const { totalMs, years, months, weeks, days, hours, minutes, seconds } =
    orderedDurationParts(m, now);

  if (totalMs <= 0) {
    return "0 seconds";
  }

  const maxParts = variant === "compact" ? 3 : 6;

  if (totalMs < 60_000) {
    return unitWord(Math.floor(totalMs / 1000), "second", "seconds");
  }

  if (totalMs < 86_400_000) {
    if (totalMs < 3_600_000) {
      const mins = Math.floor(totalMs / 60_000);
      const secs = Math.floor((totalMs % 60_000) / 1000);
      const parts = [unitWord(mins, "minute", "minutes")];
      if (secs > 0) parts.push(unitWord(secs, "second", "seconds"));
      return parts.join(" ");
    }
    const hrs = Math.floor(totalMs / 3_600_000);
    const mins = Math.floor((totalMs % 3_600_000) / 60_000);
    const parts = [unitWord(hrs, "hour", "hours")];
    if (mins > 0) parts.push(unitWord(mins, "minute", "minutes"));
    return parts.join(" ");
  }

  const pieces: string[] = [];
  if (years > 0) pieces.push(unitWord(years, "year", "years"));
  if (months > 0) pieces.push(unitWord(months, "month", "months"));
  if (weeks > 0) pieces.push(unitWord(weeks, "week", "weeks"));
  if (days > 0) pieces.push(unitWord(days, "day", "days"));
  if (hours > 0) pieces.push(unitWord(hours, "hour", "hours"));
  if (minutes > 0) pieces.push(unitWord(minutes, "minute", "minutes"));

  if (seconds > 0 && totalMs < 7 * 86_400_000) {
    pieces.push(unitWord(seconds, "second", "seconds"));
  }

  if (pieces.length === 0) {
    return unitWord(Math.floor(totalMs / 1000), "second", "seconds");
  }

  return pieces.slice(0, maxParts).join(" ");
}

export function formatDurationRows(m: Moment, now: Date = new Date()): DurationRow[] {
  const { years, months, weeks, days, hours, minutes, seconds } =
    orderedDurationParts(m, now);
  const rows: DurationRow[] = [];
  if (years > 0) rows.push({ value: years.toLocaleString(), unit: "Years" });
  if (months > 0) rows.push({ value: months.toLocaleString(), unit: "Months" });
  if (weeks > 0) rows.push({ value: weeks.toLocaleString(), unit: "Weeks" });
  if (days > 0) rows.push({ value: days.toLocaleString(), unit: "Days" });
  if (hours > 0) rows.push({ value: hours.toLocaleString(), unit: "Hours" });
  if (minutes > 0) rows.push({ value: minutes.toLocaleString(), unit: "Minutes" });
  if (seconds > 0) rows.push({ value: seconds.toLocaleString(), unit: "Seconds" });
  return rows;
}

/** Primary line for list/detail: compound words when auto, else numeric value only. */
export function formatMomentPrimaryDisplay(
  m: Moment,
  now: Date,
  variant: DurationDisplayVariant,
): string {
  if (m.displayUnit === "auto") {
    return formatAutoCompoundDuration(m, now, variant);
  }
  return formatDisplayUnit(getMomentDeltaMs(m, now), m.displayUnit);
}

/** Short label for fixed units; `null` when automatic (label is embedded in primary). */
export function formatMomentUnitLabel(m: Moment): string | null {
  if (m.displayUnit === "auto") return null;
  return formatUnitLabel(m.displayUnit);
}

/** Next fire time for live ticker based on display unit */
export function getTickerIntervalMs(
  unit: DisplayUnit,
  moment?: Moment,
): number {
  if (unit === "auto" && moment) {
    const now = new Date();
    const target = parseMomentDate(moment);
    const start = target <= now ? target : now;
    const end = target <= now ? now : target;
    const totalMs = end.getTime() - start.getTime();
    if (totalMs < 60_000) return 250;
    if (totalMs < 3_600_000) return 1000;
    if (totalMs < 86_400_000) return 5000;
    return 60_000;
  }

  switch (unit) {
    case "auto":
      return 1000;
    case "seconds":
      return 250;
    case "minutes":
      return 1000;
    case "hours":
      return 5000;
    case "days":
    case "weeks":
    case "months":
    case "years":
      return 60_000;
    default: {
      const _exhaustive: never = unit;
      return _exhaustive;
    }
  }
}
