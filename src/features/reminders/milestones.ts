import { addDays, addYears } from "date-fns";
import type { Moment } from "../moments/domain/moment";

/** A single upcoming milestone occurrence for a moment. */
export type Milestone = {
  date: Date;
  /** Human label, e.g. "100 days" or "2 years". */
  label: string;
};

/**
 * Round-number day counts worth celebrating. Yearly anniversaries are
 * generated separately (calendar years, not 365-day multiples), so day
 * milestones stop where anniversaries take over as the interesting beats.
 */
const DAY_MILESTONES = [7, 30, 50, 100, 180, 200, 250, 500, 750, 1000, 2000, 2500, 5000, 10000];

/** How many yearly anniversaries to generate past the last future one needed. */
const MAX_ANNIVERSARY_YEARS = 100;

/**
 * Milestones for a moment, anchored to its target date and time-of-day.
 * Only occurrences strictly after `now` are returned, soonest first.
 * Works for both modes: a "since" moment celebrates elapsed time, and an
 * "until" moment starts producing milestones once its date has passed.
 */
export function upcomingMilestones(
  moment: Moment,
  now: Date = new Date(),
  limit = 4,
): Milestone[] {
  const target = new Date(moment.targetDateTime);
  if (Number.isNaN(target.getTime())) return [];

  const out: Milestone[] = [];

  for (const days of DAY_MILESTONES) {
    const date = addDays(target, days);
    if (date.getTime() > now.getTime()) {
      out.push({ date, label: `${days} days` });
    }
  }

  for (let years = 1; years <= MAX_ANNIVERSARY_YEARS; years++) {
    const date = addYears(target, years);
    if (date.getTime() > now.getTime()) {
      out.push({ date, label: years === 1 ? "1 year" : `${years} years` });
      if (out.length >= limit + DAY_MILESTONES.length) break;
    }
  }

  out.sort((a, b) => a.date.getTime() - b.date.getTime());
  return out.slice(0, limit);
}

/** Notification body for a milestone, honoring the user's custom message. */
export function milestoneNotificationBody(
  milestone: Milestone,
  message: string | undefined,
): string {
  const custom = message?.trim();
  return custom
    ? `🎉 ${milestone.label} — ${custom}`
    : `🎉 ${milestone.label} today!`;
}
