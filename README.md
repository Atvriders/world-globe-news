# World Globe News

Interactive 3D globe news viewer — browse breaking news from around the world pinned to real locations with multi-source aggregation.

![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **3D Interactive Globe** — Rotate, zoom, and click powered by [react-globe.gl](https://github.com/vasturiano/react-globe.gl)
- **17 RSS Feed Sources** — BBC, Al Jazeera, NPR, France 24, DW, The Guardian, CBS, ABC, SCMP, Times of India, and more
- **Auto-Geocoding** — Extracts locations from headlines using 70+ country codes, 65+ major cities, and 50+ keyword mappings (political figures, organizations, landmarks)
- **News Clustering** — Jaccard similarity groups articles about the same story from different sources into a single pin
- **Breaking News Detection** — 3+ sources covering the same story triggers breaking status with pulsing ring animations
- **8 Category Filters** — World, Politics, Business, Technology, Sports, Health, Science, Entertainment
- **Time Filters** — Last hour, 6 hours, 24 hours, or 7 days
- **Multi-Source Detail Panel** — Click any story to see all outlets covering it with links to originals
- **Region Quick-Select** — Fly to Africa, Americas, Asia, Europe, Oceania, or Middle East
- **Scrolling News Ticker** — Breaking headlines scroll along the bottom
- **50+ News Source Metadata** — Brand colors and reliability tiers for major outlets worldwide

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 5 |
| Globe | react-globe.gl (Three.js WebGL) |
| State | Zustand |
| Backend | Express.js (Node.js) |
| RSS Parsing | rss-parser |
| Deployment | Docker + GitHub Actions → GHCR |

## Quick Start

### Prerequisites

- Node.js 20+
- npm

### Development

```bash
# Install dependencies
npm install
cd server && npm install && cd ..

# Start both frontend and backend
npm run dev:all
```

- Frontend: http://localhost:3008
- Backend API: http://localhost:3009

### Production Build

```bash
npm run build
```

### Docker

```bash
docker-compose up
```

- Frontend (nginx): port 3008
- Backend (node): port 3009

## Architecture

```
world-globe-news/
├── src/
│   ├── App.tsx                    # Main app shell
│   ├── main.tsx                   # Entry point
│   ├── components/
│   │   ├── Globe/
│   │   │   └── NewsGlobe.tsx      # 3D globe with news pins + rings
│   │   └── UI/
│   │       ├── TopBar.tsx         # Category filters + clock
│   │       ├── SearchBar.tsx      # Floating search
│   │       ├── NewsSidebar.tsx    # Collapsible news list + time filters
│   │       ├── NewsDetail.tsx     # Multi-source detail panel
│   │       ├── NewsTicker.tsx     # Scrolling breaking headlines
│   │       ├── RegionSelector.tsx # Continent quick-fly buttons
│   │       └── LoadingScreen.tsx  # Loading overlay
│   ├── data/
│   │   ├── theme.ts              # Colors, animations, constants
│   │   ├── newsSources.ts        # 50+ outlet metadata
│   │   ├── geoLocations.ts       # 197 countries + 189 cities
│   │   └── rssFeeds.ts           # 30 RSS feed configs
│   ├── hooks/
│   │   ├── useStore.ts           # Zustand state management
│   │   └── useNewsFetch.ts       # Data fetching + polling
│   └── types/
│       └── index.ts              # TypeScript interfaces
├── server/
│   └── src/
│       └── server.js             # Express backend (RSS aggregation, geocoding, clustering)
├── public/img/                   # Globe textures
├── Dockerfile                    # Frontend (nginx)
├── server/Dockerfile             # Backend (node)
├── docker-compose.yml
└── .github/workflows/
    └── docker-publish.yml        # CI/CD to GHCR
```

## How It Works

1. **Backend** polls 17 RSS feeds every 5 minutes
2. **Geocoding** extracts locations from article titles using keyword dictionaries (cities, countries, political figures, organizations)
3. **Clustering** groups articles about the same topic using Jaccard word-set similarity (threshold 0.25)
4. **Breaking detection** flags clusters with 3+ sources
5. **Frontend** fetches clustered news every 60 seconds and renders pins on the globe
6. **Globe pins** are colored by category, sized by importance, with pulsing rings for breaking stories

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/news` | Clustered news (supports `?category=`, `?timeFilter=`, `?search=`) |
| `GET /api/news/stats` | Aggregate stats (cluster count, source count, categories) |
| `GET /api/health` | Server health check |

## News Sources

BBC World, BBC Technology, BBC Business, BBC Science, Al Jazeera, NPR World, NPR Politics, France 24, DW News, The Guardian World, The Guardian Tech, CBS World, CBS Politics, CBS Science, ABC News, SCMP World, Times of India, and more via RSS feeds.

## License

MIT
