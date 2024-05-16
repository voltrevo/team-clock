import React from 'react';
import { TeamMember } from '../types';

interface Props {
  member: TeamMember;
  currentTime: Date;
}

const TeamMemberCard: React.FC<Props> = ({ member, currentTime }) => {
  const memberTime = new Date(currentTime.toLocaleString('en-US', { timeZone: member.timezone }));
  const memberHour = memberTime.getHours();
  const memberMinute = memberTime.getMinutes();
  const memberTimeInMinutes = memberHour * 60 + memberMinute;
  const dayOfWeek = memberTime.getDay();
  const [startHour, startMinute] = [parseInt(member.workHours[0].slice(0, 2)), parseInt(member.workHours[0].slice(2))];
  const [endHour, endMinute] = [parseInt(member.workHours[1].slice(0, 2)), parseInt(member.workHours[1].slice(2))];
  const startTimeInMinutes = startHour * 60 + startMinute;
  const endTimeInMinutes = endHour * 60 + endMinute;

  let status = 'Off Hours';
  let cardColor = '#f0f0f0'; // Default color

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    status = "Weekend";
    cardColor = '#9e9e9e';
  } else if (memberTimeInMinutes >= startTimeInMinutes - 120 && memberTimeInMinutes < startTimeInMinutes) {
    status = "Early";
    cardColor = '#fbc02d';
  } else if (memberTimeInMinutes >= startTimeInMinutes && memberTimeInMinutes < endTimeInMinutes) {
    status = 'Work Time';
    cardColor = '#388e3c';
  } else if (memberTimeInMinutes >= endTimeInMinutes && memberTimeInMinutes < endTimeInMinutes + 120) {
    status = "Late";
    cardColor = '#1976d2';
  } else if (memberTimeInMinutes >= endTimeInMinutes + 120 || memberTimeInMinutes < startTimeInMinutes - 120) {
    status = "Off Hours";
    cardColor = '#d32f2f';
  }

  return (
    <div className="team-member-card" style={{ backgroundColor: cardColor }}>
      <h2>{member.name}</h2>
      <p>{memberTime.toLocaleTimeString()}</p>
      <p>{status}</p>
    </div>
  );
};

export default TeamMemberCard;
