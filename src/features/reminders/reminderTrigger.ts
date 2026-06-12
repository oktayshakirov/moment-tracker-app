import {
  addYears,
  format,
  subDays,
  subHours,
  subMinutes,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import type { Moment, Reminder, ReminderOffsetUnit } from "../moments/domain/moment";

/** Platform-agnostic description of when a reminder should fire. */
export type ReminderTrigger =
  | { type: "date"; date: Date }
  | { type: "interval"; seconds: number; repeats: true }
  | { type: "daily"; hour: number; minute: number }
  | { type: "weekly"; weekday: number; hour: number; minute: number }
  | { type: "monthly"; day: number; hour: number; minute: number };

function subtractOffset(
  date: Date,
  value: number,
  unit: ReminderOffsetUnit,
): Date {
  switch (unit) {
    case "minutes":
      return subMinutes(date, value);
    case "hours":
      return subHours(date, value);
    case "days":
      return subDays(date, value);
    case "weeks":
      return subWeeks(date, value);
    case "months":
      return subMonths(date, value);
    case "years":
      return subYears(date, value);
  }
}

/**
 * For a "since"/anniversary moment, find the next yearly recurrence of the
 * target date that is still in the future relative to `from`.
 */
function nextAnniversary(target: Date, from: Date): Date {
  let next = new Date(target.getTime());
  next.setFullYear(from.getFullYear());
  while (next.getTime() <= from.getTime()) {
    next = addYears(next, 1);
  }
  return next;
}

/**
 * Compute the trigger for a moment's reminder, or null if it can't be
 * scheduled (e.g. a one-time "before" alert whose time has already passed).
 */
export function computeReminderTrigger(
  moment: Moment,
  reminder: Reminder,
  now: Date = new Date(),
): ReminderTrigger | null {
  const target = new Date(moment.targetDateTime);

  if (reminder.kind === "before") {
    const isFuture = target.getTime() > now.getTime();
    if (isFuture) {
      const fire = subtractOffset(target, reminder.value, reminder.unit);
      return fire.getTime() > now.getTime() ? { type: "date", date: fire } : null;
    }
    // Past target → anniversary. Roll forward until the offset lands ahead.
    let anniversary = nextAnniversary(target, now);
    for (let i = 0; i < 2; i++) {
      const fire = subtractOffset(anniversary, reminder.value, reminder.unit);
      if (fire.getTime() > now.getTime()) return { type: "date", date: fire };
      anniversary = addYears(anniversary, 1);
    }
    return null;
  }

  // Repeating, anchored to the moment's time-of-day.
  const hour = target.getHours();
  const minute = target.getMinutes();
  switch (reminder.interval) {
    case "hour":
      return { type: "interval", seconds: 3600, repeats: true };
    case "day":
      return { type: "daily", hour, minute };
    case "week":
      // expo calendar weekday: 1 = Sunday … 7 = Saturday.
      return { type: "weekly", weekday: target.getDay() + 1, hour, minute };
    case "month":
      return { type: "monthly", day: target.getDate(), hour, minute };
  }
}

/**
 * Full sentence explaining exactly when/how the reminder fires, for the form.
 * Returns null if a one-time reminder can't be scheduled (time already passed).
 */
export function describeReminderSchedule(
  moment: Moment,
  reminder: Reminder,
  now: Date = new Date(),
): string | null {
  const trigger = computeReminderTrigger(moment, reminder, now);
  if (!trigger) return null;
  const stamp = (d: Date) => format(d, "PPPp");

  if (trigger.type === "date") {
    return `You'll get a notification on ${stamp(trigger.date)}.`;
  }

  const interval = (reminder as Extract<Reminder, { kind: "repeat" }>).interval;
  return `This will notify you every ${interval} after ${stamp(
    new Date(moment.targetDateTime),
  )}. This alert will repeat until you delete it.`;
}

/** Short human summary for UI, e.g. "1 week before" or "Every day". */
export function describeReminder(reminder: Reminder): string {
  if (reminder.kind === "before") {
    const unit =
      reminder.value === 1 ? reminder.unit.replace(/s$/, "") : reminder.unit;
    return `${reminder.value} ${unit} before`;
  }
  const label =
    reminder.interval === "hour"
      ? "hour"
      : reminder.interval === "day"
        ? "day"
        : reminder.interval === "week"
          ? "week"
          : "month";
  return `Every ${label}`;
}
