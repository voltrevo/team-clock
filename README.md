# Team Clock

See everyone's local time, working hours, and overlap on one live timeline.

**Live:** https://voltrevo.github.io/team-clock/ (landing) · https://voltrevo.github.io/team-clock/app/ (app)

## Features

- **Timeline view** — every teammate's working hours on a shared 24h axis, with a live
  "now" line and highlighted windows where the team overlaps. A cards view is available
  as an alternate.
- **Time scrubbing** — drag the slider (±12h) to see what any moment looks like for
  everyone.
- **Easy setup** — searchable IANA timezone picker (via `Intl.supportedValuesOf`),
  per-member work hours, live editing. JSON import/export behind an "advanced" toggle.
- **Shareable** — "Share team" encodes the whole config into a URL fragment; opening a
  share link adopts the team into your browser.
- **Private** — no accounts, no server. Everything lives in `localStorage`.
- Light/dark theme, zero runtime dependencies beyond React.

## Development

```sh
npm ci
npm run dev    # landing at /team-clock/, app at /team-clock/app/
npm run build  # typecheck + multi-page production build to dist/
npm run lint
```

Deploys to GitHub Pages from `main` via `.github/workflows/gh-pages.yml`.

## Team config format

```json
[
  { "name": "Alice", "timezone": "America/New_York", "workHours": ["0900", "1700"] }
]
```

`timezone` is an IANA zone name; `workHours` is `[start, end]` in 24h `HHMM`, in the
member's local time.
