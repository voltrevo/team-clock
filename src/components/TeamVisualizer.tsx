import React, { useEffect, useState } from 'react';
import TeamMemberCard from './TeamMemberCard';
import { TeamMember } from '../types';

const TeamVisualizer: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const savedTeam = localStorage.getItem('team');
    if (savedTeam) {
      setTeam(JSON.parse(savedTeam));
    }

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="team-visualizer">
      {team.map((member, index) => (
        <TeamMemberCard key={index} member={member} currentTime={currentTime} />
      ))}
    </div>
  );
};

export default TeamVisualizer;