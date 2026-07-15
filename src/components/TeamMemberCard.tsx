import React from 'react';
import { TeamMember } from '../types';
import {
  formatTimeInZone,
  formatUtcOffset,
  getDayDiff,
  getMemberStatus,
  getUtcOffsetMinutes,
  getZonedTime,
  weekdayName,
} from '../lib/time';
import { cityLabel, isOffsetZone } from '../lib/timezones';
import StatusBadge from './StatusBadge';

interface Props {
  member: TeamMember;
  time: Date;
}

const TeamMemberCard: React.FC<Props> = ({ member, time }) => {
  const zoned = getZonedTime(time, member.timezone);
  const status = getMemberStatus(zoned, member.workHours);
  const dayDiff = getDayDiff(zoned, time);

  return (
    <div className="member-card" data-status={status}>
      <div className="member-card-head">
        <h3 className="member-name">{member.name || 'Unnamed'}</h3>
        <StatusBadge status={status} />
      </div>
      <div className="member-card-time">
        {formatTimeInZone(time, member.timezone, true)}
        {dayDiff !== 0 && <span className="day-diff">{dayDiff > 0 ? '+1d' : '-1d'}</span>}
      </div>
      <div className="member-card-zone">
        {weekdayName(zoned.weekday)} &middot; {cityLabel(member.timezone)}
        {!isOffsetZone(member.timezone) && (
          <> &middot; {formatUtcOffset(getUtcOffsetMinutes(time, member.timezone))}</>
        )}
      </div>
    </div>
  );
};

export default TeamMemberCard;
