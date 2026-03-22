# World Globe News

Interactive 3D globe news viewer — browse breaking news from around the world pinned to real locations with multi-source aggregation.

## Features

- **3D Holographic Globe** — Soft glowing orb with warm indigo atmosphere, buttery smooth rotation, dreamy ring pulses, ethereal arcs, cinematic fly-to, responsive to window resize
- **896 RSS Feed Sources** — Aggregates real-time news from 896 feeds worldwide covering every continent, major city, and niche category
- **Political Bias Indicators** — Each source labeled with bias rating (Left, Center-Left, Center, Center-Right, Right, Independent) based on AllSides/MBFC data
- **Auto-Geocoding** — Extracts locations from headlines using 70+ country codes, 100+ major cities, 50+ keyword mappings, and 35+ geographic landmarks (Strait of Hormuz, Suez Canal, Gaza Strip, Crimea, etc.)
- **News Clustering** — Jaccard similarity groups articles by topic, then geographic proximity (100km) merges nearby clusters into location groups (e.g., all Strait of Hormuz stories in one pin)
- **Breaking News Detection** — 3+ sources covering the same story triggers breaking status with pulsing ring animations
- **Expandable Source Cards** — Click any source to see article summary + political bias badge, then "Open Source" button to read the original
- **URL Search** — Paste any article URL to find similar stories being covered on the globe
- **Search by Source** — Type a source name (BBC, Reuters, CNN) in the search bar to filter by outlet
- **4 Sidebar Tabs** — USA Trending (US news ranked by sources), Trending (global), Feed (sorted/filtered), Sources (grouped by outlet)
- **USA Trending** — Filters US stories by country code + keywords (congress, senate, white house, pentagon, etc.), ranked by coverage
- **Sources Tab** — Articles grouped by news outlet with collapsible sections, bias badges, and popular source chips
- **8 Category Filters** — World, Politics, Business, Technology, Sports, Health, Science, Entertainment (dropdown menu)
- **4 Sort Modes** — Breaking First, Newest, Most Sources, Category grouping
- **Time Filters** — Last hour, 6 hours, 24 hours, or 7 days
- **Region Quick-Select** — Horizontal glass bar with fly-to buttons for Africa, Americas, Asia, Europe, Oceania, Middle East
- **Live Stats Overlay** — Floating panel showing story count, breaking count, active sources, countries covered
- **News Ticker** — Ultra-slow scrolling headlines with slide-in animation and "NEW" badge on fresh stories (30s display)
- **Update Sources** — Manual refresh triggers full RSS re-fetch (2-minute cooldown)
- **Low Performance Mode** — Toggle for slower devices: disables atmosphere, rings, arcs, reduces pins to 50
- **Holographic Comfy UI** — Frosted glass panels with inner glow, warm indigo-violet gradients, 16 animations, 2026-2030 aesthetic

## Performance

- **Globe**: Pin limit 150, ring limit 10, debounced resize, no animate-in lag
- **Server**: 20-feed concurrency limiter, 10s timeout per feed, 2-minute result caching, optimized clustering with keyword pre-computation
- **UI**: React.memo on static components, reduced backdrop-filter blur (12px), will-change on animations, memoized sorting

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
│   ├── App.tsx                    # Main app shell + client-side filtering
│   ├── main.tsx                   # Entry point
│   ├── components/
│   │   ├── Globe/
│   │   │   └── NewsGlobe.tsx      # 3D globe with pins, rings, arcs, auto-rotate
│   │   └── UI/
│   │       ├── TopBar.tsx         # Category dropdown + clock + Update Sources
│   │       ├── SearchBar.tsx      # Search by news, location, or source name
│   │       ├── NewsSidebar.tsx    # Collapsible news list + 4 sort modes + time filters
│   │       ├── NewsDetail.tsx     # Expandable source cards + bias badges + Open Source
│   │       ├── NewsTicker.tsx     # Slow-scroll ticker + NEW badge + slide-in
│   │       ├── RegionSelector.tsx # Horizontal glass fly-to bar
│   │       ├── StatsOverlay.tsx   # Live stats panel (React.memo)
│   │       └── LoadingScreen.tsx  # Animated loading overlay
│   ├── data/
│   │   ├── theme.ts              # Comfy futuristic design system + 12 animations
│   │   ├── newsSources.ts        # 50+ outlets with brand colors + political bias
│   │   ├── geoLocations.ts       # 197 countries + 189 cities
│   │   └── rssFeeds.ts           # RSS feed configs
│   ├── hooks/
│   │   ├── useStore.ts           # Zustand state management
│   │   └── useNewsFetch.ts       # Data fetching + 60s polling
│   └── types/
│       └── index.ts              # TypeScript interfaces (incl. NewsBias type)
├── server/
│   └── src/
│       └── server.js             # Express backend (896 RSS feeds, geocoding, clustering)
├── public/img/                   # Globe textures
├── Dockerfile                    # Frontend (nginx)
├── server/Dockerfile             # Backend (node)
├── docker-compose.yml
└── .github/workflows/
    └── docker-publish.yml        # CI/CD to GHCR
