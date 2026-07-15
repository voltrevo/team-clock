import React from 'react';
import { MemberStatus, STATUS_LABELS } from '../lib/time';

const StatusBadge: React.FC<{ status: MemberStatus }> = ({ status }) => (
  <span className="status-badge" data-status={status}>
    <span className="status-dot" />
    {STATUS_LABELS[status]}
  </span>
);

export default StatusBadge;
