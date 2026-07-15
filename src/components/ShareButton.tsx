import React, { useEffect, useRef, useState } from 'react';
import { TeamMember } from '../types';
import { makeShareUrl } from '../lib/config';

const ShareButton: React.FC<{ team: TeamMember[] }> = ({ team }) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number>();

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const share = async () => {
    const url = makeShareUrl(team);

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Copy this link:', url);
    }

    setCopied(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button type="button" className="btn" onClick={share}>
      {copied ? 'Link copied ✓' : 'Share team'}
    </button>
  );
};

export default ShareButton;
