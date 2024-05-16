import React, { useEffect, useState } from 'react';
import TeamMemberCard from './TeamMemberCard';
import { TeamMember } from '../types';
import everySecond from '../everySecond';

const TeamVisualizer: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [offsetMinutes, setOffsetMinutes] = useState(0);

  useEffect(() => {
    const savedTeam = localStorage.getItem('team');
    if (savedTeam) {
      setTeam(JSON.parse(savedTeam));
    }

    const stop = everySecond(() => {
      setCurrentTime(new Date());
    });

    return stop;
  }, []);

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOffsetMinutes(Number(event.target.value));
  };

  const adjustedTime = new Date(currentTime.getTime() + offsetMinutes * 60 * 1000);

  const sortedTeam = [...team].sort((a, b) => {
    const aTime = new Date(adjustedTime.toLocaleString('en-US', { timeZone: a.timezone }));
    const bTime = new Date(adjustedTime.toLocaleString('en-US', { timeZone: b.timezone }));
    return aTime.getHours() - bTime.getHours() || aTime.getMinutes() - bTime.getMinutes();
  });

  const offsetDisplay = (() => {
    const negative = offsetMinutes < 0 ? '-' : '';
    const min = (Math.abs(offsetMinutes) % 60).toString();
    const hr = (Math.floor(Math.abs(offsetMinutes) / 60)).toString();

    return `${negative}${hr.padStart(2, '0')}:${min.padStart(2, '0')}`;
  })();

  return (
    <div className="team-visualizer">
      <div className="team-cards">
        {sortedTeam.map((member, index) => (
          <TeamMemberCard key={index} member={member} currentTime={adjustedTime} />
        ))}
      </div>
      <div className="slider-container">
        <label htmlFor="time-offset-slider">Offset: {offsetDisplay}</label>
        <input
          type="range"
          id="time-offset-slider"
          min="-720"
          max="720"
          step="5"
          value={offsetMinutes}
          onInput={handleSliderChange}
        />
      </div>
    </div>
  );
};

export default TeamVisualizer;