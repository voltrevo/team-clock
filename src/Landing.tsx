import React, { useEffect, useState } from 'react';
import { TeamMember } from './types';
import everySecond from './everySecond';
import Timeline from './components/Timeline';
import TimeSlider from './components/TimeSlider';
import ThemeToggle from './components/ThemeToggle';
import { ArrowRightIcon, ClockLogo, GitHubIcon } from './components/icons';
import { GITHUB_URL } from './App';

const APP_URL = `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}app/`;

const SAMPLE_TEAM: TeamMember[] = [
  { name: 'Sam', timezone: 'America/Los_Angeles', workHours: ['0900', '1700'] },
  { name: 'Alice', timezone: 'America/New_York', workHours: ['0900', '1700'] },
  { name: 'Bruno', timezone: 'Europe/Berlin', workHours: ['0800', '1600'] },
  { name: 'Priya', timezone: 'Asia/Kolkata', workHours: ['1000', '1800'] },
  { name: 'Yuki', timezone: 'Asia/Tokyo', workHours: ['1000', '1800'] },
];

const Landing: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [offsetMinutes, setOffsetMinutes] = useState(0);

  useEffect(() => everySecond(() => setCurrentTime(new Date())), []);

  const time = new Date(currentTime.getTime() + offsetMinutes * 60_000);

  return (
    <div className="landing">
      <header className="app-header">
        <span className="brand">
          <ClockLogo />
          <span>Team Clock</span>
        </span>
        <div className="header-actions">
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

      <main>
        <section className="hero">
          <h1>
            Know when your team
            <br />
            is <span className="accent-text">awake</span>.
          </h1>
          <p className="hero-sub">
            Team Clock puts everyone&apos;s local time, working hours, and overlap on one live
            timeline — so you can plan across timezones without doing the math.
          </p>
          <div className="hero-cta">
            <a className="btn btn-primary btn-lg" href={APP_URL}>
              Open Team Clock <ArrowRightIcon />
            </a>
            <a className="btn btn-lg" href={GITHUB_URL} target="_blank" rel="noreferrer">
              View on GitHub
            </a>
          </div>
        </section>

        <section className="demo">
          <div className="panel demo-panel">
            <Timeline team={SAMPLE_TEAM} time={time} />
            <TimeSlider offsetMinutes={offsetMinutes} onChange={setOffsetMinutes} time={time} />
          </div>
          <p className="demo-hint">This demo is live — drag the slider to scrub through the day.</p>
        </section>

        <section className="features">
          <div className="feature">
            <h3>The whole day at a glance</h3>
            <p>
              Every teammate&apos;s working hours on one shared timeline, with a live line marking
              right now and highlights where your hours overlap.
            </p>
          </div>
          <div className="feature">
            <h3>Scrub through time</h3>
            <p>
              Planning a meeting? Drag the slider to any moment of the day and see what time it
              lands for everyone — before you send the invite.
            </p>
          </div>
          <div className="feature">
            <h3>Private and shareable</h3>
            <p>
              No accounts, no server. Your team is stored in your browser, and a single link
              shares the whole setup with everyone.
            </p>
          </div>
        </section>

        <section className="closing-cta">
          <h2>Set up your team in under a minute.</h2>
          <a className="btn btn-primary btn-lg" href={APP_URL}>
            Open Team Clock <ArrowRightIcon />
          </a>
        </section>
      </main>

      <footer className="page-footer">
        Team Clock &middot;{' '}
        <a href={GITHUB_URL} target="_blank" rel="noreferrer">
          open source on GitHub
        </a>
      </footer>
    </div>
  );
};

export default Landing;
