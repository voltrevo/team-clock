import React, { useEffect, useState } from 'react';
import TeamMemberCard from './TeamMemberCard';
import { TeamMember } from '../types';
import everySecond from '../everySecond';

const TeamVisualizer: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

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

  const sortedTeam = [...team].sort((a, b) => {
    const aTime = new Date(currentTime.toLocaleString('en-US', { timeZone: a.timezone }));
    const bTime = new Date(currentTime.toLocaleString('en-US', { timeZone: b.timezone }));
    return aTime.getHours() - bTime.getHours() || aTime.getMinutes() - bTime.getMinutes();
  });

  return (
    <div className="team-visualizer">
      {sortedTeam.map((member, index) => (
        <TeamMemberCard key={index} member={member} currentTime={currentTime} />
      ))}
    </div>
  );
};

export default TeamVisualizer;