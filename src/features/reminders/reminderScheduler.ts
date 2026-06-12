import type * as ExpoNotifications from "expo-notifications";
import type { Moment } from "../moments/domain/moment";
import type { MomentRepository } from "../moments/data/momentRepository";
import {
  configureNotifications,
  getNotificationsModule,
} from "./notifications";
import { computeReminderTrigger, type ReminderTrigger } from "./reminderTrigger";
import {
  clearScheduledId,
  getScheduledId,
  setScheduledId,
} from "./reminderStore";

type NotificationsModule = NonNullable<
  Awaited<ReturnType<typeof getNotificationsModule>>
>;

function toTriggerInput(
  Notifications: NotificationsModule,
  trigger: ReminderTrigger,
): ExpoNotifications.NotificationTriggerInput {
  const T = Notifications.SchedulableTriggerInputTypes;
  switch (trigger.type) {
    case "date":
      return { type: T.DATE, date: trigger.date };
    case "interval":
      return {
        type: T.TIME_INTERVAL,
        seconds: trigger.seconds,
        repeats: trigger.repeats,
      };
    case "daily":
      return { type: T.DAILY, hour: trigger.hour, minute: trigger.minute };
    case "weekly":
      return {
        type: T.WEEKLY,
        weekday: trigger.weekday,
        hour: trigger.hour,
        minute: trigger.minute,
      };
    case "monthly":
      return {
        type: T.MONTHLY,
        day: trigger.day,
        hour: trigger.hour,
        minute: trigger.minute,
      };
    case "yearly":
      return {
        type: T.YEARLY,
        month: trigger.month,
        day: trigger.day,
        hour: trigger.hour,
        minute: trigger.minute,
      };
  }
}

/** Cancel whatever notification is currently scheduled for a moment. */
export async function cancelMomentReminder(momentId: string): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;
  const existing = await getScheduledId(momentId);
  if (existing) {
    try {
      await Notifications.cancelScheduledNotificationAsync(existing);
    } catch {
      // Already gone — ignore.
    }
    await clearScheduledId(momentId);
  }
}

/**
 * Reconcile the OS-scheduled notification with the moment's current reminder
 * config. Cancels any stale one and schedules a fresh one when applicable.
 */
export async function syncMomentReminder(moment: Moment): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;
  await configureNotifications();

  // Start clean so edits to the date/offset always reschedule correctly.
  await cancelMomentReminder(moment.id);

  if (!moment.reminder) return;

  const trigger = computeReminderTrigger(moment, moment.reminder);
  if (!trigger) return;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: moment.title,
        body: moment.reminder.message?.trim() || moment.title,
      },
      trigger: toTriggerInput(Notifications, trigger),
    });
    await setScheduledId(moment.id, id);
  } catch {
    // Scheduling failed (permission revoked, etc.) — leave unscheduled.
  }
}

/** Reschedule every moment's reminder. Run on app boot to roll anniversaries. */
export async function syncAllReminders(
  moments: MomentRepository,
): Promise<void> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;
  await configureNotifications();
  const all = await moments.listAll();
  for (const m of all) {
    await syncMomentReminder(m);
  }
}
