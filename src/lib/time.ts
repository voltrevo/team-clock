export interface ZonedTime {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number; // 0 = Sunday
}

export const MINUTES_PER_DAY = 24 * 60;

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function weekdayName(weekday: number, style: 'short' | 'long' = 'short'): string {
  return (style === 'short' ? WEEKDAY_SHORT : WEEKDAY_LONG)[weekday] ?? '';
}

const partsFormatters = new Map<string, Intl.DateTimeFormat>();

function getPartsFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = partsFormatters.get(timeZone);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
    });

    partsFormatters.set(timeZone, formatter);
  }

  return formatter;
}

export function getZonedTime(date: Date, timeZone: string): ZonedTime {
  const parts = getPartsFormatter(timeZone).formatToParts(date);
  const lookup: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};

  for (const part of parts) {
    lookup[part.type] = part.value;
  }

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour) % 24,
    minute: Number(lookup.minute),
    second: Number(lookup.second),
    weekday: WEEKDAY_SHORT.indexOf(lookup.weekday ?? ''),
  };
}

/** UTC offset of `timeZone` at `date`, in minutes (UTC+2 -> 120). */
export function getUtcOffsetMinutes(date: Date, timeZone: string): number {
  const z = getZonedTime(date, timeZone);
  const asUtc = Date.UTC(z.year, z.month - 1, z.day, z.hour, z.minute, z.second);
  const wholeSeconds = date.getTime() - date.getMilliseconds();

  return Math.round((asUtc - wholeSeconds) / 60_000);
}

/** "UTC+2", "UTC+5:30", "UTC", "UTC-9:30" */
export function formatUtcOffset(offsetMinutes: number): string {
  if (offsetMinutes === 0) {
    return 'UTC';
  }

  const sign = offsetMinutes < 0 ? '-' : '+';
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;

  return `UTC${sign}${hours}${minutes === 0 ? '' : `:${String(minutes).padStart(2, '0')}`}`;
}

/** Offset relative to the viewer: "+6h", "-2h", "+5:30", "same time" */
export function formatRelativeOffset(deltaMinutes: number): string {
  if (deltaMinutes === 0) {
    return 'same time';
  }

  const sign = deltaMinutes < 0 ? '-' : '+';
  const abs = Math.abs(deltaMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;

  if (minutes === 0) {
    return `${sign}${hours}h`;
  }

  return `${sign}${hours}:${String(minutes).padStart(2, '0')}`;
}

/** "0900" or "09:00" -> minutes since midnight */
export function parseHHMM(value: string): number {
  const digits = value.replace(':', '');

  return Number(digits.slice(0, 2)) * 60 + Number(digits.slice(2, 4));
}

/** minutes since midnight -> "09:00" (for display and <input type="time">) */
export function formatHHMM(minutesSinceMidnight: number): string {
  const hours = Math.floor(minutesSinceMidnight / 60) % 24;
  const minutes = minutesSinceMidnight % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

const timeFormatters = new Map<string, Intl.DateTimeFormat>();

/** Member's current wall-clock time, formatted for the viewer's locale. */
export function formatTimeInZone(date: Date, timeZone: string, withSeconds = false): string {
  const key = `${timeZone}|${withSeconds ? 's' : 'm'}`;
  let formatter = timeFormatters.get(key);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(undefined, {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      ...(withSeconds ? { second: '2-digit' } : {}),
    });

    timeFormatters.set(key, formatter);
  }

  return formatter.format(date);
}

/** Minutes (fractional) into the viewer's local day. */
export function minutesIntoDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

/** Calendar-day difference between a zoned time and the viewer's local date (-1, 0 or +1). */
export function getDayDiff(zoned: ZonedTime, viewerDate: Date): number {
  const memberDay = Date.UTC(zoned.year, zoned.month - 1, zoned.day);
  const viewerDay = Date.UTC(
    viewerDate.getFullYear(),
    viewerDate.getMonth(),
    viewerDate.getDate(),
  );

  return Math.round((memberDay - viewerDay) / 86_400_000);
}

export type MemberStatus = 'working' | 'early' | 'late' | 'off' | 'weekend';

export const STATUS_LABELS: Record<MemberStatus, string> = {
  working: 'Working',
  early: 'Early',
  late: 'Late',
  off: 'Off hours',
  weekend: 'Weekend',
};

const SHOULDER_MINUTES = 120;

export function getMemberStatus(zoned: ZonedTime, workHours: [string, string]): MemberStatus {
  if (zoned.weekday === 0 || zoned.weekday === 6) {
    return 'weekend';
  }

  const now = zoned.hour * 60 + zoned.minute;
  const start = parseHHMM(workHours[0]);
  const end = parseHHMM(workHours[1]);

  if (now >= start && now < end) {
    return 'working';
  }

  if (now >= start - SHOULDER_MINUTES && now < start) {
    return 'early';
  }

  if (now >= end && now < end + SHOULDER_MINUTES) {
    return 'late';
  }

  return 'off';
}
