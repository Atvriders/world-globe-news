# World Globe News

Interactive 3D globe news viewer — browse breaking news from around the world pinned to real locations with multi-source aggregation.

![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **3D Interactive Globe** — Soft, animated globe with purple atmosphere glow, auto-rotation (stops when zoomed in), and cinematic fly-to animations
- **250 RSS Feed Sources** — Aggregates news from 250 feeds worldwide including Reuters, AP, BBC, CNN, NYT, Al Jazeera, NHK, SCMP, and 240+ more
- **Auto-Geocoding** — Extracts locations from headlines using 70+ country codes, 65+ major cities, and 50+ keyword mappings
- **News Clustering** — Jaccard similarity groups articles about the same story from different sources (up to 10 sources per pin)
- **Breaking News Detection** — 3+ sources covering the same story triggers breaking status with pulsing ring animations
- **Expandable Source Cards** — Click any source to see article summary, then "Open Source" button to read the original
- **8 Category Filters** — World, Politics, Business, Technology, Sports, Health, Science, Entertainment (dropdown menu)
- **4 Sort Modes** — Breaking First, Newest, Most Sources, Category grouping
- **Time Filters** — Last hour, 6 hours, 24 hours, or 7 days
- **Region Quick-Select** — Horizontal glass bar with fly-to buttons for Africa, Americas, Asia, Europe, Oceania, Middle East
- **Live Stats Overlay** — Floating panel showing story count, breaking count, active sources, countries covered
- **News Ticker** — Ultra-slow scrolling headlines with slide-in animation and "NEW" badge on fresh stories
- **Update Sources** — Manual refresh button to pull latest news on demand
- **Comfy Futuristic UI** — Glassmorphism panels, gradient accents, 12 news-themed animations, warm charcoal theme
- **Responsive Globe** — Scales to window size on resize

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
│   │   │   └── NewsGlobe.tsx      # 3D globe with pins, rings, arcs
│   │   └── UI/
│   │       ├── TopBar.tsx         # Category dropdown + clock + Update Sources
│   │       ├── SearchBar.tsx      # Floating search
│   │       ├── NewsSidebar.tsx    # Collapsible news list + sorting + time filters
│   │       ├── NewsDetail.tsx     # Expandable source cards + Open Source button
│   │       ├── NewsTicker.tsx     # Slow-scroll ticker + NEW badge
│   │       ├── RegionSelector.tsx # Horizontal glass fly-to bar
│   │       ├── StatsOverlay.tsx   # Live stats panel
│   │       └── LoadingScreen.tsx  # Animated loading overlay
│   ├── data/
│   │   ├── theme.ts              # Comfy futuristic design system + 12 animations
│   │   ├── newsSources.ts        # 50+ outlet metadata with brand colors
│   │   ├── geoLocations.ts       # 197 countries + 189 cities
│   │   └── rssFeeds.ts           # RSS feed configs
│   ├── hooks/
│   │   ├── useStore.ts           # Zustand state management
│   │   └── useNewsFetch.ts       # Data fetching + polling
│   └── types/
│       └── index.ts              # TypeScript interfaces
├── server/
│   └── src/
│       └── server.js             # Express backend (250 RSS feeds, geocoding, clustering)
├── public/img/                   # Globe textures
├── Dockerfile                    # Frontend (nginx)
├── server/Dockerfile             # Backend (node)
├── docker-compose.yml
└── .github/workflows/
    └── docker-publish.yml        # CI/CD to GHCR
```

## How It Works

1. **Backend** polls 250 RSS feeds every 5 minutes (fetches 25 articles per feed)
2. **Geocoding** extracts locations from article titles using keyword dictionaries (cities, countries, political figures, organizations)
3. **Clustering** groups articles about the same topic using Jaccard word-set similarity (threshold 0.25), capped at 10 sources per cluster
4. **Breaking detection** flags clusters with 3+ sources
5. **Frontend** fetches all clustered news every 60 seconds (or manually via Update Sources button)
6. **Client-side filtering** by category, search query, and time range — instant, no re-fetch needed
7. **Globe pins** colored by category, sized by importance, with pulsing rings for breaking stories and connection arcs for selected stories

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/news` | All clustered news with location, sources, and metadata |
| `GET /api/news/stats` | Aggregate stats (cluster count, source count, categories) |
| `GET /api/health` | Server health check |

## News Sources (250 feeds)

**Wire/US:** Reuters, AP, CNN, Fox News, NBC, ABC, CBS, NPR, PBS, NYT, Washington Post, WSJ, Bloomberg, Politico, The Hill, USA Today, LA Times, Chicago Tribune, Boston Globe, ProPublica, Axios, The Atlantic, Vox, Slate, Vice, Mother Jones, National Review, The Intercept, Daily Beast, NY Post

**UK/Europe:** BBC (7 feeds), Sky News, The Guardian (5 feeds), The Independent, Financial Times, Irish Times, RTE, Metro UK, Mirror, Der Spiegel, France 24, EuroNews, ANSA, Swiss Info, Politico EU, EU Observer, Balkan Insight, The Local (5 countries)

**Asia-Pacific:** NHK, SCMP (3 feeds), Times of India, Hindustan Times, The Hindu, NDTV, Straits Times, Channel News Asia, Bangkok Post, Korea Herald, Jakarta Post, Japan Times, Yonhap, Kyodo, Taipei Times, Dawn, Vietnam News, The Diplomat, Asia Times, ABC Australia, NZ Herald, RNZ

**Middle East/Africa:** Al Jazeera, Al Arabiya, Times of Israel, Haaretz, Gulf News, Arab News, Kurdistan 24, TRT World, Middle East Eye, The National UAE, Daily Maverick, Mail & Guardian, All Africa, Sahara Reporters, Punch Nigeria, East African

**Science/Tech:** Nature, Science Daily, NASA, ESA, New Scientist, Phys.org, Space.com, MIT Tech Review, TechCrunch, The Verge, Ars Technica, Wired, ZDNet, Engadget, CNET, 9to5Mac, Hacker News, Rest of World

**Business:** CNBC, MarketWatch, Business Insider, Fortune, Forbes, Quartz, Fast Company, The Economist

**Health:** WHO News, Medical News Today, Stat News, Kaiser Health News, WebMD, Live Science

**Sports:** ESPN, BBC Sport, Sky Sports, Marca, Goal.com

**Entertainment:** Variety, Hollywood Reporter, Rolling Stone, Pitchfork, Deadline, Screen Rant, IGN, Polygon, AV Club

## License

MIT
