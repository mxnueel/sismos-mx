# Sismos MX

[![CI](https://github.com/mxnueel/sismos-mx/actions/workflows/ci.yml/badge.svg)](https://github.com/mxnueel/sismos-mx/actions/workflows/ci.yml)
[![Deploy](https://github.com/mxnueel/sismos-mx/actions/workflows/deploy.yml/badge.svg)](https://github.com/mxnueel/sismos-mx/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Live: [mxnueel.github.io/sismos-mx](https://mxnueel.github.io/sismos-mx/)**

A live earthquake map focused on Mexico, built directly on the USGS's real-time feeds — no account, no API key, no backend server. It's a static site: open it and it just works.

## Why

Mexico has a real, ongoing relationship with seismic risk — three of the country's most destructive earthquakes happened on the same calendar date, 32 years apart (Sept 19, 1985, 2017, and 2022), which the map marks as a historical reference layer. Dedicated mobile apps for this exist and have real install bases (My Earthquake Alerts, MyShake), but a fast, no-install, no-tracking web map is a legitimate different shape for the same need.

## Features

- Live earthquake data from USGS, filterable by **Mexico** (a bounding box around the country and its seismically active coastline) or **Global**
- Time range: last hour / 24 hours / week
- Minimum magnitude filter
- Map + synced sidebar list, click either to jump to the other
- Toggleable historical reference layer for 1985/2017/2022
- **Zone alerts**: click anywhere on the map to set a point + radius, and get a browser notification when a new earthquake appears within that zone — computed client-side with the Haversine formula, no server involved. Honest limitation: this only fires while the tab stays open. True push notifications (working with the browser closed) need a server watching on your behalf, which this project deliberately doesn't have.
- Auto-refreshes every 5 minutes
- Mobile responsive

## Stack

Vanilla JS (ES modules, no framework, no build step), [Leaflet](https://leafletjs.com/) for the map, OpenStreetMap tiles. Deploys as-is to GitHub Pages.

## Data source

[USGS Earthquake Hazards Program](https://earthquake.usgs.gov/) — the pre-computed summary feeds (`all_hour`/`all_day`/`all_week.geojson`) for the global view, and the [FDSN event query API](https://earthquake.usgs.gov/fdsnws/event/1/) with a bounding box for the Mexico-filtered view. Both are public, free, CORS-enabled, and need no authentication at all.

## Run locally

No build step — any static file server works:

```bash
python3 -m http.server 8000
# or: npx serve
```

Then open `http://localhost:8000`.

## Testing

```bash
npm install
npx playwright install chromium
npm test
```

23 tests across three levels:
- **`format.test.js`** — pure formatting/filtering/sorting logic
- **`usgs.test.js`** — real calls against the live USGS API (no mocks): fetches actual recent earthquakes and verifies a real historical M7+ event search in the Mexico bounding box
- **`geo.test.js`** — the Haversine distance math behind zone alerts, including a real-world sanity check (CDMX–Guadalajara ≈ 460km)
- **`e2e.test.js`** — a real headless Chromium browser (Playwright) loading the actual page, confirming Leaflet renders, real earthquake data appears on the map and in the sidebar, filter controls work, the zone-alert flow works end to end (pick a zone on the map, grant notification permission, activate), and there are zero console errors

CI runs the full suite (including the browser-based e2e tests) on every push. A separate workflow deploys straight to GitHub Pages on every push to `master`.

## License

MIT — see [LICENSE](LICENSE).
