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

/** "America/New_York" -> "New York" */
export function cityLabel(zone: string): string {
  const city = zone.split('/').pop() ?? zone;

  return city.replace(/_/g, ' ');
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[_/]+/g, ' ');
}

/**
 * Search IANA zones by city or region ("new york", "berlin", "asia").
 * Prefix matches on the city rank first.
 */
export function searchTimeZones(query: string, limit = 80): string[] {
  const zones = getAllTimeZones();
  const q = normalize(query.trim());

  if (!q) {
    return zones.slice(0, limit);
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
