import React from 'react';
import { TeamMember } from '../types';
import {
  MINUTES_PER_DAY,
  MemberStatus,
  formatHHMM,
  formatRelativeOffset,
  formatTimeInZone,
  getDayDiff,
  getMemberStatus,
  getUtcOffsetMinutes,
  getZonedTime,
  minutesIntoDay,
  parseHHMM,
} from '../lib/time';
import { cityLabel } from '../lib/timezones';
import StatusBadge from './StatusBadge';

interface Segment {
  start: number; // minutes into the viewer's local day
  end: number;
}

interface Row {
  member: TeamMember;
  delta: number; // member's offset relative to the viewer, minutes
  segments: Segment[];
  status: MemberStatus;
  timeText: string;
  dayDiff: number;
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** A member's work-hours band, mapped into the viewer's local day (may wrap midnight). */
function bandSegments(startMinute: number, endMinute: number, delta: number): Segment[] {
  if (endMinute <= startMinute) {
    return [];
  }

  const start = mod(startMinute - delta, MINUTES_PER_DAY);
  const end = mod(endMinute - delta, MINUTES_PER_DAY);

  if (start < end) {
    return [{ start, end }];
  }

  return [
    { start, end: MINUTES_PER_DAY },
    { start: 0, end },
  ];
}

/** Contiguous runs of minutes where at least `threshold` members are within work hours. */
function runsAtLeast(counts: number[], threshold: number): Segment[] {
  const segments: Segment[] = [];
  let runStart = -1;

  for (let minute = 0; minute <= counts.length; minute++) {
    const active = minute < counts.length && counts[minute] >= threshold;

    if (active && runStart === -1) {
      runStart = minute;
    } else if (!active && runStart !== -1) {
      segments.push({ start: runStart, end: minute });
      runStart = -1;
    }
  }

  return segments;
}

function computeOverlap(rows: Row[]): { all: Segment[]; some: Segment[] } {
  const counts = new Array<number>(MINUTES_PER_DAY).fill(0);

  for (const row of rows) {
    for (const segment of row.segments) {
      for (let minute = segment.start; minute < segment.end; minute++) {
        counts[minute]++;
      }
    }
  }

  const all = runsAtLeast(counts, rows.length);
  const someThreshold = Math.max(2, Math.ceil(rows.length / 2));
  const some = someThreshold < rows.length ? runsAtLeast(counts, someThreshold) : [];

  return { all, some };
}

function toPercent(minute: number): string {
  return `${(minute / MINUTES_PER_DAY) * 100}%`;
}

const hourFormatter = new Intl.DateTimeFormat(undefined, { hour: 'numeric' });

function hourLabel(hour: number): string {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);

  return hourFormatter.format(date);
}

const AXIS_HOURS = [0, 3, 6, 9, 12, 15, 18, 21];

interface Props {
  team: TeamMember[];
  time: Date;
}

const Timeline: React.FC<Props> = ({ team, time }) => {
  const viewerOffset = -time.getTimezoneOffset();

  const rows: Row[] = team.map((member) => {
    const offset = getUtcOffsetMinutes(time, member.timezone);
    const delta = offset - viewerOffset;
    const zoned = getZonedTime(time, member.timezone);

    return {
      member,
      delta,
      segments: bandSegments(parseHHMM(member.workHours[0]), parseHHMM(member.workHours[1]), delta),
      status: getMemberStatus(zoned, member.workHours),
      timeText: formatTimeInZone(time, member.timezone),
      dayDiff: getDayDiff(zoned, time),
    };
  });

  rows.sort((a, b) => a.delta - b.delta || a.member.name.localeCompare(b.member.name));

  const overlap = rows.length >= 2 ? computeOverlap(rows) : { all: [], some: [] };
  const nowLeft = toPercent(minutesIntoDay(time));

  const renderOverlays = () => (
    <>
      {overlap.some.map((segment) => (
        <div
          key={`some-${segment.start}`}
          className="overlap-band overlap-band--some"
          style={{ left: toPercent(segment.start), width: toPercent(segment.end - segment.start) }}
        />
      ))}
      {overlap.all.map((segment) => (
        <div
          key={`all-${segment.start}`}
          className="overlap-band overlap-band--all"
          style={{ left: toPercent(segment.start), width: toPercent(segment.end - segment.start) }}
        />
      ))}
    </>
  );

  return (
    <div className="timeline">
      <div className="timeline-row timeline-row--axis" aria-hidden="true">
        <div className="timeline-label" />
        <div className="timeline-axis">
          {AXIS_HOURS.map((hour) => (
            <span
              key={hour}
              className={`timeline-tick${hour % 6 === 0 ? '' : ' timeline-tick--minor'}`}
              style={{ left: toPercent(hour * 60) }}
            >
              {hourLabel(hour)}
            </span>
          ))}
        </div>
        <div className="timeline-meta" />
      </div>

      {rows.map((row, index) => {
        const workHoursText = `${row.member.name || 'Unnamed'} works ${formatHHMM(
          parseHHMM(row.member.workHours[0]),
        )}–${formatHHMM(parseHHMM(row.member.workHours[1]))} local time`;

        return (
          <div className="timeline-row" data-status={row.status} key={index}>
            <div className="timeline-label">
              <span className="member-name">{row.member.name || 'Unnamed'}</span>
              <span className="member-zone">
                {cityLabel(row.member.timezone)} &middot; {formatRelativeOffset(row.delta)}
              </span>
            </div>
            <div className="timeline-track">
              {renderOverlays()}
              {row.segments.map((segment) => (
                <div
                  key={segment.start}
                  className="work-band"
                  title={workHoursText}
                  style={{
                    left: toPercent(segment.start),
                    width: toPercent(segment.end - segment.start),
                  }}
                />
              ))}
              <div className="now-line" style={{ left: nowLeft }} />
            </div>
            <div className="timeline-meta">
              <span className="member-time">
                {row.timeText}
                {row.dayDiff !== 0 && (
                  <span className="day-diff">{row.dayDiff > 0 ? '+1d' : '-1d'}</span>
                )}
              </span>
              <StatusBadge status={row.status} />
            </div>
          </div>
        );
      })}

      {rows.length >= 2 && (
        <div className="timeline-legend">
          <span className="legend-item">
            <span className="legend-swatch legend-swatch--band" /> working hours
          </span>
          {overlap.some.length > 0 && (
            <span className="legend-item">
              <span className="legend-swatch legend-swatch--some" /> half the team
            </span>
          )}
          <span className="legend-item">
            <span className="legend-swatch legend-swatch--all" /> everyone overlaps
          </span>
          <span className="legend-item">
            <span className="legend-swatch legend-swatch--now" /> now
          </span>
        </div>
      )}
    </div>
  );
};

export default Timeline;
