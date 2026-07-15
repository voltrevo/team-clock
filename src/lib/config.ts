import { TeamMember } from '../types';

const STORAGE_KEY = 'team';

export const defaultTeam: TeamMember[] = [
  { name: 'Alice', timezone: 'America/New_York', workHours: ['0900', '1700'] },
  { name: 'Bob', timezone: 'Europe/Berlin', workHours: ['0800', '1600'] },
  { name: 'Charlie', timezone: 'Asia/Tokyo', workHours: ['1000', '1800'] },
  { name: 'Dave', timezone: 'America/Sao_Paulo', workHours: ['0700', '1500'] },
  { name: 'Eve', timezone: 'Europe/Athens', workHours: ['0900', '1700'] },
];

function isValidTimeZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

const WORK_HOURS_PATTERN = /^([01]\d|2[0-3])[0-5]\d$/;

export function isValidTeam(value: unknown): value is TeamMember[] {
  if (!Array.isArray(value) || value.length > 100) {
    return false;
  }

  return value.every((member) => {
    if (typeof member !== 'object' || member === null) {
      return false;
    }

    const { name, timezone, workHours } = member as Record<string, unknown>;

    return (
      typeof name === 'string' &&
      typeof timezone === 'string' &&
      isValidTimeZone(timezone) &&
      Array.isArray(workHours) &&
      workHours.length === 2 &&
      workHours.every(
        (hours) => typeof hours === 'string' && WORK_HOURS_PATTERN.test(hours),
      )
    );
  });
}

export function saveTeam(team: TeamMember[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(team, null, 2));
}

/**
 * Load the team: a `#team=...` share link wins (and is adopted into
 * localStorage), then localStorage, then the default sample team.
 */
export function loadTeam(): TeamMember[] {
  const shared = readTeamFromUrl();

  if (shared) {
    saveTeam(shared);
    history.replaceState(null, '', location.pathname + location.search);
    return shared;
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed: unknown = JSON.parse(saved);

      if (isValidTeam(parsed)) {
        return parsed;
      }
    }
  } catch {
    // fall through to default
  }

  return defaultTeam;
}

export function makeShareUrl(team: TeamMember[]): string {
  const url = new URL(location.href);
  url.hash = `team=${base64UrlEncode(JSON.stringify(team))}`;

  return url.toString();
}

function readTeamFromUrl(): TeamMember[] | null {
  const match = /[#&]team=([A-Za-z0-9_-]+)/.exec(location.hash);

  if (!match) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(base64UrlDecode(match[1]));

    return isValidTeam(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function base64UrlEncode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(encoded: string): string {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new TextDecoder().decode(bytes);
}
