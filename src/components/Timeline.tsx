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

// --- meeting-score graph: everyone's work hours summed, gaussian-blurred ---

const SAMPLE_STEP = 5; // minutes per sample
const SAMPLE_COUNT = MINUTES_PER_DAY / SAMPLE_STEP;
const BLUR_SIGMA = 120 / SAMPLE_STEP; // 2 hours
const BLUR_RADIUS = Math.round(3 * BLUR_SIGMA);

const KERNEL = (() => {
  const weights: number[] = [];
  let sum = 0;

  for (let i = -BLUR_RADIUS; i <= BLUR_RADIUS; i++) {
    const w = Math.exp(-(i * i) / (2 * BLUR_SIGMA * BLUR_SIGMA));
    weights.push(w);
    sum += w;
  }

  return weights.map((w) => w / sum);
})();

/** Blurred fraction of the team working at each sample of the viewer's day (0..1). */
function meetingScores(rows: Row[]): number[] {
  const counts = new Array<number>(SAMPLE_COUNT).fill(0);

  for (const row of rows) {
    for (const segment of row.segments) {
      const from = Math.ceil(segment.start / SAMPLE_STEP);
      const to = Math.ceil(segment.end / SAMPLE_STEP);

      for (let s = from; s < to; s++) {
        counts[s]++;
      }
    }
  }

  const scores = new Array<number>(SAMPLE_COUNT).fill(0);

  for (let i = 0; i < SAMPLE_COUNT; i++) {
    let acc = 0;

    for (let k = 0; k < KERNEL.length; k++) {
      acc += counts[(i + k - BLUR_RADIUS + SAMPLE_COUNT) % SAMPLE_COUNT] * KERNEL[k];
    }

    scores[i] = acc / rows.length;
  }

  return scores;
}

/** Middle of the widest plateau of maximum score (the day wraps, but ties are rare). */
function peakSample(scores: number[]): number {
  const max = Math.max(...scores);
  const eps = 1e-9;
  let bestStart = 0;
  let bestLength = 0;
  let runStart = -1;

  for (let i = 0; i <= scores.length; i++) {
    const atMax = i < scores.length && scores[i] >= max - eps;

    if (atMax && runStart === -1) {
      runStart = i;
    } else if (!atMax && runStart !== -1) {
      if (i - runStart > bestLength) {
        bestLength = i - runStart;
        bestStart = runStart;
      }

      runStart = -1;
    }
  }

  return bestStart + Math.floor(bestLength / 2);
}

const GRAPH_HEIGHT = 100;
const GRAPH_PAD = 8;

function graphY(value: number): number {
  return GRAPH_HEIGHT - GRAPH_PAD - value * (GRAPH_HEIGHT - 2 * GRAPH_PAD);
}

const timeShortFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

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

  const scores = rows.length >= 2 ? meetingScores(rows) : null;
  let graphRow: React.ReactNode = null;

  if (scores) {
    const peak = peakSample(scores);
    const peakMinutes = peak * SAMPLE_STEP;
    const peakDate = new Date(time);
    peakDate.setHours(Math.floor(peakMinutes / 60), peakMinutes % 60, 0, 0);
    const peakLabel = timeShortFormatter.format(peakDate);

    const linePath = scores
      .map((v, i) => `${i === 0 ? 'M' : 'L'}${i},${graphY(v).toFixed(2)}`)
      .join('');
    const areaPath = `${linePath}L${SAMPLE_COUNT},${graphY(scores[0]).toFixed(2)}L${SAMPLE_COUNT},${GRAPH_HEIGHT}L0,${GRAPH_HEIGHT}Z`;

    graphRow = (
      <div className="timeline-row timeline-row--graph">
        <div className="timeline-label">
          <span className="member-name">Meeting score</span>
          <span className="member-zone">±2h blurred sum</span>
        </div>
        <div
          className="timeline-graph"
          title="Sum of everyone's working hours with a 2-hour gaussian blur — peaks are the best compromise for meetings"
        >
          <svg viewBox={`0 0 ${SAMPLE_COUNT} ${GRAPH_HEIGHT}`} preserveAspectRatio="none">
            <path className="graph-area" d={areaPath} />
            <path
              className="graph-line"
              d={`${linePath}L${SAMPLE_COUNT},${graphY(scores[0]).toFixed(2)}`}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div
            className="graph-peak"
            style={{
              left: `${(peak / SAMPLE_COUNT) * 100}%`,
              bottom: `${GRAPH_PAD + scores[peak] * (GRAPH_HEIGHT - 2 * GRAPH_PAD)}%`,
            }}
          />
          <div className="now-line" style={{ left: nowLeft }} />
        </div>
        <div className="timeline-meta">
          <span className="graph-peak-label">peak {peakLabel}</span>
        </div>
      </div>
    );
  }

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

      {graphRow}

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
          <span className="legend-item">
            <span className="legend-swatch legend-swatch--peak" /> best meeting time
          </span>
        </div>
      )}
    </div>
  );
};

export default Timeline;
