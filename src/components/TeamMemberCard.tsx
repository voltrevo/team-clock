import React from 'react';
import { TeamMember } from '../types';

interface Props {
  member: TeamMember;
  currentTime: Date;
}

const TeamMemberCard: React.FC<Props> = ({ member, currentTime }) => {
  const memberTime = new Date(currentTime.toLocaleString('en-US', { timeZone: member.timezone }));
  const isWorking = (hour: number) => {
    const [start, end] = member.workHours.map(h => parseInt(h));
    return (hour >= start && hour < end);
  };

  return (
    <div className="team-member-card">
      <h2>{member.name}</h2>
      <p>Current Time: {memberTime.toLocaleTimeString()}</p>
      <p>Status: {isWorking(memberTime.getHours() * 100 + memberTime.getMinutes()) ? 'Working' : 'Off Hours'}</p>
    </div>
  );
};

export default TeamMemberCard;
