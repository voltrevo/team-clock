import React, { useEffect, useMemo, useRef, useState } from 'react';
import { formatTimeInZone, formatUtcOffset, getUtcOffsetMinutes } from '../lib/time';
import { cityLabel, isOffsetZone, searchTimeZones } from '../lib/timezones';
import { ChevronDownIcon } from './icons';

interface Props {
  value: string;
  onChange: (timezone: string) => void;
}

const TimezoneSelect: React.FC<Props> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => searchTimeZones(query), [query]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onMouseDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', onMouseDown);
    inputRef.current?.focus();

    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  useEffect(() => {
    listRef.current?.children[highlight]?.scrollIntoView({ block: 'nearest' });
  }, [highlight]);

  const select = (zone: string) => {
    onChange(zone);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();

      if (results[highlight]) {
        select(results[highlight]);
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  const now = new Date();

  return (
    <div className="tz-select" ref={rootRef}>
      <button
        type="button"
        className="tz-select-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="tz-select-city">{cityLabel(value)}</span>
        {!isOffsetZone(value) && (
          <span className="tz-select-offset">
            {formatUtcOffset(getUtcOffsetMinutes(now, value))}
          </span>
        )}
        <ChevronDownIcon />
      </button>

      {open && (
        <div className="tz-select-popover">
          <input
            ref={inputRef}
            className="tz-select-search"
            type="text"
            placeholder="Search city, region, or UTC±N…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
          />
          <ul className="tz-select-list" role="listbox" ref={listRef}>
            {results.map((zone, index) => (
              <li
                key={zone}
                role="option"
                aria-selected={zone === value}
                className={`tz-option${index === highlight ? ' highlighted' : ''}${
                  zone === value ? ' selected' : ''
                }`}
                onMouseEnter={() => setHighlight(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  select(zone);
                }}
              >
                <span className="tz-option-city">{cityLabel(zone)}</span>
                <span className="tz-option-zone">{isOffsetZone(zone) ? 'Fixed offset' : zone}</span>
                <span className="tz-option-now">
                  {formatTimeInZone(now, zone)}
                  {!isOffsetZone(zone) && (
                    <> &middot; {formatUtcOffset(getUtcOffsetMinutes(now, zone))}</>
                  )}
                </span>
              </li>
            ))}
            {results.length === 0 && <li className="tz-empty">No matching timezones</li>}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TimezoneSelect;
