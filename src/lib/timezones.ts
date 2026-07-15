import { getUtcOffsetMinutes } from './time';

// Minimal fallback for browsers without Intl.supportedValuesOf (pre-2022).
const FALLBACK_ZONES = [
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
  'America/Anchorage',
  'America/Argentina/Buenos_Aires',
  'America/Bogota',
  'America/Chicago',
  'America/Denver',
  'America/Halifax',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/New_York',
  'America/Phoenix',
  'America/Santiago',
  'America/Sao_Paulo',
  'America/Toronto',
  'America/Vancouver',
  'Asia/Bangkok',
  'Asia/Dubai',
  'Asia/Hong_Kong',
  'Asia/Jakarta',
  'Asia/Jerusalem',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Manila',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Brisbane',
  'Australia/Melbourne',
  'Australia/Perth',
  'Australia/Sydney',
  'Europe/Amsterdam',
  'Europe/Athens',
  'Europe/Berlin',
  'Europe/Dublin',
  'Europe/Helsinki',
  'Europe/Istanbul',
  'Europe/Kyiv',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Moscow',
  'Europe/Paris',
  'Europe/Rome',
  'Europe/Stockholm',
  'Europe/Warsaw',
  'Europe/Zurich',
  'Pacific/Auckland',
  'Pacific/Honolulu',
  'UTC',
];

let cachedZones: string[] | null = null;

export function getAllTimeZones(): string[] {
  if (!cachedZones) {
    cachedZones =
      typeof Intl.supportedValuesOf === 'function'
        ? Intl.supportedValuesOf('timeZone')
        : FALLBACK_ZONES;
  }

  return cachedZones;
}

export function getLocalTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Fixed-offset zone ids like "+05:00" / "-09:30" (valid Intl timeZone values). */
export function isOffsetZone(zone: string): boolean {
  return /^[+-]\d{2}:\d{2}$/.test(zone);
}

/** "+05:30" -> "UTC+5:30", "-04:00" -> "UTC-4" */
function offsetZoneLabel(zone: string): string {
  const hours = Number(zone.slice(1, 3));
  const minutes = zone.slice(4, 6);

  return `UTC${zone[0]}${hours}${minutes === '00' ? '' : `:${minutes}`}`;
}

// UTC-12 .. UTC+14, whole hours
const WHOLE_HOUR_OFFSET_ZONES = Array.from({ length: 27 }, (_, i) => {
  const offset = i - 12;

  return `${offset < 0 ? '-' : '+'}${String(Math.abs(offset)).padStart(2, '0')}:00`;
});

/**
 * "utc+5", "gmt -3", "+5:30", "-9" -> a fixed-offset zone id, or null if the
 * query doesn't look like an offset (or is out of the UTC-12..UTC+14 range).
 */
function parseOffsetQuery(query: string): string | null {
  const match = /^(?:utc|gmt)?\s*([+-])\s*(\d{1,2})(?::?(00|15|30|45))?$/.exec(
    query.trim().toLowerCase(),
  );

  if (!match) {
    return null;
  }

  const sign = match[1];
  const hours = Number(match[2]);
  const minutes = match[3] ?? '00';

  if (hours > 14 || (sign === '-' && hours > 12) || (hours === 14 && minutes !== '00')) {
    return null;
  }

  return `${sign}${String(hours).padStart(2, '0')}:${minutes}`;
}

function offsetZoneMinutes(zone: string): number {
  const sign = zone[0] === '-' ? -1 : 1;

  return sign * (Number(zone.slice(1, 3)) * 60 + Number(zone.slice(4, 6)));
}

/** "America/New_York" -> "New York", "+05:30" -> "UTC+5:30" */
export function cityLabel(zone: string): string {
  if (isOffsetZone(zone)) {
    return offsetZoneLabel(zone);
  }

  const city = zone.split('/').pop() ?? zone;

  return city.replace(/_/g, ' ');
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[_/]+/g, ' ');
}

/**
 * Search IANA zones by city or region ("new york", "berlin", "asia"), or
 * fixed offsets ("utc+5", "-3", "+5:30"). An offset query returns the
 * fixed-offset zone first, followed by named zones currently at that offset.
 */
export function searchTimeZones(query: string, limit = 80): string[] {
  const zones = getAllTimeZones();
  const q = normalize(query.trim());

  if (!q) {
    return zones.slice(0, limit);
  }

  const offsetZone = parseOffsetQuery(query);

  if (offsetZone) {
    const now = new Date();
    const target = offsetZoneMinutes(offsetZone);
    const sameOffset = zones.filter((zone) => getUtcOffsetMinutes(now, zone) === target);

    return [offsetZone, ...sameOffset].slice(0, limit);
  }

  if (q === 'utc' || q === 'gmt') {
    return ['UTC', ...WHOLE_HOUR_OFFSET_ZONES];
  }

  const words = q.split(/\s+/);
  const prefixMatches: string[] = [];
  const otherMatches: string[] = [];

  for (const zone of zones) {
    const haystack = normalize(zone);

    if (normalize(cityLabel(zone)).startsWith(q) || haystack.startsWith(q)) {
      prefixMatches.push(zone);
    } else if (words.every((word) => haystack.includes(word))) {
      otherMatches.push(zone);
    }

    if (prefixMatches.length >= limit) {
      break;
    }
  }

  return [...prefixMatches, ...otherMatches].slice(0, limit);
}