```

## How It Works

1. **Backend** polls 896 RSS feeds every 5 minutes (50 articles per feed, 20 concurrent, 10s timeout, 2-min cache)
2. **Geocoding** extracts locations from article titles using keyword dictionaries (cities, countries, political figures, organizations)
3. **Clustering** groups articles about the same topic using Jaccard word-set similarity (threshold 0.25) — no article cap per cluster
4. **Breaking detection** flags clusters with 3+ sources
5. **Frontend** fetches all clustered news every 60 seconds (or manually via Update Sources button)
6. **Client-side filtering** by category, search query (including source names), and time range — instant, no re-fetch
7. **Globe pins** colored by category, sized by importance, with pulsing rings for breaking stories and connection arcs for selected stories
8. **Bias indicators** shown on each source card using AllSides/MBFC-based ratings

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/news` | All clustered news with location, sources, and metadata |
| `GET /api/news/stats` | Aggregate stats (cluster count, source count, categories) |
| `GET /api/health` | Server health check |

## News Sources (896 feeds)

**Wire/US National:** Reuters, AP, CNN, Fox News, Newsmax, NBC, ABC, CBS, NPR, PBS, NYT, Washington Post, WSJ, Bloomberg, Politico, The Hill, USA Today, ProPublica, Axios, The Atlantic, Vox, Slate, Vice, Mother Jones, National Review, The Intercept, Salon, The Nation, Jacobin, Democracy Now, The Federalist, Washington Examiner, Epoch Times

**US Regional (170+):** LA Times, Chicago Tribune, Boston Globe, SF Chronicle, Seattle Times, Miami Herald, Atlanta Journal, Dallas Morning News, Detroit Free Press, Philadelphia Inquirer, Tampa Bay Times, Arizona Republic + 50 major city newspapers, NBC/ABC/Fox local stations, NPR affiliates (KQED, WNYC, WBUR, etc.)

**UK/Europe (60+):** BBC (7 feeds), Sky News, The Guardian (5 feeds), The Independent, Financial Times, Irish Times, RTE, Metro UK, Der Spiegel, France 24, EuroNews, ANSA, Swiss Info, Politico EU, EU Observer, Euractiv, Brussels Times, Dutch News, The Local (8 countries), Kyiv Independent, Baltic Times + Nordic/Eastern European outlets

**Asia-Pacific (80+):** NHK, SCMP (4 feeds), Times of India, Hindustan Times, The Hindu, NDTV (3 feeds), India Today, The Print, Straits Times, Channel News Asia, Bangkok Post, Korea Herald, Jakarta Post, Japan Times, Yonhap, Kyodo, Dawn, Rappler, The Diplomat, Asia Times, ABC Australia, NZ Herald, RNZ + Pacific Islands

**Middle East (30+):** Al Jazeera, Al Arabiya, Times of Israel, Haaretz, Gulf News, Arab News, Kurdistan 24, TRT World, Middle East Eye, Al-Monitor, Jerusalem Post, Daily Sabah, Rudaw, Asharq Al-Awsat + regional outlets

**Africa (40+):** Daily Maverick, Mail & Guardian, All Africa, Punch Nigeria, Premium Times, This Day, Business Day, The Star Kenya, News24 SA + East/West/North African outlets

**Latin America (20+):** El Universal Mexico, Folha de S.Paulo, La Nacion Argentina, El Tiempo Colombia + Caribbean outlets

**Science/Space:** Nature, Science Daily, NASA, ESA, New Scientist, Phys.org, Space.com, SpaceNews, Universe Today, Quanta Magazine, The Lancet, Science Magazine

**Technology (40+):** TechCrunch, The Verge, Ars Technica, Wired, CNET, 9to5Mac, MacRumors, Android Authority, TechRadar, Engadget, Hacker News, VentureBeat, Gizmodo, Mashable + cybersecurity (Krebs, Bleeping Computer, Dark Reading)

**Business/Finance:** CNBC, MarketWatch, Business Insider, Fortune, Forbes, Quartz, Fast Company, The Economist, Yahoo Finance, Seeking Alpha, TheStreet, Motley Fool

**Specialty:** Military/Defense (10), Legal/Justice (10), Crypto/Web3 (8), Gaming (8), Automotive (8), Energy/Climate (8), Real Estate (8), Food/Agriculture (8), Travel (8), Aviation (5), Maritime (5), Robotics (4), Biotech (4)

**Sports:** ESPN, BBC Sport, Sky Sports, CBS Sports, Marca, Goal.com, Bleacher Report

**Entertainment:** Variety, Hollywood Reporter, Rolling Stone, Pitchfork, Deadline, Screen Rant, IGN, Polygon, TMZ, People
