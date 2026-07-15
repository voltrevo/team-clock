import React from 'react';

const MAX_OFFSET = 720;

const labelFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  hour: 'numeric',
  minute: '2-digit',
});

interface Props {
  offsetMinutes: number;
  onChange: (offsetMinutes: number) => void;
  time: Date; // already adjusted by offsetMinutes
}

const TimeSlider: React.FC<Props> = ({ offsetMinutes, onChange, time }) => {
  const nudge = (delta: number) => {
    onChange(Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, offsetMinutes + delta)));
  };

  const prefix = (() => {
    if (offsetMinutes === 0) {
      return 'Now';
    }

    const sign = offsetMinutes < 0 ? '−' : '+';
    const abs = Math.abs(offsetMinutes);
    const hours = String(Math.floor(abs / 60)).padStart(2, '0');
    const minutes = String(abs % 60).padStart(2, '0');

    return `Now ${sign} ${hours}:${minutes}`;
  })();

  return (
    <div className="time-slider">
      <div className="time-slider-header">
        <span className="time-slider-value">
          {prefix} &middot; {labelFormatter.format(time)}
        </span>
        {offsetMinutes !== 0 && (
          <button type="button" className="chip-btn" onClick={() => onChange(0)}>
            Reset to now
          </button>
        )}
      </div>
      <div className="time-slider-controls">
        <button
          type="button"
          className="btn btn-small"
          aria-label="Back one hour"
          onClick={() => nudge(-60)}
        >
          −1h
        </button>
        <input
          type="range"
          aria-label="Time offset"
          min={-MAX_OFFSET}
          max={MAX_OFFSET}
          step={15}
          value={offsetMinutes}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <button
          type="button"
          className="btn btn-small"
          aria-label="Forward one hour"
          onClick={() => nudge(60)}
        >
          +1h
        </button>
      </div>
    </div>
  );
};

export default TimeSlider;
