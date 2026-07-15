import React, { useEffect, useState } from 'react';
import { TeamMember } from '../types';
import { isValidTeam } from '../lib/config';
import { formatHHMM, parseHHMM } from '../lib/time';
import { getLocalTimeZone } from '../lib/timezones';
import TimezoneSelect from './TimezoneSelect';
import { XIcon } from './icons';

interface Props {
  team: TeamMember[];
  onChange: (team: TeamMember[]) => void;
}

/** "0900" -> "09:00" for <input type="time"> */
function toInputValue(stored: string): string {
  return formatHHMM(parseHHMM(stored));
}

/** "09:00" -> "0900" */
function toStoredValue(input: string): string {
  return input.replace(':', '');
}

const JsonEditor: React.FC<Props> = ({ team, onChange }) => {
  const [draft, setDraft] = useState(() => JSON.stringify(team, null, 2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(JSON.stringify(team, null, 2));
    setError(null);
  }, [team]);

  const apply = () => {
    let parsed: unknown;

    try {
      parsed = JSON.parse(draft);
    } catch {
      setError('Not valid JSON.');
      return;
    }

    if (!isValidTeam(parsed)) {
      setError(
        'Invalid team config. Each member needs a name, an IANA timezone, and workHours like ["0900", "1700"].',
      );
      return;
    }

    setError(null);
    onChange(parsed);
  };

  return (
    <div className="json-editor">
      <textarea
        rows={12}
        spellCheck={false}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        aria-label="Team configuration as JSON"
      />
      {error && <p className="error-text">{error}</p>}
      <div>
        <button type="button" className="btn" onClick={apply}>
          Apply JSON
        </button>
      </div>
    </div>
  );
};

const TeamEditor: React.FC<Props> = ({ team, onChange }) => {
  const update = (index: number, patch: Partial<TeamMember>) => {
    onChange(team.map((member, i) => (i === index ? { ...member, ...patch } : member)));
  };

  const updateWorkHour = (index: number, which: 0 | 1, inputValue: string) => {
    if (!inputValue) {
      return; // ignore cleared <input type="time">
    }

    const workHours: [string, string] = [...team[index].workHours];
    workHours[which] = toStoredValue(inputValue);
    update(index, { workHours });
  };

  const remove = (index: number) => {
    onChange(team.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([...team, { name: '', timezone: getLocalTimeZone(), workHours: ['0900', '1700'] }]);
  };

  return (
    <section className="team-editor">
      <div className="section-head">
        <h2>Your team</h2>
        <button type="button" className="btn btn-primary" onClick={add}>
          + Add member
        </button>
      </div>

      {team.length > 0 && (
        <div className="editor-rows">
          <div className="editor-row editor-row--head" aria-hidden="true">
            <span>Name</span>
            <span>Timezone</span>
            <span>Work hours</span>
            <span />
          </div>
          {team.map((member, index) => (
            <div className="editor-row" key={index}>
              <input
                className="text-input"
                type="text"
                placeholder="Name"
                value={member.name}
                onChange={(event) => update(index, { name: event.target.value })}
                aria-label="Member name"
              />
              <TimezoneSelect
                value={member.timezone}
                onChange={(timezone) => update(index, { timezone })}
              />
              <div className="hours-inputs">
                <input
                  type="time"
                  step={900}
                  value={toInputValue(member.workHours[0])}
                  onChange={(event) => updateWorkHour(index, 0, event.target.value)}
                  aria-label="Work start"
                />
                <span className="hours-sep">–</span>
                <input
                  type="time"
                  step={900}
                  value={toInputValue(member.workHours[1])}
                  onChange={(event) => updateWorkHour(index, 1, event.target.value)}
                  aria-label="Work end"
                />
              </div>
              <button
                type="button"
                className="icon-btn icon-btn--danger"
                onClick={() => remove(index)}
                aria-label={`Remove ${member.name || 'member'}`}
                title="Remove"
              >
                <XIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      {team.length === 0 && (
        <div className="empty-state">No teammates yet — add your first member above.</div>
      )}

      <details className="advanced">
        <summary>Advanced: JSON import / export</summary>
        <JsonEditor team={team} onChange={onChange} />
      </details>
    </section>
  );
};

export default TeamEditor;
