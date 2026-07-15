import React, { useState } from 'react';
import { TeamMember } from './types';
import { loadTeam, saveTeam } from './lib/config';
import TeamVisualizer from './components/TeamVisualizer';
import TeamEditor from './components/TeamEditor';
import ShareButton from './components/ShareButton';
import ThemeToggle from './components/ThemeToggle';
import { ClockLogo, GitHubIcon } from './components/icons';

export const GITHUB_URL = 'https://github.com/voltrevo/team-clock';

const App: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>(loadTeam);

  const updateTeam = (next: TeamMember[]) => {
    setTeam(next);
    saveTeam(next);
  };

  return (
    <div className="app">
      <header className="app-header">
        <a className="brand" href={import.meta.env.BASE_URL}>
          <ClockLogo />
          <span>Team Clock</span>
        </a>
        <div className="header-actions">
          <ShareButton team={team} />
          <ThemeToggle />
          <a
            className="icon-btn"
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="View on GitHub"
            title="View on GitHub"
          >
            <GitHubIcon />
          </a>
        </div>
      </header>

      <main className="app-main">
        <TeamVisualizer team={team} />
        <TeamEditor team={team} onChange={updateTeam} />
      </main>

      <footer className="page-footer">
        Times update live &middot; your team is stored only in this browser
      </footer>
    </div>
  );
};

export default App;
