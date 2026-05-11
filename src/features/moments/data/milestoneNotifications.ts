import * as Notifications from 'expo-notifications';
import { addDays, addYears, isAfter, parseISO } from 'date-fns';
import { Platform } from 'react-native';
import type { Moment } from '../domain/moment';
import { modeFromTargetDate } from '../domain/momentFormatters';

const PREFIX = 'milestone-';

let channelReady = false;

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android' || channelReady) return;
  await Notifications.setNotificationChannelAsync('moments', {
    name: 'Moments',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  channelReady = true;
}

/** Day offsets from the start instant (since mode) for milestone alerts */
const DAY_MILESTONES = [7, 30, 100, 365, 500, 1000];

export async function ensureNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleMilestonesForMoment(moment: Moment): Promise<void> {
  await ensureAndroidChannel();
  const granted = await ensureNotificationPermission();
  if (!granted) return;

  await cancelMilestoneNotifications(moment.id);

  if (modeFromTargetDate(parseISO(moment.targetDateTime)) !== 'since') return;

  const start = parseISO(moment.targetDateTime);
  const now = new Date();

  for (const days of DAY_MILESTONES) {
    const fire = addDays(start, days);
    if (!isAfter(fire, now)) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: `${PREFIX}${moment.id}-d${days}`,
      content: {
        title: 'Milestone reached',
        body: `${days} days since ${moment.title}`,
        data: { momentId: moment.id, kind: 'milestone', days },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fire,
        ...(Platform.OS === 'android' ? { channelId: 'moments' } : {}),
      },
    });
  }

  const y1 = addYears(start, 1);
  if (isAfter(y1, now)) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${PREFIX}${moment.id}-y1`,
      content: {
        title: 'One year',
        body: `A year since ${moment.title}`,
        data: { momentId: moment.id, kind: 'milestone', years: 1 },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: y1,
        ...(Platform.OS === 'android' ? { channelId: 'moments' } : {}),
      },
    });
  }
}

export async function cancelMilestoneNotifications(momentId: string): Promise<void> {
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  for (const p of pending) {
    const id = p.identifier;
    if (id.startsWith(`${PREFIX}${momentId}`)) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
  }
}
