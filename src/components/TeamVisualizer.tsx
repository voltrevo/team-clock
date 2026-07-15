import React, { useEffect, useState } from 'react';
import { TeamMember } from '../types';
import everySecond from '../everySecond';
import { getUtcOffsetMinutes } from '../lib/time';
import TeamMemberCard from './TeamMemberCard';
import TimeSlider from './TimeSlider';
import Timeline from './Timeline';

type View = 'timeline' | 'cards';

interface Props {
  team: TeamMember[];
}

const TeamVisualizer: React.FC<Props> = ({ team }) => {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [offsetMinutes, setOffsetMinutes] = useState(0);
  const [view, setView] = useState<View>(() =>
    localStorage.getItem('view') === 'cards' ? 'cards' : 'timeline',
  );

  useEffect(() => everySecond(() => setCurrentTime(new Date())), []);

  const changeView = (next: View) => {
    setView(next);
    localStorage.setItem('view', next);
  };

  const time = new Date(currentTime.getTime() + offsetMinutes * 60_000);

  if (team.length === 0) {
    return (
      <div className="visualizer">
        <div className="empty-state">Your team is empty — add someone below to get started.</div>
      </div>
    );
  }

  const sortedTeam = [...team].sort(
    (a, b) =>
      getUtcOffsetMinutes(time, a.timezone) - getUtcOffsetMinutes(time, b.timezone) ||
      a.name.localeCompare(b.name),
  );

  return (
    <div className="visualizer">
      <div className="visualizer-toolbar">
        <div className="segmented" role="tablist" aria-label="View">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'timeline'}
            className={view === 'timeline' ? 'active' : ''}
            onClick={() => changeView('timeline')}
          >
            Timeline
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'cards'}
            className={view === 'cards' ? 'active' : ''}
            onClick={() => changeView('cards')}
          >
            Cards
          </button>
        </div>
      </div>

      {view === 'timeline' ? (
        <div className="panel">
          <Timeline team={sortedTeam} time={time} />
        </div>
      ) : (
        <div className="cards-grid">
          {sortedTeam.map((member, index) => (
            <TeamMemberCard key={index} member={member} time={time} />
          ))}
        </div>
      )}

      <TimeSlider offsetMinutes={offsetMinutes} onChange={setOffsetMinutes} time={time} />
    </div>
  );
};

export default TeamVisualizer;
