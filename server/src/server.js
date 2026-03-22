import express from 'express';
import cors from 'cors';
import compression from 'compression';
import fetch from 'node-fetch';
import Parser from 'rss-parser';

const app = express();
const PORT = process.env.PORT || 3009;
const rssParser = new Parser();

// ── Performance constants ────────────────────────────────────────────────────

const CONCURRENCY_LIMIT = 20;         // Max simultaneous feed fetches
const FEED_TIMEOUT_MS = 10000;        // 10s timeout per feed
const FEED_CACHE_TTL_MS = 2 * 60000;  // 2 min cache per feed
const DESC_TRUNCATE_LEN = 500;        // Max description length in output
const MIN_CLUSTER_WORDS = 5;          // Min keyword count to attempt clustering

app.use(cors());
app.use(compression());
app.use(express.json());

// ── In-memory data store ─────────────────────────────────────────────────────

let latestNews = [];
let lastFetchTime = 0;

// ── Per-feed RSS cache ───────────────────────────────────────────────────────
// Maps feed URL → { ts: Date.now(), articles: [...] }
const feedCache = new Map();

// ── Country code → capital coords mapping ────────────────────────────────────

const COUNTRY_COORDS = {
  US: { lat: 38.9, lng: -77.0, name: 'United States' },
  GB: { lat: 51.5, lng: -0.13, name: 'United Kingdom' },
  FR: { lat: 48.86, lng: 2.35, name: 'France' },
  DE: { lat: 52.52, lng: 13.41, name: 'Germany' },
  JP: { lat: 35.68, lng: 139.69, name: 'Japan' },
  CN: { lat: 39.91, lng: 116.39, name: 'China' },
  IN: { lat: 28.61, lng: 77.21, name: 'India' },
  BR: { lat: -15.79, lng: -47.88, name: 'Brazil' },
  RU: { lat: 55.76, lng: 37.62, name: 'Russia' },
  AU: { lat: -35.28, lng: 149.13, name: 'Australia' },
  CA: { lat: 45.42, lng: -75.7, name: 'Canada' },
  KR: { lat: 37.57, lng: 126.98, name: 'South Korea' },
  MX: { lat: 19.43, lng: -99.13, name: 'Mexico' },
  IT: { lat: 41.9, lng: 12.5, name: 'Italy' },
  ES: { lat: 40.42, lng: -3.7, name: 'Spain' },
  SA: { lat: 24.71, lng: 46.68, name: 'Saudi Arabia' },
  TR: { lat: 39.93, lng: 32.86, name: 'Turkey' },
  IL: { lat: 31.77, lng: 35.23, name: 'Israel' },
  PS: { lat: 31.95, lng: 35.2, name: 'Palestine' },
  UA: { lat: 50.45, lng: 30.52, name: 'Ukraine' },
  PL: { lat: 52.23, lng: 21.01, name: 'Poland' },
  ZA: { lat: -25.75, lng: 28.19, name: 'South Africa' },
  EG: { lat: 30.04, lng: 31.24, name: 'Egypt' },
  NG: { lat: 9.06, lng: 7.49, name: 'Nigeria' },
  KE: { lat: -1.29, lng: 36.82, name: 'Kenya' },
  AR: { lat: -34.6, lng: -58.38, name: 'Argentina' },
  CO: { lat: 4.71, lng: -74.07, name: 'Colombia' },
  TH: { lat: 13.76, lng: 100.5, name: 'Thailand' },
  PH: { lat: 14.6, lng: 120.98, name: 'Philippines' },
  ID: { lat: -6.21, lng: 106.85, name: 'Indonesia' },
  PK: { lat: 33.69, lng: 73.04, name: 'Pakistan' },
  IR: { lat: 35.69, lng: 51.39, name: 'Iran' },
  IQ: { lat: 33.31, lng: 44.37, name: 'Iraq' },
  SY: { lat: 33.51, lng: 36.29, name: 'Syria' },
  LB: { lat: 33.89, lng: 35.51, name: 'Lebanon' },
  AF: { lat: 34.53, lng: 69.17, name: 'Afghanistan' },
  SD: { lat: 15.6, lng: 32.53, name: 'Sudan' },
  YE: { lat: 15.37, lng: 44.21, name: 'Yemen' },
  MM: { lat: 19.76, lng: 96.07, name: 'Myanmar' },
  TW: { lat: 25.03, lng: 121.57, name: 'Taiwan' },
  SG: { lat: 1.35, lng: 103.82, name: 'Singapore' },
  NZ: { lat: -41.29, lng: 174.78, name: 'New Zealand' },
  SE: { lat: 59.33, lng: 18.07, name: 'Sweden' },
  NO: { lat: 59.91, lng: 10.75, name: 'Norway' },
  FI: { lat: 60.17, lng: 24.94, name: 'Finland' },
  NL: { lat: 52.37, lng: 4.9, name: 'Netherlands' },
  BE: { lat: 50.85, lng: 4.35, name: 'Belgium' },
  CH: { lat: 46.95, lng: 7.45, name: 'Switzerland' },
  AT: { lat: 48.21, lng: 16.37, name: 'Austria' },
  GR: { lat: 37.98, lng: 23.73, name: 'Greece' },
  PT: { lat: 38.72, lng: -9.14, name: 'Portugal' },
  IE: { lat: 53.35, lng: -6.26, name: 'Ireland' },
  CZ: { lat: 50.08, lng: 14.43, name: 'Czech Republic' },
  HU: { lat: 47.5, lng: 19.04, name: 'Hungary' },
  RO: { lat: 44.43, lng: 26.1, name: 'Romania' },
  CL: { lat: -33.45, lng: -70.67, name: 'Chile' },
  PE: { lat: -12.05, lng: -77.04, name: 'Peru' },
  VE: { lat: 10.49, lng: -66.88, name: 'Venezuela' },
  ET: { lat: 9.02, lng: 38.75, name: 'Ethiopia' },
  GH: { lat: 5.56, lng: -0.19, name: 'Ghana' },
  TZ: { lat: -6.16, lng: 35.74, name: 'Tanzania' },
  CD: { lat: -4.32, lng: 15.31, name: 'DRC' },
  HK: { lat: 22.32, lng: 114.17, name: 'Hong Kong' },
  MY: { lat: 3.14, lng: 101.69, name: 'Malaysia' },
  VN: { lat: 21.03, lng: 105.85, name: 'Vietnam' },
  BD: { lat: 23.81, lng: 90.41, name: 'Bangladesh' },
  LK: { lat: 6.93, lng: 79.85, name: 'Sri Lanka' },
  NP: { lat: 27.72, lng: 85.32, name: 'Nepal' },
  QA: { lat: 25.29, lng: 51.53, name: 'Qatar' },
  AE: { lat: 24.45, lng: 54.65, name: 'UAE' },
  KW: { lat: 29.38, lng: 47.99, name: 'Kuwait' },
  JO: { lat: 31.95, lng: 35.93, name: 'Jordan' },
  DK: { lat: 55.68, lng: 12.57, name: 'Denmark' },
};

// ── Major city keyword → coords ──────────────────────────────────────────────

const CITY_COORDS = {
  'new york': { lat: 40.71, lng: -74.01, country: 'US' },
  'los angeles': { lat: 34.05, lng: -118.24, country: 'US' },
  'washington': { lat: 38.9, lng: -77.04, country: 'US' },
  'chicago': { lat: 41.88, lng: -87.63, country: 'US' },
  'san francisco': { lat: 37.77, lng: -122.42, country: 'US' },
  'houston': { lat: 29.76, lng: -95.37, country: 'US' },
  'miami': { lat: 25.76, lng: -80.19, country: 'US' },
  'london': { lat: 51.51, lng: -0.13, country: 'GB' },
  'paris': { lat: 48.86, lng: 2.35, country: 'FR' },
  'berlin': { lat: 52.52, lng: 13.41, country: 'DE' },
  'tokyo': { lat: 35.68, lng: 139.69, country: 'JP' },
  'beijing': { lat: 39.91, lng: 116.39, country: 'CN' },
  'shanghai': { lat: 31.23, lng: 121.47, country: 'CN' },
  'moscow': { lat: 55.76, lng: 37.62, country: 'RU' },
  'mumbai': { lat: 19.08, lng: 72.88, country: 'IN' },
  'delhi': { lat: 28.61, lng: 77.21, country: 'IN' },
  'sydney': { lat: -33.87, lng: 151.21, country: 'AU' },
  'toronto': { lat: 43.65, lng: -79.38, country: 'CA' },
  'dubai': { lat: 25.2, lng: 55.27, country: 'AE' },
  'singapore': { lat: 1.35, lng: 103.82, country: 'SG' },
  'hong kong': { lat: 22.32, lng: 114.17, country: 'HK' },
  'seoul': { lat: 37.57, lng: 126.98, country: 'KR' },
  'taipei': { lat: 25.03, lng: 121.57, country: 'TW' },
  'bangkok': { lat: 13.76, lng: 100.5, country: 'TH' },
  'istanbul': { lat: 41.01, lng: 28.98, country: 'TR' },
  'rome': { lat: 41.9, lng: 12.5, country: 'IT' },
  'madrid': { lat: 40.42, lng: -3.7, country: 'ES' },
  'amsterdam': { lat: 52.37, lng: 4.9, country: 'NL' },
  'brussels': { lat: 50.85, lng: 4.35, country: 'BE' },
  'vienna': { lat: 48.21, lng: 16.37, country: 'AT' },
  'zurich': { lat: 47.38, lng: 8.54, country: 'CH' },
  'stockholm': { lat: 59.33, lng: 18.07, country: 'SE' },
  'oslo': { lat: 59.91, lng: 10.75, country: 'NO' },
  'cairo': { lat: 30.04, lng: 31.24, country: 'EG' },
  'jerusalem': { lat: 31.77, lng: 35.23, country: 'IL' },
  'tel aviv': { lat: 32.09, lng: 34.78, country: 'IL' },
  'gaza': { lat: 31.51, lng: 34.47, country: 'PS' },
  'beirut': { lat: 33.89, lng: 35.5, country: 'LB' },
  'baghdad': { lat: 33.31, lng: 44.37, country: 'IQ' },
  'tehran': { lat: 35.69, lng: 51.39, country: 'IR' },
  'kabul': { lat: 34.53, lng: 69.17, country: 'AF' },
  'kyiv': { lat: 50.45, lng: 30.52, country: 'UA' },
  'kiev': { lat: 50.45, lng: 30.52, country: 'UA' },
  'warsaw': { lat: 52.23, lng: 21.01, country: 'PL' },
  'mexico city': { lat: 19.43, lng: -99.13, country: 'MX' },
  'são paulo': { lat: -23.55, lng: -46.63, country: 'BR' },
  'sao paulo': { lat: -23.55, lng: -46.63, country: 'BR' },
  'rio de janeiro': { lat: -22.91, lng: -43.17, country: 'BR' },
  'buenos aires': { lat: -34.6, lng: -58.38, country: 'AR' },
  'bogota': { lat: 4.71, lng: -74.07, country: 'CO' },
  'lima': { lat: -12.05, lng: -77.04, country: 'PE' },
  'nairobi': { lat: -1.29, lng: 36.82, country: 'KE' },
  'lagos': { lat: 6.52, lng: 3.38, country: 'NG' },
  'johannesburg': { lat: -26.2, lng: 28.04, country: 'ZA' },
  'cape town': { lat: -33.93, lng: 18.42, country: 'ZA' },
  'riyadh': { lat: 24.71, lng: 46.68, country: 'SA' },
  'doha': { lat: 25.29, lng: 51.53, country: 'QA' },
  'kuala lumpur': { lat: 3.14, lng: 101.69, country: 'MY' },
  'jakarta': { lat: -6.21, lng: 106.85, country: 'ID' },
  'manila': { lat: 14.6, lng: 120.98, country: 'PH' },
  'hanoi': { lat: 21.03, lng: 105.85, country: 'VN' },
  'islamabad': { lat: 33.69, lng: 73.04, country: 'PK' },
  'dhaka': { lat: 23.81, lng: 90.41, country: 'BD' },
  'khartoum': { lat: 15.6, lng: 32.53, country: 'SD' },
  'addis ababa': { lat: 9.02, lng: 38.75, country: 'ET' },
  'pentagon': { lat: 38.87, lng: -77.06, country: 'US' },
  'kremlin': { lat: 55.75, lng: 37.62, country: 'RU' },
  'white house': { lat: 38.9, lng: -77.04, country: 'US' },
  'wall street': { lat: 40.71, lng: -74.01, country: 'US' },
  'silicon valley': { lat: 37.39, lng: -122.08, country: 'US' },
  'hollywood': { lat: 34.1, lng: -118.33, country: 'US' },
  'vatican': { lat: 41.9, lng: 12.45, country: 'IT' },
  'davos': { lat: 46.8, lng: 9.84, country: 'CH' },
  // Geographic landmarks, straits, waterways, regions
  'strait of hormuz': { lat: 26.57, lng: 56.25, country: 'IR' },
  'hormuz': { lat: 26.57, lng: 56.25, country: 'IR' },
  'suez canal': { lat: 30.46, lng: 32.35, country: 'EG' },
  'panama canal': { lat: 9.08, lng: -79.68, country: 'PA' },
  'strait of malacca': { lat: 2.5, lng: 101.0, country: 'MY' },
  'malacca': { lat: 2.5, lng: 101.0, country: 'MY' },
  'bosporus': { lat: 41.12, lng: 29.05, country: 'TR' },
  'dardanelles': { lat: 40.2, lng: 26.4, country: 'TR' },
  'south china sea': { lat: 15.0, lng: 115.0, country: 'CN' },
  'taiwan strait': { lat: 24.0, lng: 119.0, country: 'TW' },
  'red sea': { lat: 20.0, lng: 38.0, country: 'SA' },
  'gulf of aden': { lat: 12.5, lng: 47.0, country: 'YE' },
  'persian gulf': { lat: 26.0, lng: 52.0, country: 'IR' },
  'black sea': { lat: 43.0, lng: 35.0, country: 'TR' },
  'baltic sea': { lat: 58.0, lng: 20.0, country: 'SE' },
  'arctic': { lat: 75.0, lng: 0.0, country: 'NO' },
  'antarctica': { lat: -80.0, lng: 0.0, country: 'NZ' },
  'gaza strip': { lat: 31.35, lng: 34.31, country: 'PS' },
  'west bank': { lat: 31.95, lng: 35.2, country: 'PS' },
  'golan heights': { lat: 33.0, lng: 35.8, country: 'IL' },
  'crimea': { lat: 44.95, lng: 34.1, country: 'UA' },
  'donbas': { lat: 48.0, lng: 38.0, country: 'UA' },
  'zaporizhzhia': { lat: 47.84, lng: 35.14, country: 'UA' },
  'chernobyl': { lat: 51.39, lng: 30.1, country: 'UA' },
  'fukushima': { lat: 37.42, lng: 141.03, country: 'JP' },
  'kashmir': { lat: 34.08, lng: 74.8, country: 'IN' },
  'xinjiang': { lat: 41.0, lng: 85.0, country: 'CN' },
  'tibet': { lat: 30.0, lng: 91.0, country: 'CN' },
  'sahel': { lat: 15.0, lng: 0.0, country: 'ML' },
  'horn of africa': { lat: 8.0, lng: 45.0, country: 'SO' },
  'cape of good hope': { lat: -34.36, lng: 18.47, country: 'ZA' },
  'gibraltar': { lat: 36.14, lng: -5.35, country: 'ES' },
  'guantanamo': { lat: 19.9, lng: -75.15, country: 'CU' },
  'chagos': { lat: -6.0, lng: 71.5, country: 'GB' },
  'falklands': { lat: -51.75, lng: -59.0, country: 'GB' },
  'dmz': { lat: 38.0, lng: 127.0, country: 'KR' },
  'korean peninsula': { lat: 38.0, lng: 127.0, country: 'KR' },
};

// ── Location extraction from text ────────────────────────────────────────────

function extractLocation(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  // Check cities first (more specific)
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (lower.includes(city)) {
      const cityName = city.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
      const countryInfo = COUNTRY_COORDS[coords.country];
      return {
        lat: coords.lat,
        lng: coords.lng,
        city: cityName,
        country: countryInfo?.name || coords.country,
        countryCode: coords.country,
      };
    }
  }

  // Check country names
  for (const [code, info] of Object.entries(COUNTRY_COORDS)) {
    if (lower.includes(info.name.toLowerCase())) {
      return { lat: info.lat, lng: info.lng, country: info.name, countryCode: code };
    }
  }

  // Common keyword → country fallbacks
  const KEYWORD_MAP = {
    'trump': 'US', 'biden': 'US', 'congress': 'US', 'senate': 'US', 'fbi': 'US', 'cia': 'US', 'nasa': 'US',
    'brexit': 'GB', 'parliament': 'GB', 'king charles': 'GB', 'downing': 'GB',
    'macron': 'FR', 'elysee': 'FR',
    'putin': 'RU', 'kremlin': 'RU',
    'xi jinping': 'CN', 'ccp': 'CN',
    'modi': 'IN', 'bollywood': 'IN',
    'zelensky': 'UA', 'zelenskyy': 'UA',
    'hamas': 'PS', 'hezbollah': 'LB',
    'netanyahu': 'IL', 'idf': 'IL',
    'taliban': 'AF',
    'nato': 'BE',
    'eu': 'BE', 'european union': 'BE',
    'un': 'US', 'united nations': 'US',
    'who': 'CH', 'world health': 'CH',
    'olympic': 'FR',
    'premier league': 'GB', 'champions league': 'CH',
    'world cup': 'QA',
    'nba': 'US', 'nfl': 'US', 'mlb': 'US',
    'tesla': 'US', 'apple': 'US', 'google': 'US', 'microsoft': 'US', 'amazon': 'US', 'meta': 'US',
    'samsung': 'KR', 'sony': 'JP', 'toyota': 'JP',
    'opec': 'SA',
    'imf': 'US', 'world bank': 'US',
  };

  for (const [keyword, code] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) {
      const info = COUNTRY_COORDS[code];
      if (info) return { lat: info.lat, lng: info.lng, country: info.name, countryCode: code };
    }
  }

  return null;
}

// ── News category detection ──────────────────────────────────────────────────

const CATEGORY_KEYWORDS = {
  politics: ['president', 'election', 'congress', 'senate', 'parliament', 'minister', 'government', 'policy', 'vote', 'democrat', 'republican', 'legislation', 'diplomatic', 'ambassador'],
  business: ['stock', 'market', 'economy', 'trade', 'gdp', 'inflation', 'federal reserve', 'interest rate', 'investment', 'billion', 'million', 'revenue', 'profit', 'merger', 'acquisition', 'ipo', 'cryptocurrency', 'bitcoin'],
  technology: ['ai', 'artificial intelligence', 'tech', 'software', 'startup', 'cyber', 'robot', 'chip', 'semiconductor', 'quantum', 'blockchain', 'app', 'silicon valley', 'data', 'algorithm', 'openai', 'google', 'apple', 'microsoft', 'meta'],
  sports: ['goal', 'championship', 'tournament', 'league', 'coach', 'player', 'team', 'match', 'win', 'defeat', 'score', 'olympic', 'world cup', 'nba', 'nfl', 'premier league', 'cricket', 'tennis', 'formula 1'],
  health: ['health', 'hospital', 'disease', 'vaccine', 'pandemic', 'who', 'cancer', 'treatment', 'drug', 'clinical', 'patient', 'doctor', 'medical', 'outbreak', 'virus', 'mental health'],
  science: ['space', 'nasa', 'climate', 'research', 'study', 'discovery', 'species', 'planet', 'satellite', 'carbon', 'fossil', 'evolution', 'physics', 'biology', 'ocean', 'arctic', 'earthquake', 'volcano'],
  entertainment: ['movie', 'film', 'music', 'celebrity', 'award', 'oscar', 'grammy', 'concert', 'album', 'actor', 'actress', 'netflix', 'streaming', 'box office', 'hollywood', 'bollywood', 'festival'],
};

function detectCategory(title, description) {
  const text = `${title} ${description || ''}`.toLowerCase();
  let bestCat = 'world';
  let bestScore = 0;

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCat = cat;
    }
  }

  return bestCat;
}

// ── News clustering (group articles about same topic) ────────────────────────

function clusterArticles(articles) {
  const clusters = [];
  const used = new Set();

  // Pre-compute keywords for all articles (avoids recomputing in inner loop)
  const keywordsCache = new Array(articles.length);
  for (let i = 0; i < articles.length; i++) {
    keywordsCache[i] = getKeywords(articles[i].title);
  }

  for (let i = 0; i < articles.length; i++) {
    if (used.has(i)) continue;

    const cluster = {
      id: `cluster-${i}`,
      title: articles[i].title,
      summary: articles[i].description || articles[i].title,
      articles: [articles[i]],
      location: articles[i]._location,
      category: articles[i]._category,
      firstPublished: articles[i].publishedAt,
      lastUpdated: articles[i].publishedAt,
      isBreaking: false,
    };

    const wordsA = keywordsCache[i];

    // Skip clustering for articles with very short titles (< 5 keywords)
    // — too generic to cluster meaningfully, just leave as singleton
    if (wordsA.size >= MIN_CLUSTER_WORDS) {
      for (let j = i + 1; j < articles.length; j++) {
        if (used.has(j)) continue;

        const wordsB = keywordsCache[j];
        // Early exit: skip if the other title is also too short
        if (wordsB.size < MIN_CLUSTER_WORDS) continue;

        const similarity = jaccardSimilarity(wordsA, wordsB);

        if (similarity >= 0.25) {
          cluster.articles.push(articles[j]);
          used.add(j);

          // Update cluster timing
          if (articles[j].publishedAt < cluster.firstPublished) {
            cluster.firstPublished = articles[j].publishedAt;
          }
          if (articles[j].publishedAt > cluster.lastUpdated) {
            cluster.lastUpdated = articles[j].publishedAt;
          }
        }
      }
    }

    used.add(i);

    // Calculate importance (more sources = more important)
    const sourceCount = cluster.articles.length;
    cluster.importance = Math.min(10, sourceCount * 2);
    cluster.isBreaking = sourceCount >= 3;

    // Use best location from any article in cluster
    if (!cluster.location) {
      for (const art of cluster.articles) {
        if (art._location) {
          cluster.location = art._location;
          break;
        }
      }
    }

    clusters.push(cluster);
  }

  // Sort by importance then recency
  clusters.sort((a, b) => {
    if (b.importance !== a.importance) return b.importance - a.importance;
    return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
  });

  return clusters;
}

function getKeywords(text) {
  const STOP_WORDS = new Set(['the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'is', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had', 'it', 'its', 'this', 'that', 'with', 'from', 'by', 'as', 'but', 'not', 'no', 'will', 'can', 'could', 'would', 'should', 'may', 'might', 'about', 'after', 'before', 'over', 'under', 'between', 'new', 'says', 'said']);
  return new Set(
    text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w))
  );
}

function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  // Iterate over the smaller set for speed
  const [smaller, larger] = setA.size <= setB.size ? [setA, setB] : [setB, setA];
  for (const word of smaller) {
    if (larger.has(word)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ── Haversine distance (km) ──────────────────────────────────────────────

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ── Geographic proximity merge (second clustering pass) ──────────────────

function mergeNearbyClusters(clusters) {
  const MERGE_DISTANCE_KM = 100;
  const used = new Set();
  const merged = [];

  for (let i = 0; i < clusters.length; i++) {
    if (used.has(i)) continue;

    const group = [clusters[i]];
    used.add(i);

    for (let j = i + 1; j < clusters.length; j++) {
      if (used.has(j)) continue;
      const locA = clusters[i].location;
      const locB = clusters[j].location;
      if (!locA || !locB) continue;

      // Check distance against any cluster already in the group
      let isNear = false;
      for (const member of group) {
        const mLoc = member.location;
        if (!mLoc) continue;
        if (haversineKm(mLoc.lat, mLoc.lng, locB.lat, locB.lng) <= MERGE_DISTANCE_KM) {
          isNear = true;
          break;
        }
      }
      if (isNear) {
        group.push(clusters[j]);
        used.add(j);
      }
    }

    // If only one cluster in this location group, keep it as-is
    if (group.length === 1) {
      merged.push(group[0]);
      continue;
    }

    // Merge multiple clusters into a location group
    const allArticles = group.flatMap(c => c.articles);

    // Centroid of all cluster locations
    let sumLat = 0, sumLng = 0, locCount = 0;
    for (const c of group) {
      if (c.location) {
        sumLat += c.location.lat;
        sumLng += c.location.lng;
        locCount++;
      }
    }
    const centroidLat = locCount > 0 ? sumLat / locCount : 0;
    const centroidLng = locCount > 0 ? sumLng / locCount : 0;

    // Skip group if no valid locations at all
    if (locCount === 0) {
      for (const c of group) merged.push(c);
      continue;
    }

    // Location name: use the first cluster's location info (city or country)
    const bestLoc = group.find(c => c.location)?.location || { lat: centroidLat, lng: centroidLng, country: 'Unknown', countryCode: '' };
    const locationName = bestLoc?.city || bestLoc?.country || `${centroidLat.toFixed(1)}, ${centroidLng.toFixed(1)}`;

    // Most common category
    const catCounts = {};
    for (const c of group) {
      catCounts[c.category] = (catCounts[c.category] || 0) + 1;
    }
    let bestCat = group[0].category;
    let bestCatCount = 0;
    for (const [cat, count] of Object.entries(catCounts)) {
      if (count > bestCatCount) { bestCat = cat; bestCatCount = count; }
    }

    // Collect story titles for summary
    const storyTitles = group.map(c => c.title);
    const summary = `${group.length} stories: ${storyTitles.join(', ')}`;

    // Importance = sum capped at 10
    const totalImportance = Math.min(10, group.reduce((sum, c) => sum + c.importance, 0));

    // isBreaking if ANY cluster is breaking
    const anyBreaking = group.some(c => c.isBreaking);

    // Earliest first published, latest last updated
    const firstPublished = group.reduce((earliest, c) =>
      (!earliest || c.firstPublished < earliest) ? c.firstPublished : earliest, null);
    const lastUpdated = group.reduce((latest, c) =>
      (!latest || c.lastUpdated > latest) ? c.lastUpdated : latest, null);

    merged.push({
      id: `group-${centroidLat.toFixed(2)}-${centroidLng.toFixed(2)}`,
      title: locationName,
      summary,
      articles: allArticles,
      location: {
        ...bestLoc,
        lat: centroidLat,
        lng: centroidLng,
      },
      category: bestCat,
      importance: totalImportance,
      isBreaking: anyBreaking,
      firstPublished,
      lastUpdated,
    });
  }

  // Re-sort by importance then recency
  merged.sort((a, b) => {
    if (b.importance !== a.importance) return b.importance - a.importance;
    return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
  });

  return merged;
}

// ── RSS Feed sources ─────────────────────────────────────────────────────────

const RSS_FEEDS = [
  // ── BBC ──────────────────────────────────────────────────────────────────────
  { id: 'bbc-world', name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'world' },
  { id: 'bbc-tech', name: 'BBC Technology', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', category: 'technology' },
  { id: 'bbc-business', name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', category: 'business' },
  { id: 'bbc-science', name: 'BBC Science', url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', category: 'science' },
  { id: 'bbc-sport', name: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/rss.xml', category: 'sports' },
  { id: 'bbc-health', name: 'BBC Health', url: 'https://feeds.bbci.co.uk/news/health/rss.xml', category: 'health' },
  { id: 'bbc-entertainment', name: 'BBC Entertainment', url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml', category: 'entertainment' },

  // ── US News ──────────────────────────────────────────────────────────────────
  { id: 'cnn-top', name: 'CNN Top Stories', url: 'https://rss.cnn.com/rss/cnn_topstories.rss', category: 'world' },
  { id: 'cnn-world', name: 'CNN World', url: 'https://rss.cnn.com/rss/cnn_world.rss', category: 'world' },
  { id: 'fox-news', name: 'Fox News', url: 'https://moxie.foxnews.com/google-publisher/latest.xml', category: 'world' },
  { id: 'nbc-news', name: 'NBC News', url: 'https://feeds.nbcnews.com/nbcnews/public/news', category: 'world' },
  { id: 'abc-news', name: 'ABC News', url: 'https://feeds.abcnews.com/abcnews/usheadlines', category: 'world' },
  { id: 'cbs-world', name: 'CBS News', url: 'https://www.cbsnews.com/latest/rss/world', category: 'world' },
  { id: 'cbs-politics', name: 'CBS Politics', url: 'https://www.cbsnews.com/latest/rss/politics', category: 'politics' },
  { id: 'cbs-science', name: 'CBS Science', url: 'https://www.cbsnews.com/latest/rss/science', category: 'science' },
  { id: 'npr-world', name: 'NPR World', url: 'https://feeds.npr.org/1004/rss.xml', category: 'world' },
  { id: 'npr-politics', name: 'NPR Politics', url: 'https://feeds.npr.org/1014/rss.xml', category: 'politics' },
  { id: 'usa-today', name: 'USA Today', url: 'https://rssfeeds.usatoday.com/UsatodaycomNation-TopStories', category: 'world' },
  { id: 'politico', name: 'Politico', url: 'https://rss.politico.com/politics-news.xml', category: 'politics' },
  { id: 'the-hill', name: 'The Hill', url: 'https://thehill.com/feed/', category: 'politics' },

  // ── US Tech ──────────────────────────────────────────────────────────────────
  { id: 'techcrunch', name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'technology' },
  { id: 'the-verge', name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'technology' },
  { id: 'ars-technica', name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', category: 'technology' },
  { id: 'wired', name: 'Wired', url: 'https://www.wired.com/feed/rss', category: 'technology' },

  // ── US Business ──────────────────────────────────────────────────────────────
  { id: 'cnbc', name: 'CNBC', url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114', category: 'business' },
  { id: 'marketwatch', name: 'MarketWatch', url: 'https://feeds.marketwatch.com/marketwatch/topstories', category: 'business' },

  // ── UK ───────────────────────────────────────────────────────────────────────
  { id: 'guardian-world', name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', category: 'world' },
  { id: 'guardian-tech', name: 'The Guardian Tech', url: 'https://www.theguardian.com/technology/rss', category: 'technology' },
  { id: 'guardian-business', name: 'The Guardian Business', url: 'https://www.theguardian.com/uk/business/rss', category: 'business' },
  { id: 'guardian-sport', name: 'The Guardian Sport', url: 'https://www.theguardian.com/uk/sport/rss', category: 'sports' },
  { id: 'sky-news-world', name: 'Sky News World', url: 'https://feeds.skynews.com/feeds/rss/world.xml', category: 'world' },
  { id: 'independent-world', name: 'The Independent', url: 'https://www.independent.co.uk/news/world/rss', category: 'world' },

  // ── Europe ───────────────────────────────────────────────────────────────────
  { id: 'france24', name: 'France 24', url: 'https://www.france24.com/en/rss', category: 'world' },
  { id: 'dw', name: 'DW News', url: 'https://rss.dw.com/rdf/rss-en-all', category: 'world' },
  { id: 'euronews', name: 'EuroNews', url: 'https://www.euronews.com/rss', category: 'world' },
  { id: 'spiegel-intl', name: 'Der Spiegel International', url: 'https://www.spiegel.de/international/index.rss', category: 'world' },
  { id: 'ansa-english', name: 'ANSA English', url: 'https://www.ansa.it/english/news/rss.xml', category: 'world' },

  // ── Middle East ──────────────────────────────────────────────────────────────
  { id: 'aljazeera', name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'world' },
  { id: 'al-arabiya', name: 'Al Arabiya English', url: 'https://english.alarabiya.net/tools/rss', category: 'world' },

  // ── Asia-Pacific ─────────────────────────────────────────────────────────────
  { id: 'scmp-world', name: 'SCMP', url: 'https://www.scmp.com/rss/5/feed', category: 'world' },
  { id: 'toi', name: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', category: 'world' },
  { id: 'nikkei-asia', name: 'Nikkei Asia', url: 'https://asia.nikkei.com/rss', category: 'business' },
  { id: 'japan-times', name: 'Japan Times', url: 'https://www.japantimes.co.jp/feed/', category: 'world' },
  { id: 'yonhap', name: 'Yonhap News', url: 'https://en.yna.co.kr/RSS/news.xml', category: 'world' },

  // ── Africa ───────────────────────────────────────────────────────────────────
  { id: 'news24-sa', name: 'News24 South Africa', url: 'https://feeds.24.com/articles/news24/TopStories/rss', category: 'world' },
  { id: 'nation-kenya', name: 'Daily Nation Kenya', url: 'https://nation.africa/service/rss/feeds/news.rss', category: 'world' },

  // ── Science & Health ─────────────────────────────────────────────────────────
  { id: 'nature', name: 'Nature News', url: 'https://www.nature.com/nature.rss', category: 'science' },
  { id: 'science-daily', name: 'Science Daily', url: 'https://www.sciencedaily.com/rss/all.rss', category: 'science' },
  { id: 'who-news', name: 'WHO News', url: 'https://www.who.int/rss-feeds/news-english.xml', category: 'health' },

  // ── Sports ───────────────────────────────────────────────────────────────────
  { id: 'espn', name: 'ESPN', url: 'https://www.espn.com/espn/rss/news', category: 'sports' },

  // ── More US News ──────────────────────────────────────────────────────────
  { id: 'pbs-newshour', name: 'PBS NewsHour', url: 'https://www.pbs.org/newshour/feeds/rss/headlines', category: 'world' },
  { id: 'propublica', name: 'ProPublica', url: 'https://feeds.propublica.org/propublica/main', category: 'politics' },
  { id: 'axios', name: 'Axios', url: 'https://api.axios.com/feed/', category: 'world' },
  { id: 'the-atlantic', name: 'The Atlantic', url: 'https://www.theatlantic.com/feed/all/', category: 'world' },
  { id: 'slate', name: 'Slate', url: 'https://slate.com/feeds/all.rss', category: 'world' },
  { id: 'vox', name: 'Vox', url: 'https://www.vox.com/rss/index.xml', category: 'world' },
  { id: 'vice-news', name: 'Vice News', url: 'https://www.vice.com/en/rss', category: 'world' },
  { id: 'buzzfeed-world', name: 'BuzzFeed News', url: 'https://www.buzzfeed.com/world.xml', category: 'world' },
  { id: 'csmonitor', name: 'Christian Science Monitor', url: 'https://rss.csmonitor.com/feeds/world', category: 'world' },
  { id: 'nyt-world', name: 'New York Times World', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', category: 'world' },
  { id: 'nyt-politics', name: 'New York Times Politics', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml', category: 'politics' },
  { id: 'nyt-business', name: 'New York Times Business', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', category: 'business' },
  { id: 'nyt-tech', name: 'New York Times Tech', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', category: 'technology' },
  { id: 'nyt-science', name: 'New York Times Science', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Science.xml', category: 'science' },
  { id: 'washpost-world', name: 'Washington Post World', url: 'https://feeds.washingtonpost.com/rss/world', category: 'world' },
  { id: 'washpost-politics', name: 'Washington Post Politics', url: 'https://feeds.washingtonpost.com/rss/politics', category: 'politics' },

  // ── More UK/Europe ────────────────────────────────────────────────────────
  { id: 'irish-times', name: 'Irish Times', url: 'https://www.irishtimes.com/cmlink/news-1.1319192', category: 'world' },
  { id: 'swissinfo', name: 'Swiss Info', url: 'https://www.swissinfo.ch/eng/rss/all', category: 'world' },
  { id: 'politico-eu', name: 'Politico EU', url: 'https://www.politico.eu/rss', category: 'politics' },
  { id: 'rte-news', name: 'RTE News', url: 'https://www.rte.ie/news/rss/news-headlines.xml', category: 'world' },
  { id: 'the-local-de', name: 'The Local Germany', url: 'https://feeds.thelocal.com/rss/de', category: 'world' },
  { id: 'the-local-fr', name: 'The Local France', url: 'https://feeds.thelocal.com/rss/fr', category: 'world' },
  { id: 'the-local-es', name: 'The Local Spain', url: 'https://feeds.thelocal.com/rss/es', category: 'world' },
  { id: 'the-local-it', name: 'The Local Italy', url: 'https://feeds.thelocal.com/rss/it', category: 'world' },
  { id: 'the-local-se', name: 'The Local Sweden', url: 'https://feeds.thelocal.com/rss/se', category: 'world' },
  { id: 'guardian-science', name: 'The Guardian Science', url: 'https://www.theguardian.com/science/rss', category: 'science' },
  { id: 'guardian-environment', name: 'The Guardian Environment', url: 'https://www.theguardian.com/environment/rss', category: 'science' },
  { id: 'bbc-politics', name: 'BBC UK Politics', url: 'https://feeds.bbci.co.uk/news/politics/rss.xml', category: 'politics' },

  // ── More Asia ─────────────────────────────────────────────────────────────
  { id: 'channel-news-asia', name: 'Channel News Asia', url: 'https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml', category: 'world' },
  { id: 'bangkok-post', name: 'Bangkok Post', url: 'https://www.bangkokpost.com/rss/data/topstories.xml', category: 'world' },
  { id: 'korea-herald', name: 'Korea Herald', url: 'http://www.koreaherald.com/common/rss_xml.php?ct=102', category: 'world' },
  { id: 'jakarta-post', name: 'Jakarta Post', url: 'https://www.thejakartapost.com/feed', category: 'world' },
  { id: 'scmp-china', name: 'SCMP China', url: 'https://www.scmp.com/rss/4/feed', category: 'world' },
  { id: 'dawn-pakistan', name: 'Dawn Pakistan', url: 'https://www.dawn.com/feed', category: 'world' },
  { id: 'hindustan-times', name: 'Hindustan Times', url: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml', category: 'world' },
  { id: 'the-hindu', name: 'The Hindu', url: 'https://www.thehindu.com/news/national/feeder/default.rss', category: 'world' },
  { id: 'straits-times', name: 'Straits Times', url: 'https://www.straitstimes.com/news/world/rss.xml', category: 'world' },
  { id: 'abc-australia', name: 'ABC Australia', url: 'https://www.abc.net.au/news/feed/1948/rss.xml', category: 'world' },

  // ── Middle East / Africa ──────────────────────────────────────────────────
  { id: 'middle-east-eye', name: 'Middle East Eye', url: 'https://www.middleeasteye.net/rss', category: 'world' },
  { id: 'the-national-uae', name: 'The National UAE', url: 'https://www.thenationalnews.com/rss', category: 'world' },
  { id: 'daily-maverick', name: 'Daily Maverick', url: 'https://www.dailymaverick.co.za/article/feed/', category: 'world' },
  { id: 'allafrica', name: 'All Africa', url: 'https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf', category: 'world' },
  { id: 'punch-nigeria', name: 'Punch Nigeria', url: 'https://punchng.com/feed/', category: 'world' },

  // ── Latin America ─────────────────────────────────────────────────────────
  { id: 'mercopress', name: 'Merco Press', url: 'https://en.mercopress.com/rss', category: 'world' },

  // ── Science / Tech / Health ───────────────────────────────────────────────
  { id: 'new-scientist', name: 'New Scientist', url: 'https://www.newscientist.com/feed/home', category: 'science' },
  { id: 'phys-org', name: 'Phys.org', url: 'https://phys.org/rss-feed/', category: 'science' },
  { id: 'medical-news-today', name: 'Medical News Today', url: 'https://www.medicalnewstoday.com/newsfeeds/rss', category: 'health' },
  { id: 'live-science', name: 'Live Science', url: 'https://www.livescience.com/feeds/all', category: 'science' },
  { id: 'space-com', name: 'Space.com', url: 'https://www.space.com/feeds/all', category: 'science' },
  { id: 'mit-tech-review', name: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/', category: 'technology' },
  { id: 'zdnet', name: 'ZDNet', url: 'https://www.zdnet.com/news/rss.xml', category: 'technology' },
  { id: 'engadget', name: 'Engadget', url: 'https://www.engadget.com/rss.xml', category: 'technology' },
  { id: 'hacker-news', name: 'Hacker News', url: 'https://hnrss.org/frontpage', category: 'technology' },

  // ── Business / Finance ────────────────────────────────────────────────────
  { id: 'business-insider', name: 'Business Insider', url: 'https://www.businessinsider.com/rss', category: 'business' },
  { id: 'fortune', name: 'Fortune', url: 'https://fortune.com/feed/', category: 'business' },
  { id: 'inc', name: 'Inc', url: 'https://www.inc.com/rss/', category: 'business' },
  { id: 'investopedia', name: 'Investopedia', url: 'https://www.investopedia.com/feedbuilder/feed/getfeed?feedName=rss_headline', category: 'business' },
  { id: 'reuters-business', name: 'Reuters Business', url: 'https://www.reutersagency.com/feed/?best-topics=business-finance', category: 'business' },
  { id: 'bloomberg-markets', name: 'Bloomberg Markets', url: 'https://feeds.bloomberg.com/markets/news.rss', category: 'business' },

  // ── More Sports ───────────────────────────────────────────────────────────
  { id: 'sky-sports', name: 'Sky Sports', url: 'https://www.skysports.com/rss/12040', category: 'sports' },
  { id: 'bbc-sport-football', name: 'BBC Sport Football', url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', category: 'sports' },
  { id: 'bbc-sport-cricket', name: 'BBC Sport Cricket', url: 'https://feeds.bbci.co.uk/sport/cricket/rss.xml', category: 'sports' },
  { id: 'guardian-football', name: 'The Guardian Football', url: 'https://www.theguardian.com/football/rss', category: 'sports' },

  // ── Entertainment ─────────────────────────────────────────────────────────
  { id: 'variety', name: 'Variety', url: 'https://variety.com/feed/', category: 'entertainment' },
  { id: 'hollywood-reporter', name: 'Hollywood Reporter', url: 'https://www.hollywoodreporter.com/feed/', category: 'entertainment' },
  { id: 'rolling-stone', name: 'Rolling Stone', url: 'https://www.rollingstone.com/feed/', category: 'entertainment' },
  { id: 'pitchfork', name: 'Pitchfork', url: 'https://pitchfork.com/feed/feed-news/rss', category: 'entertainment' },
  { id: 'deadline', name: 'Deadline', url: 'https://deadline.com/feed/', category: 'entertainment' },

  // ── Additional US National/Local ────────────────────────────────────────────
  { id: 'ap-news-top', name: 'AP News Top', url: 'https://rsshub.app/apnews/topics/apf-topnews', category: 'world' },
  { id: 'reuters-world', name: 'Reuters World', url: 'https://www.reutersagency.com/feed/', category: 'world' },
  { id: 'star-tribune', name: 'Star Tribune', url: 'https://www.startribune.com/nation/rss/', category: 'world' },
  { id: 'denver-post', name: 'Denver Post', url: 'https://www.denverpost.com/feed/', category: 'world' },
  { id: 'chicago-tribune', name: 'Chicago Tribune', url: 'https://www.chicagotribune.com/arcio/rss/', category: 'world' },
  { id: 'la-times', name: 'LA Times', url: 'https://www.latimes.com/world-nation/rss2.0.xml', category: 'world' },
  { id: 'boston-globe', name: 'Boston Globe', url: 'https://www.bostonglobe.com/arc/outboundfeeds/rss/?outputType=xml', category: 'world' },
  { id: 'ny-post', name: 'NY Post', url: 'https://nypost.com/feed/', category: 'world' },
  { id: 'daily-beast', name: 'Daily Beast', url: 'https://feeds.thedailybeast.com/rss/articles', category: 'world' },
  { id: 'the-intercept', name: 'The Intercept', url: 'https://theintercept.com/feed/', category: 'politics' },
  { id: 'reason', name: 'Reason', url: 'https://reason.com/feed/', category: 'politics' },
  { id: 'mother-jones', name: 'Mother Jones', url: 'https://www.motherjones.com/feed/', category: 'politics' },
  { id: 'national-review', name: 'National Review', url: 'https://www.nationalreview.com/feed/', category: 'politics' },
  { id: 'the-week', name: 'The Week', url: 'https://theweek.com/rss', category: 'world' },

  // ── Canada ──────────────────────────────────────────────────────────────────
  { id: 'cbc-news', name: 'CBC News', url: 'https://www.cbc.ca/cmlink/rss-topstories', category: 'world' },
  { id: 'globe-and-mail', name: 'Globe and Mail', url: 'https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/world/', category: 'world' },
  { id: 'ctv-news', name: 'CTV News', url: 'https://www.ctvnews.ca/rss/ctvnews-ca-top-stories-public-rss-1.822009', category: 'world' },
  { id: 'national-post', name: 'National Post', url: 'https://nationalpost.com/feed/', category: 'world' },

  // ── UK/Ireland ──────────────────────────────────────────────────────────────
  { id: 'metro-uk', name: 'Metro UK', url: 'https://metro.co.uk/feed/', category: 'world' },
  { id: 'mirror-uk', name: 'Mirror', url: 'https://www.mirror.co.uk/news/rss.xml', category: 'world' },
  { id: 'evening-standard', name: 'Evening Standard', url: 'https://www.standard.co.uk/rss', category: 'world' },
  { id: 'belfast-telegraph', name: 'Belfast Telegraph', url: 'https://www.belfasttelegraph.co.uk/rss/', category: 'world' },

  // ── Additional Europe ───────────────────────────────────────────────────────
  { id: 'the-local-no', name: 'The Local Norway', url: 'https://www.thelocal.no/feeds/rss.php', category: 'world' },
  { id: 'balkan-insight', name: 'Balkan Insight', url: 'https://balkaninsight.com/feed/', category: 'world' },
  { id: 'eu-observer', name: 'EU Observer', url: 'https://euobserver.com/rss.xml', category: 'politics' },
  { id: 'dw-africa', name: 'DW Africa', url: 'https://rss.dw.com/rdf/rss-en-af', category: 'world' },
  { id: 'dw-asia', name: 'DW Asia', url: 'https://rss.dw.com/rdf/rss-en-asia', category: 'world' },

  // ── Additional Asia ─────────────────────────────────────────────────────────
  { id: 'kyodo-news', name: 'Kyodo News', url: 'https://english.kyodonews.net/rss/all.xml', category: 'world' },
  { id: 'taipei-times', name: 'Taipei Times', url: 'https://www.taipeitimes.com/xml/index.rss', category: 'world' },
  { id: 'vietnam-news', name: 'Vietnam News', url: 'https://vietnamnews.vn/rss/all-news.rss', category: 'world' },
  { id: 'the-diplomat', name: 'The Diplomat', url: 'https://thediplomat.com/feed/', category: 'world' },
  { id: 'asia-times', name: 'Asia Times', url: 'https://asiatimes.com/feed/', category: 'world' },

  // ── Middle East ─────────────────────────────────────────────────────────────
  { id: 'times-of-israel', name: 'Times of Israel', url: 'https://www.timesofisrael.com/feed/', category: 'world' },
  { id: 'kurdistan24', name: 'Kurdistan 24', url: 'https://www.kurdistan24.net/en/rss', category: 'world' },
  { id: 'gulf-news', name: 'Gulf News', url: 'https://gulfnews.com/rss', category: 'world' },
  { id: 'arab-news', name: 'Arab News', url: 'https://www.arabnews.com/rss.xml', category: 'world' },

  // ── Additional Africa ───────────────────────────────────────────────────────
  { id: 'the-east-african', name: 'The East African', url: 'https://www.theeastafrican.co.ke/tea/rss', category: 'world' },
  { id: 'mail-guardian', name: 'Mail & Guardian', url: 'https://mg.co.za/feed/', category: 'world' },
  { id: 'sahara-reporters', name: 'Sahara Reporters', url: 'http://saharareporters.com/feed', category: 'world' },
  { id: 'the-citizen-tz', name: 'The Citizen TZ', url: 'https://www.thecitizen.co.tz/feed', category: 'world' },

  // ── Latin America ───────────────────────────────────────────────────────────
  { id: 'rio-times', name: 'The Rio Times', url: 'https://riotimesonline.com/feed/', category: 'world' },
  { id: 'tico-times', name: 'Tico Times', url: 'https://ticotimes.net/feed', category: 'world' },

  // ── Oceania ─────────────────────────────────────────────────────────────────
  { id: 'abc-australia-2', name: 'ABC Australia News', url: 'https://www.abc.net.au/news/feed/2942460/rss.xml', category: 'world' },
  { id: 'nz-herald', name: 'NZ Herald', url: 'https://www.nzherald.co.nz/arc/outboundfeeds/rss/curated/78/?outputType=xml', category: 'world' },
  { id: 'rnz', name: 'RNZ', url: 'https://www.rnz.co.nz/rss/national.xml', category: 'world' },
  { id: 'stuff-nz', name: 'Stuff NZ', url: 'https://www.stuff.co.nz/rss', category: 'world' },

  // ── Science/Environment ─────────────────────────────────────────────────────
  { id: 'nasa-breaking', name: 'NASA Breaking News', url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss', category: 'science' },
  { id: 'esa-science', name: 'ESA Space Science', url: 'https://www.esa.int/rssfeed/Our_Activities/Space_Science', category: 'science' },
  { id: 'carbon-brief', name: 'Carbon Brief', url: 'https://www.carbonbrief.org/feed', category: 'science' },
  { id: 'the-conversation', name: 'The Conversation', url: 'https://theconversation.com/us/articles.atom', category: 'science' },
  { id: 'ars-technica-science', name: 'Ars Technica Science', url: 'https://feeds.arstechnica.com/arstechnica/science', category: 'science' },

  // ── Additional Tech ─────────────────────────────────────────────────────────
  { id: '9to5mac', name: '9to5Mac', url: 'https://9to5mac.com/feed/', category: 'technology' },
  { id: 'android-central', name: 'Android Central', url: 'https://www.androidcentral.com/feed', category: 'technology' },
  { id: 'toms-hardware', name: "Tom's Hardware", url: 'https://www.tomshardware.com/feeds/all', category: 'technology' },
  { id: 'protocol', name: 'Protocol', url: 'https://www.protocol.com/feeds/feed.rss', category: 'technology' },
  { id: 'rest-of-world', name: 'Rest of World', url: 'https://restofworld.org/feed/', category: 'technology' },

  // ── Health ──────────────────────────────────────────────────────────────────
  { id: 'stat-news', name: 'Stat News', url: 'https://www.statnews.com/feed/', category: 'health' },
  { id: 'kaiser-health', name: 'Kaiser Health News', url: 'https://khn.org/feed/', category: 'health' },
  { id: 'webmd', name: 'WebMD', url: 'https://rssfeeds.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC', category: 'health' },

  // ── Additional Business ─────────────────────────────────────────────────────
  { id: 'quartz', name: 'Quartz', url: 'https://qz.com/feed', category: 'business' },
  { id: 'fast-company', name: 'Fast Company', url: 'https://www.fastcompany.com/latest/rss', category: 'business' },

  // ── Additional Sports ───────────────────────────────────────────────────────
  { id: 'marca-english', name: 'Marca English', url: 'https://www.marca.com/en/rss/portada.xml', category: 'sports' },
  { id: 'goal-com', name: 'Goal.com', url: 'https://www.goal.com/feeds/en/news', category: 'sports' },

  // ── Entertainment/Culture ───────────────────────────────────────────────────
  { id: 'av-club', name: 'AV Club', url: 'https://www.avclub.com/rss', category: 'entertainment' },
  { id: 'consequence-of-sound', name: 'Consequence of Sound', url: 'https://consequence.net/feed/', category: 'entertainment' },
  { id: 'screen-rant', name: 'Screen Rant', url: 'https://screenrant.com/feed/', category: 'entertainment' },
  { id: 'ign', name: 'IGN', url: 'https://feeds.feedburner.com/ign/all', category: 'entertainment' },
  { id: 'polygon', name: 'Polygon', url: 'https://www.polygon.com/rss/index.xml', category: 'entertainment' },

  // ── Additional Global Sources ───────────────────────────────────────────────
  { id: 'bbc-africa', name: 'BBC Africa', url: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml', category: 'world' },
  { id: 'bbc-asia', name: 'BBC Asia', url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml', category: 'world' },
  { id: 'bbc-europe', name: 'BBC Europe', url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml', category: 'world' },
  { id: 'bbc-latin-america', name: 'BBC Latin America', url: 'https://feeds.bbci.co.uk/news/world/latin_america/rss.xml', category: 'world' },
  { id: 'bbc-middle-east', name: 'BBC Middle East', url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml', category: 'world' },
  { id: 'bbc-us-canada', name: 'BBC US & Canada', url: 'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml', category: 'world' },
  { id: 'guardian-us', name: 'The Guardian US', url: 'https://www.theguardian.com/us-news/rss', category: 'world' },
  { id: 'guardian-australia', name: 'The Guardian Australia', url: 'https://www.theguardian.com/au/rss', category: 'world' },
  { id: 'cnn-politics', name: 'CNN Politics', url: 'https://rss.cnn.com/rss/cnn_allpolitics.rss', category: 'politics' },
  { id: 'cnn-tech', name: 'CNN Tech', url: 'https://rss.cnn.com/rss/cnn_tech.rss', category: 'technology' },
  { id: 'cnn-health', name: 'CNN Health', url: 'https://rss.cnn.com/rss/cnn_health.rss', category: 'health' },
  { id: 'cnn-entertainment', name: 'CNN Entertainment', url: 'https://rss.cnn.com/rss/cnn_showbiz.rss', category: 'entertainment' },
  { id: 'nyt-health', name: 'New York Times Health', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Health.xml', category: 'health' },
  { id: 'nyt-sports', name: 'New York Times Sports', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml', category: 'sports' },
  { id: 'nyt-arts', name: 'New York Times Arts', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml', category: 'entertainment' },
  { id: 'nyt-climate', name: 'New York Times Climate', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Climate.xml', category: 'science' },
  { id: 'washpost-tech', name: 'Washington Post Tech', url: 'https://feeds.washingtonpost.com/rss/business/technology', category: 'technology' },
  { id: 'washpost-climate', name: 'Washington Post Climate', url: 'https://feeds.washingtonpost.com/rss/climate-environment', category: 'science' },
  { id: 'npr-science', name: 'NPR Science', url: 'https://feeds.npr.org/1007/rss.xml', category: 'science' },
  { id: 'npr-health', name: 'NPR Health', url: 'https://feeds.npr.org/1128/rss.xml', category: 'health' },
  { id: 'npr-technology', name: 'NPR Technology', url: 'https://feeds.npr.org/1019/rss.xml', category: 'technology' },
  { id: 'npr-business', name: 'NPR Business', url: 'https://feeds.npr.org/1006/rss.xml', category: 'business' },
  { id: 'reuters-tech', name: 'Reuters Tech', url: 'https://www.reutersagency.com/feed/?best-topics=tech', category: 'technology' },
  { id: 'france24-europe', name: 'France 24 Europe', url: 'https://www.france24.com/en/europe/rss', category: 'world' },
  { id: 'france24-africa', name: 'France 24 Africa', url: 'https://www.france24.com/en/africa/rss', category: 'world' },
  { id: 'france24-middle-east', name: 'France 24 Middle East', url: 'https://www.france24.com/en/middle-east/rss', category: 'world' },
  { id: 'france24-asia', name: 'France 24 Asia', url: 'https://www.france24.com/en/asia-pacific/rss', category: 'world' },
  { id: 'france24-americas', name: 'France 24 Americas', url: 'https://www.france24.com/en/americas/rss', category: 'world' },
  { id: 'al-jazeera-us-canada', name: 'Al Jazeera US/Canada', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'world' },
  { id: 'ndtv', name: 'NDTV', url: 'https://feeds.feedburner.com/ndtvnews-top-stories', category: 'world' },
  { id: 'indian-express', name: 'Indian Express', url: 'https://indianexpress.com/feed/', category: 'world' },
  { id: 'manila-bulletin', name: 'Manila Bulletin', url: 'https://mb.com.ph/feed/', category: 'world' },
  { id: 'inquirer-ph', name: 'Philippine Inquirer', url: 'https://newsinfo.inquirer.net/feed', category: 'world' },
  { id: 'scmp-asia', name: 'SCMP Asia', url: 'https://www.scmp.com/rss/6/feed', category: 'world' },
  { id: 'scmp-tech', name: 'SCMP Tech', url: 'https://www.scmp.com/rss/36/feed', category: 'technology' },
  { id: 'trt-world', name: 'TRT World', url: 'https://www.trtworld.com/rss', category: 'world' },
  { id: 'haaretz', name: 'Haaretz', url: 'https://www.haaretz.com/cmlink/1.628752', category: 'world' },
  { id: 'vanguard-nigeria', name: 'Vanguard Nigeria', url: 'https://www.vanguardngr.com/feed/', category: 'world' },
  { id: 'premium-times-ng', name: 'Premium Times Nigeria', url: 'https://www.premiumtimesng.com/feed', category: 'world' },
  { id: 'citizen-sa', name: 'The Citizen SA', url: 'https://www.citizen.co.za/feed/', category: 'world' },
  { id: 'monitor-ug', name: 'Daily Monitor Uganda', url: 'https://www.monitor.co.ug/resource/rss/691150', category: 'world' },
  { id: 'mexico-news-daily', name: 'Mexico News Daily', url: 'https://mexiconewsdaily.com/feed/', category: 'world' },
  { id: 'brazil-reports', name: 'The Brazilian Report', url: 'https://brazilian.report/feed/', category: 'world' },
  { id: 'colombia-reports', name: 'Colombia Reports', url: 'https://colombiareports.com/feed/', category: 'world' },
  { id: 'forbes', name: 'Forbes', url: 'https://www.forbes.com/innovation/feed2', category: 'business' },
  { id: 'economist-world', name: 'The Economist World', url: 'https://www.economist.com/the-world-this-week/rss.xml', category: 'world' },
  { id: 'foreign-affairs', name: 'Foreign Affairs', url: 'https://www.foreignaffairs.com/rss.xml', category: 'politics' },
  { id: 'foreign-policy', name: 'Foreign Policy', url: 'https://foreignpolicy.com/feed/', category: 'politics' },
  { id: 'defense-one', name: 'Defense One', url: 'https://www.defenseone.com/rss/', category: 'politics' },
  { id: 'cnet', name: 'CNET', url: 'https://www.cnet.com/rss/news/', category: 'technology' },
  { id: 'the-register', name: 'The Register', url: 'https://www.theregister.com/headlines.atom', category: 'technology' },
  { id: 'verge-science', name: 'The Verge Science', url: 'https://www.theverge.com/rss/science/index.xml', category: 'science' },
  { id: 'smithsonian', name: 'Smithsonian Magazine', url: 'https://www.smithsonianmag.com/rss/latest_articles/', category: 'science' },
  { id: 'nat-geo', name: 'National Geographic', url: 'https://www.nationalgeographic.com/feed', category: 'science' },
  { id: 'sci-american', name: 'Scientific American', url: 'http://rss.sciam.com/ScientificAmerican-Global', category: 'science' },
  { id: 'health-news-bbc', name: 'BBC Health News', url: 'https://feeds.bbci.co.uk/news/health/rss.xml', category: 'health' },
  { id: 'espn-soccer', name: 'ESPN Soccer', url: 'https://www.espn.com/espn/rss/soccer/news', category: 'sports' },
  { id: 'nfl-news', name: 'NFL News', url: 'https://www.nfl.com/rss/rsslanding?searchString=home', category: 'sports' },
  { id: 'bleacher-report', name: 'Bleacher Report', url: 'https://bleacherreport.com/articles/feed', category: 'sports' },
  { id: 'e-online', name: 'E! Online', url: 'https://www.eonline.com/syndication/feeds/rssfeeds/topstories.xml', category: 'entertainment' },
  { id: 'entertainment-weekly', name: 'Entertainment Weekly', url: 'https://ew.com/feed/', category: 'entertainment' },
  { id: 'nme', name: 'NME', url: 'https://www.nme.com/feed', category: 'entertainment' },
  { id: 'gamespot', name: 'GameSpot', url: 'https://www.gamespot.com/feeds/mashup/', category: 'entertainment' },

  // ── US Conservative/Right-leaning ──────────────────────────────────────────
  { id: 'newsmax', name: 'Newsmax', url: 'https://www.newsmax.com/rss/Newsfront/1/', category: 'politics' },
  { id: 'newsmax-world', name: 'Newsmax World', url: 'https://www.newsmax.com/rss/World/4/', category: 'world' },
  { id: 'washington-examiner', name: 'Washington Examiner', url: 'https://www.washingtonexaminer.com/section/news/feed', category: 'politics' },
  { id: 'epoch-times', name: 'The Epoch Times', url: 'https://www.theepochtimes.com/c-us/feed', category: 'politics' },
  { id: 'the-federalist', name: 'The Federalist', url: 'https://thefederalist.com/feed/', category: 'politics' },
  { id: 'free-beacon', name: 'Washington Free Beacon', url: 'https://freebeacon.com/feed/', category: 'politics' },

  // ── US Liberal/Left-leaning ────────────────────────────────────────────────
  { id: 'salon', name: 'Salon', url: 'https://www.salon.com/feed/', category: 'politics' },
  { id: 'the-nation', name: 'The Nation', url: 'https://www.thenation.com/feed/', category: 'politics' },
  { id: 'jacobin', name: 'Jacobin', url: 'https://jacobin.com/feed/', category: 'politics' },
  { id: 'common-dreams', name: 'Common Dreams', url: 'https://www.commondreams.org/feeds/feed/news', category: 'politics' },
  { id: 'democracy-now', name: 'Democracy Now', url: 'https://www.democracynow.org/democracynow.rss', category: 'politics' },

  // ── International (additional) ─────────────────────────────────────────────
  { id: 'rt-news', name: 'RT News', url: 'https://www.rt.com/rss/news/', category: 'world' },
  { id: 'press-tv', name: 'Press TV', url: 'https://www.presstv.ir/RSS', category: 'world' },
  { id: 'cgtn', name: 'CGTN', url: 'https://www.cgtn.com/feed/rss', category: 'world' },
  { id: 'anadolu-agency', name: 'Anadolu Agency', url: 'https://www.aa.com.tr/en/rss/default?cat=world', category: 'world' },
  { id: 'bernama', name: 'Bernama', url: 'https://www.bernama.com/en/rss/general.xml', category: 'world' },
  { id: 'scmp-hk', name: 'SCMP Hong Kong', url: 'https://www.scmp.com/rss/2/feed', category: 'world' },

  // ── Tech (additional) ──────────────────────────────────────────────────────
  { id: 'gizmodo', name: 'Gizmodo', url: 'https://gizmodo.com/rss', category: 'technology' },
  { id: 'mashable', name: 'Mashable', url: 'https://mashable.com/feeds/rss/all', category: 'technology' },
  { id: 'venturebeat', name: 'VentureBeat', url: 'https://venturebeat.com/feed/', category: 'technology' },
  { id: 'techmeme', name: 'Techmeme', url: 'https://www.techmeme.com/feed.xml', category: 'technology' },

  // ── Business (additional) ──────────────────────────────────────────────────
  { id: 'yahoo-finance', name: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/rssurl', category: 'business' },
  { id: 'seeking-alpha', name: 'Seeking Alpha', url: 'https://seekingalpha.com/feed.xml', category: 'business' },

  // ── Sports (additional) ────────────────────────────────────────────────────
  { id: 'cbs-sports', name: 'CBS Sports', url: 'https://www.cbssports.com/rss/headlines/', category: 'sports' },

  // ── Entertainment (additional) ─────────────────────────────────────────────
  { id: 'tmz', name: 'TMZ', url: 'https://www.tmz.com/rss.xml', category: 'entertainment' },
  { id: 'people-magazine', name: 'People Magazine', url: 'https://people.com/feed/', category: 'entertainment' },

  // ── Africa (expanded) ──────────────────────────────────────────────────────
  { id: 'thisday-nigeria', name: 'This Day Nigeria', url: 'https://www.thisdaylive.com/feed', category: 'world' },
  { id: 'businessday-nigeria', name: 'Business Day Nigeria', url: 'https://businessday.ng/feed/', category: 'business' },
  { id: 'the-star-kenya', name: 'The Star Kenya', url: 'https://www.the-star.co.ke/rss', category: 'world' },
  { id: 'capital-fm-kenya', name: 'Capital FM Kenya', url: 'https://www.capitalfm.co.ke/news/feed/', category: 'world' },
  { id: 'iol-south-africa', name: 'IOL South Africa', url: 'https://www.iol.co.za/rss', category: 'world' },
  { id: 'timeslive-sa', name: 'Times Live SA', url: 'https://www.timeslive.co.za/rss', category: 'world' },
  { id: 'new-times-rwanda', name: 'New Times Rwanda', url: 'https://www.newtimes.co.rw/feed', category: 'world' },
  { id: 'herald-zimbabwe', name: 'The Herald Zimbabwe', url: 'https://www.herald.co.zw/feed/', category: 'world' },
  { id: 'morocco-world-news', name: 'Morocco World News', url: 'https://www.moroccoworldnews.com/feed', category: 'world' },
  { id: 'libya-observer', name: 'Libya Observer', url: 'https://www.libyaobserver.ly/feed', category: 'world' },
  { id: 'tunisia-live', name: 'Tunisia Live', url: 'https://www.tunisia-live.net/feed', category: 'world' },
  { id: 'reporter-ethiopia', name: 'The Reporter Ethiopia', url: 'https://www.thereporterethiopia.com/feed', category: 'world' },
  { id: 'graphic-ghana', name: 'Graphic Online Ghana', url: 'https://www.graphic.com.gh/feed', category: 'world' },
  { id: 'observer-ghana', name: 'Ghana Business News', url: 'https://www.ghanabusinessnews.com/feed/', category: 'business' },
  { id: 'daily-trust-ng', name: 'Daily Trust Nigeria', url: 'https://dailytrust.com/feed', category: 'world' },
  { id: 'guardian-ng', name: 'The Guardian Nigeria', url: 'https://guardian.ng/feed/', category: 'world' },
  { id: 'leadership-ng', name: 'Leadership Nigeria', url: 'https://leadership.ng/feed/', category: 'world' },
  { id: 'independent-ug', name: 'The Independent Uganda', url: 'https://www.independent.co.ug/feed/', category: 'world' },
  { id: 'observer-ug', name: 'The Observer Uganda', url: 'https://observer.ug/feed', category: 'world' },
  { id: 'standard-media-ke', name: 'Standard Media Kenya', url: 'https://www.standardmedia.co.ke/rss/headlines.php', category: 'world' },
  { id: 'sowetan-live-sa', name: 'Sowetan Live SA', url: 'https://www.sowetanlive.co.za/rss', category: 'world' },
  { id: 'africa-news', name: 'Africanews', url: 'https://www.africanews.com/feed/', category: 'world' },
  { id: 'itn-africa', name: 'IT News Africa', url: 'https://www.itnewsafrica.com/feed/', category: 'technology' },
  { id: 'techcabal', name: 'TechCabal', url: 'https://techcabal.com/feed/', category: 'technology' },
  { id: 'technext-africa', name: 'TechNext Africa', url: 'https://technext24.com/feed/', category: 'technology' },

  // ── Latin America (expanded) ───────────────────────────────────────────────
  { id: 'el-universal-mx', name: 'El Universal Mexico', url: 'https://www.eluniversal.com.mx/rss.xml', category: 'world' },
  { id: 'folha-sp', name: 'Folha de S.Paulo', url: 'https://feeds.folha.uol.com.br/world/rss091.xml', category: 'world' },
  { id: 'la-nacion-ar', name: 'La Nacion Argentina', url: 'https://www.lanacion.com.ar/arcio/rss/', category: 'world' },
  { id: 'el-comercio-pe', name: 'El Comercio Peru', url: 'https://elcomercio.pe/arcio/rss/', category: 'world' },
  { id: 'el-tiempo-co', name: 'El Tiempo Colombia', url: 'https://www.eltiempo.com/rss/', category: 'world' },
  { id: 'prensa-latina', name: 'Prensa Latina', url: 'https://www.plenglish.com/feed/', category: 'world' },
  { id: 'jamaica-observer', name: 'Jamaica Observer', url: 'https://www.jamaicaobserver.com/feed/', category: 'world' },
  { id: 'trinidad-guardian', name: 'Trinidad Guardian', url: 'https://www.guardian.co.tt/feed', category: 'world' },
  { id: 'buenos-aires-herald', name: 'Buenos Aires Herald', url: 'https://buenosairesherald.com/feed/', category: 'world' },
  { id: 'argentina-independent', name: 'Dialogo Americas', url: 'https://dialogo-americas.com/feed/', category: 'world' },
  { id: 'latin-finance', name: 'Latin Finance', url: 'https://www.latinfinance.com/feed', category: 'business' },
  { id: 'havana-times', name: 'Havana Times', url: 'https://havanatimes.org/feed/', category: 'world' },
  { id: 'teleSUR-english', name: 'teleSUR English', url: 'https://www.telesurenglish.net/rss/news.xml', category: 'world' },
  { id: 'santiago-times', name: 'Santiago Times', url: 'https://santiagotimes.cl/feed/', category: 'world' },
  { id: 'peru-reports', name: 'Peru Reports', url: 'https://perureports.com/feed/', category: 'world' },
  { id: 'argentina-reports', name: 'Argentina Reports', url: 'https://argentinareports.com/feed/', category: 'world' },
  { id: 'guatemala-times', name: 'Guatemala Times', url: 'https://www.guatemala-times.com/feed/', category: 'world' },

  // ── South/Southeast Asia (expanded) ────────────────────────────────────────
  { id: 'rappler-ph', name: 'Rappler Philippines', url: 'https://www.rappler.com/feed/', category: 'world' },
  { id: 'the-star-my', name: 'The Star Malaysia', url: 'https://www.thestar.com.my/rss/News/', category: 'world' },
  { id: 'nst-malaysia', name: 'New Straits Times', url: 'https://www.nst.com.my/rss', category: 'world' },
  { id: 'coconuts', name: 'Coconuts', url: 'https://coconuts.co/feed/', category: 'world' },
  { id: 'myanmar-now', name: 'Myanmar Now', url: 'https://myanmar-now.org/en/feed', category: 'world' },
  { id: 'kathmandu-post', name: 'Kathmandu Post', url: 'https://kathmandupost.com/feed', category: 'world' },
  { id: 'daily-mirror-lk', name: 'Daily Mirror Sri Lanka', url: 'https://www.dailymirror.lk/RSS_Feeds/breaking_news.xml', category: 'world' },
  { id: 'deccan-herald', name: 'Deccan Herald', url: 'https://www.deccanherald.com/rss', category: 'world' },
  { id: 'scroll-in', name: 'Scroll.in', url: 'https://scroll.in/feed', category: 'world' },
  { id: 'the-wire-india', name: 'The Wire India', url: 'https://thewire.in/feed', category: 'world' },
  { id: 'livemint', name: 'LiveMint India', url: 'https://www.livemint.com/rss/news', category: 'business' },
  { id: 'firstpost-india', name: 'Firstpost India', url: 'https://www.firstpost.com/rss/india.xml', category: 'world' },
  { id: 'the-quint', name: 'The Quint', url: 'https://www.thequint.com/quintlab/rss-feeds/thequint-rss-feed.xml', category: 'world' },
  { id: 'news18-india', name: 'News18 India', url: 'https://www.news18.com/rss/india.xml', category: 'world' },
  { id: 'geo-tv-pakistan', name: 'Geo TV Pakistan', url: 'https://www.geo.tv/rss/1/0', category: 'world' },
  { id: 'express-tribune-pk', name: 'Express Tribune Pakistan', url: 'https://tribune.com.pk/feed/home', category: 'world' },
  { id: 'dhaka-tribune', name: 'Dhaka Tribune', url: 'https://www.dhakatribune.com/feed', category: 'world' },
  { id: 'phnom-penh-post', name: 'Phnom Penh Post', url: 'https://www.phnompenhpost.com/feed', category: 'world' },
  { id: 'vientiane-times', name: 'Vientiane Times', url: 'https://www.vientianetimes.org.la/feed', category: 'world' },
  { id: 'irrawaddy', name: 'The Irrawaddy', url: 'https://www.irrawaddy.com/feed', category: 'world' },
  { id: 'frontier-myanmar', name: 'Frontier Myanmar', url: 'https://www.frontiermyanmar.net/feed/', category: 'world' },
  { id: 'nikkei-asia-tech', name: 'Nikkei Asia Tech', url: 'https://asia.nikkei.com/rss/feed/nar', category: 'technology' },
  { id: 'south-china-morning-business', name: 'SCMP Business', url: 'https://www.scmp.com/rss/3/feed', category: 'business' },

  // ── Central/Eastern Europe (expanded) ──────────────────────────────────────
  { id: 'kyiv-independent', name: 'Kyiv Independent', url: 'https://kyivindependent.com/feed/', category: 'world' },
  { id: 'prague-monitor', name: 'Prague Monitor', url: 'https://praguemonitor.com/feed', category: 'world' },
  { id: 'romania-insider', name: 'Romania Insider', url: 'https://www.romania-insider.com/feed', category: 'world' },
  { id: 'emerging-europe', name: 'Emerging Europe', url: 'https://emerging-europe.com/feed/', category: 'world' },
  { id: 'hungary-today', name: 'Hungary Today', url: 'https://hungarytoday.hu/feed/', category: 'world' },
  { id: 'polands-news', name: 'Notes from Poland', url: 'https://notesfrompoland.com/feed/', category: 'world' },
  { id: 'ua-pravda-en', name: 'Ukrainska Pravda English', url: 'https://www.pravda.com.ua/eng/rss/', category: 'world' },
  { id: 'belsat-en', name: 'Belsat English', url: 'https://belsat.eu/en/feed', category: 'world' },
  { id: 'sofia-globe', name: 'The Sofia Globe', url: 'https://sofiaglobe.com/feed/', category: 'world' },
  { id: 'intellinews', name: 'Intellinews', url: 'https://www.intellinews.com/rss', category: 'business' },
  { id: 'croatiaweek', name: 'Croatia Week', url: 'https://www.croatiaweek.com/feed/', category: 'world' },
  { id: 'serbian-monitor', name: 'Serbian Monitor', url: 'https://www.serbianmonitor.com/en/feed/', category: 'world' },
  { id: 'baltic-times', name: 'The Baltic Times', url: 'https://www.baltictimes.com/rss/', category: 'world' },
  { id: 'err-news-ee', name: 'ERR News Estonia', url: 'https://news.err.ee/rss', category: 'world' },
  { id: 'lrt-en', name: 'LRT English Lithuania', url: 'https://www.lrt.lt/en/rss', category: 'world' },

  // ── Science/Environment (expanded) ─────────────────────────────────────────
  { id: 'mongabay', name: 'Mongabay', url: 'https://news.mongabay.com/feed/', category: 'science' },
  { id: 'climate-home-news', name: 'Climate Home News', url: 'https://www.climatechangenews.com/feed/', category: 'science' },
  { id: 'inside-climate-news', name: 'Inside Climate News', url: 'https://insideclimatenews.org/feed/', category: 'science' },
  { id: 'eenews', name: 'E&E News', url: 'https://www.eenews.net/feed/', category: 'science' },
  { id: 'undark', name: 'Undark', url: 'https://undark.org/feed/', category: 'science' },
  { id: 'retraction-watch', name: 'Retraction Watch', url: 'https://retractionwatch.com/feed/', category: 'science' },
  { id: 'science-mag', name: 'Science Magazine', url: 'https://www.science.org/rss/news_current.xml', category: 'science' },
  { id: 'the-lancet', name: 'The Lancet', url: 'https://www.thelancet.com/rssfeed/lancet_online.xml', category: 'health' },
  { id: 'environmental-health-news', name: 'Environmental Health News', url: 'https://www.ehn.org/feed', category: 'science' },
  { id: 'grist', name: 'Grist', url: 'https://grist.org/feed/', category: 'science' },
  { id: 'hakai-magazine', name: 'Hakai Magazine', url: 'https://hakaimagazine.com/feed/', category: 'science' },
  { id: 'atlas-obscura', name: 'Atlas Obscura', url: 'https://www.atlasobscura.com/feeds/latest', category: 'science' },
  { id: 'quanta-magazine', name: 'Quanta Magazine', url: 'https://api.quantamagazine.org/feed/', category: 'science' },

  // ── Technology (expanded) ──────────────────────────────────────────────────
  { id: 'the-information', name: 'The Information', url: 'https://www.theinformation.com/feed', category: 'technology' },
  { id: 'android-authority', name: 'Android Authority', url: 'https://www.androidauthority.com/feed/', category: 'technology' },
  { id: 'macrumors', name: 'MacRumors', url: 'https://feeds.macrumors.com/MacRumors-All', category: 'technology' },
  { id: 'windows-central', name: 'Windows Central', url: 'https://www.windowscentral.com/feed', category: 'technology' },
  { id: 'techradar', name: 'TechRadar', url: 'https://www.techradar.com/rss', category: 'technology' },
  { id: 'the-next-web', name: 'The Next Web', url: 'https://thenextweb.com/feed/', category: 'technology' },
  { id: 'howtogeek', name: 'How-To Geek', url: 'https://www.howtogeek.com/feed/', category: 'technology' },
  { id: 'dark-reading', name: 'Dark Reading', url: 'https://www.darkreading.com/rss.xml', category: 'technology' },
  { id: 'bleeping-computer', name: 'Bleeping Computer', url: 'https://www.bleepingcomputer.com/feed/', category: 'technology' },
  { id: 'krebs-on-security', name: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/', category: 'technology' },
  { id: 'the-hacker-news', name: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews', category: 'technology' },
  { id: 'slashdot', name: 'Slashdot', url: 'https://rss.slashdot.org/Slashdot/slashdotMain', category: 'technology' },
  { id: 'arstechnica-gaming', name: 'Ars Technica Gaming', url: 'https://feeds.arstechnica.com/arstechnica/gaming', category: 'entertainment' },
  { id: '9to5google', name: '9to5Google', url: 'https://9to5google.com/feed/', category: 'technology' },

  // ── Middle East (expanded) ─────────────────────────────────────────────────
  { id: 'al-monitor', name: 'Al-Monitor', url: 'https://www.al-monitor.com/rss', category: 'world' },
  { id: 'jerusalem-post', name: 'Jerusalem Post', url: 'https://www.jpost.com/rss/rssfeedsfrontpage.aspx', category: 'world' },
  { id: 'new-arab', name: 'The New Arab', url: 'https://www.newarab.com/rss', category: 'world' },
  { id: 'daily-sabah', name: 'Daily Sabah', url: 'https://www.dailysabah.com/rssFeed/todays-headlines', category: 'world' },
  { id: 'ahram-online', name: 'Ahram Online Egypt', url: 'https://english.ahram.org.eg/UI/Front/RSS.aspx', category: 'world' },
  { id: 'khaleej-times', name: 'Khaleej Times', url: 'https://www.khaleejtimes.com/rss', category: 'world' },
  { id: 'saudi-gazette', name: 'Saudi Gazette', url: 'https://saudigazette.com.sa/feed', category: 'world' },
  { id: 'jordan-times', name: 'Jordan Times', url: 'https://www.jordantimes.com/feed', category: 'world' },

  // ── Oceania/Pacific (expanded) ─────────────────────────────────────────────
  { id: 'sbs-australia', name: 'SBS Australia', url: 'https://www.sbs.com.au/news/feed', category: 'world' },
  { id: 'the-australian', name: 'The Australian', url: 'https://www.theaustralian.com.au/feed', category: 'world' },
  { id: 'sydney-morning-herald', name: 'Sydney Morning Herald', url: 'https://www.smh.com.au/rss/feed.xml', category: 'world' },
  { id: 'the-age-au', name: 'The Age Melbourne', url: 'https://www.theage.com.au/rss/feed.xml', category: 'world' },
  { id: 'fiji-times', name: 'Fiji Times', url: 'https://www.fijitimes.com.fj/feed/', category: 'world' },
  { id: 'samoa-observer', name: 'Samoa Observer', url: 'https://www.samoaobserver.ws/feed', category: 'world' },

  // ── Additional Business/Finance ────────────────────────────────────────────
  { id: 'financial-times-world', name: 'Financial Times World', url: 'https://www.ft.com/rss/home/uk', category: 'business' },
  { id: 'barrons', name: "Barron's", url: 'https://www.barrons.com/articles/rss', category: 'business' },
  { id: 'coindesk', name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', category: 'business' },
  { id: 'crypto-news', name: 'The Block', url: 'https://www.theblock.co/rss.xml', category: 'business' },
  { id: 'ft-tech', name: 'Financial Times Tech', url: 'https://www.ft.com/technology?format=rss', category: 'technology' },
  { id: 'morningstar', name: 'Morningstar', url: 'https://www.morningstar.com/rss/feeds', category: 'business' },

  // ── Additional Health ──────────────────────────────────────────────────────
  { id: 'healthline', name: 'Healthline', url: 'https://www.healthline.com/rss', category: 'health' },
  { id: 'fierce-pharma', name: 'Fierce Pharma', url: 'https://www.fiercepharma.com/rss/xml', category: 'health' },
  { id: 'endpoints-news', name: 'Endpoints News', url: 'https://endpts.com/feed/', category: 'health' },

  // ── Additional Sports ──────────────────────────────────────────────────────
  { id: 'the-athletic', name: 'The Athletic', url: 'https://theathletic.com/feed/', category: 'sports' },
  { id: 'sporting-news', name: 'Sporting News', url: 'https://www.sportingnews.com/rss', category: 'sports' },
  { id: 'cricbuzz', name: 'Cricbuzz', url: 'https://www.cricbuzz.com/rss', category: 'sports' },
  { id: 'olympics', name: 'Olympics News', url: 'https://olympics.com/en/news/rss', category: 'sports' },
  { id: 'rugby-world', name: 'Rugby World', url: 'https://www.rugbyworld.com/feed', category: 'sports' },

  // ── Additional Entertainment/Culture ───────────────────────────────────────
  { id: 'indiewire', name: 'IndieWire', url: 'https://www.indiewire.com/feed/', category: 'entertainment' },
  { id: 'collider', name: 'Collider', url: 'https://collider.com/feed/', category: 'entertainment' },
  { id: 'stereogum', name: 'Stereogum', url: 'https://www.stereogum.com/feed/', category: 'entertainment' },
  { id: 'the-wrap', name: 'The Wrap', url: 'https://www.thewrap.com/feed/', category: 'entertainment' },
  { id: 'giant-freakin-robot', name: 'Giant Freakin Robot', url: 'https://www.giantfreakinrobot.com/feed', category: 'entertainment' },
  { id: 'kotaku', name: 'Kotaku', url: 'https://kotaku.com/rss', category: 'entertainment' },

  // ── Additional US/Canada Regional ──────────────────────────────────────────
  { id: 'philly-inquirer', name: 'Philadelphia Inquirer', url: 'https://www.inquirer.com/arcio/rss/', category: 'world' },
  { id: 'seattle-times', name: 'Seattle Times', url: 'https://www.seattletimes.com/feed/', category: 'world' },
  { id: 'sfgate', name: 'SFGate', url: 'https://www.sfgate.com/feed/', category: 'world' },
  { id: 'detroit-free-press', name: 'Detroit Free Press', url: 'https://www.freep.com/arcio/rss/', category: 'world' },
  { id: 'dallas-morning-news', name: 'Dallas Morning News', url: 'https://www.dallasnews.com/arcio/rss/', category: 'world' },
  { id: 'toronto-star', name: 'Toronto Star', url: 'https://www.thestar.com/feed/', category: 'world' },
  { id: 'montreal-gazette', name: 'Montreal Gazette', url: 'https://montrealgazette.com/feed/', category: 'world' },

  // ── East Asia (expanded) ───────────────────────────────────────────────────
  { id: 'china-daily', name: 'China Daily', url: 'https://www.chinadaily.com.cn/rss/world_rss.xml', category: 'world' },
  { id: 'global-times-cn', name: 'Global Times', url: 'https://www.globaltimes.cn/rss/outbrain.xml', category: 'world' },
  { id: 'asahi-shimbun', name: 'Asahi Shimbun', url: 'https://www.asahi.com/ajw/rss/index.rss', category: 'world' },
  { id: 'korea-joongang', name: 'Korea JoongAng Daily', url: 'https://koreajoongangdaily.joins.com/xmlFile/rss_headline.xml', category: 'world' },
  { id: 'focus-taiwan', name: 'Focus Taiwan', url: 'https://focustaiwan.tw/rss', category: 'world' },
  { id: 'xinhua-english', name: 'Xinhua English', url: 'https://www.news.cn/english/rss/worldnews.xml', category: 'world' },

  // ── Nordic/Scandinavia (expanded) ──────────────────────────────────────────
  { id: 'yle-news', name: 'YLE News Finland', url: 'https://feeds.yle.fi/uutiset/v1/recent.rss?publisherIds=YLE_NEWS', category: 'world' },
  { id: 'iceland-monitor', name: 'Iceland Monitor', url: 'https://icelandmonitor.mbl.is/rss/rss.xml', category: 'world' },
  { id: 'copenhagen-post', name: 'Copenhagen Post', url: 'https://cphpost.dk/feed/', category: 'world' },
  { id: 'thelocal-dk', name: 'The Local Denmark', url: 'https://feeds.thelocal.com/rss/dk', category: 'world' },

  // ── Central Asia / Caucasus ────────────────────────────────────────────────
  { id: 'eurasianet', name: 'Eurasianet', url: 'https://eurasianet.org/feed', category: 'world' },
  { id: 'oc-media', name: 'OC Media Caucasus', url: 'https://oc-media.org/feed/', category: 'world' },
  { id: 'the-astana-times', name: 'The Astana Times', url: 'https://astanatimes.com/feed/', category: 'world' },
  { id: 'jam-news', name: 'JAM News', url: 'https://jam-news.net/feed/', category: 'world' },

  // ── Wire Services / Global ─────────────────────────────────────────────────
  { id: 'un-news', name: 'UN News', url: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml', category: 'world' },
  { id: 'irin-news', name: 'The New Humanitarian', url: 'https://www.thenewhumanitarian.org/feed', category: 'world' },
  { id: 'devex', name: 'Devex', url: 'https://www.devex.com/news/rss', category: 'world' },
  { id: 'relief-web', name: 'ReliefWeb', url: 'https://reliefweb.int/updates/rss.xml', category: 'world' },
  { id: 'global-voices', name: 'Global Voices', url: 'https://globalvoices.org/feed/', category: 'world' },
  { id: 'ips-news', name: 'IPS News', url: 'https://www.ipsnews.net/feed/', category: 'world' },

  // ── India (expanded) ───────────────────────────────────────────────────────
  { id: 'ndtv-business', name: 'NDTV Business', url: 'https://feeds.feedburner.com/ndtvprofit-latest', category: 'business' },
  { id: 'economic-times', name: 'Economic Times', url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms', category: 'business' },
  { id: 'business-standard', name: 'Business Standard', url: 'https://www.business-standard.com/rss/home_page_top_stories.rss', category: 'business' },
  { id: 'zee-news', name: 'Zee News', url: 'https://zeenews.india.com/rss/india-national-news.xml', category: 'world' },
  { id: 'india-today', name: 'India Today', url: 'https://www.indiatoday.in/rss/home', category: 'world' },
  { id: 'outlook-india', name: 'Outlook India', url: 'https://www.outlookindia.com/rss', category: 'world' },
  { id: 'tribune-india', name: 'Tribune India', url: 'https://www.tribuneindia.com/rss/feed', category: 'world' },
  { id: 'mint-lounge', name: 'Mint Lounge', url: 'https://lifestyle.livemint.com/rss/news', category: 'entertainment' },
  { id: 'the-print', name: 'The Print', url: 'https://theprint.in/feed/', category: 'world' },
  { id: 'swarajya', name: 'Swarajya', url: 'https://swarajyamag.com/feeds/rss', category: 'world' },
  { id: 'ndtv-science', name: 'NDTV Science', url: 'https://feeds.feedburner.com/ndtvnews-science', category: 'science' },
  { id: 'economic-times-tech', name: 'Economic Times Tech', url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms?feedtype=ettech', category: 'technology' },
  { id: 'indian-express-politics', name: 'Indian Express Politics', url: 'https://indianexpress.com/section/political-pulse/feed/', category: 'politics' },
  { id: 'the-hindu-business', name: 'The Hindu Business', url: 'https://www.thehindu.com/business/feeder/default.rss', category: 'business' },
  { id: 'the-hindu-science', name: 'The Hindu Science', url: 'https://www.thehindu.com/sci-tech/science/feeder/default.rss', category: 'science' },
  { id: 'mint-politics', name: 'Mint Politics', url: 'https://www.livemint.com/rss/politics', category: 'politics' },
  { id: 'hindustan-times-world', name: 'Hindustan Times World', url: 'https://www.hindustantimes.com/feeds/rss/world-news/rssfeed.xml', category: 'world' },
  { id: 'news18-world', name: 'News18 World', url: 'https://www.news18.com/rss/world.xml', category: 'world' },
  { id: 'india-today-tech', name: 'India Today Tech', url: 'https://www.indiatoday.in/rss/1206584', category: 'technology' },
  { id: 'deccan-chronicle', name: 'Deccan Chronicle', url: 'https://www.deccanchronicle.com/rss_feed/', category: 'world' },

  // ── China / East Asia (expanded) ───────────────────────────────────────────
  { id: 'caixin-global', name: 'Caixin Global', url: 'https://www.caixinglobal.com/rss/', category: 'business' },
  { id: 'sixth-tone', name: 'Sixth Tone', url: 'https://www.sixthtone.com/rss', category: 'world' },
  { id: 'supchina', name: 'SupChina', url: 'https://supchina.com/feed/', category: 'world' },
  { id: 'yicai-global', name: 'Yicai Global', url: 'https://www.yicaiglobal.com/rss', category: 'business' },
  { id: 'korea-joongang-rss', name: 'Korea JoongAng RSS', url: 'https://koreajoongangdaily.joins.com/rss', category: 'world' },
  { id: 'hankyoreh', name: 'Hankyoreh', url: 'https://english.hani.co.kr/rss/', category: 'world' },
  { id: 'mainichi-japan', name: 'Mainichi Japan', url: 'https://mainichi.jp/english/rss', category: 'world' },
  { id: 'asahi-shimbun-ajw', name: 'Asahi Shimbun AJW', url: 'https://www.asahi.com/ajw/rss/', category: 'world' },
  { id: 'bangkok-post-business', name: 'Bangkok Post Business', url: 'https://www.bangkokpost.com/rss/data/business.xml', category: 'business' },
  { id: 'vnexpress', name: 'VnExpress', url: 'https://e.vnexpress.net/rss/news/latest.rss', category: 'world' },
  { id: 'philippine-star', name: 'Philippine Star', url: 'https://www.philstar.com/rss/headlines', category: 'world' },
  { id: 'tempo-indonesia', name: 'Tempo Indonesia', url: 'https://en.tempo.co/rss/terkini', category: 'world' },
  { id: 'china-daily-business', name: 'China Daily Business', url: 'https://www.chinadaily.com.cn/rss/business_rss.xml', category: 'business' },
  { id: 'japan-times-business', name: 'Japan Times Business', url: 'https://www.japantimes.co.jp/feed/business/', category: 'business' },

  // ── Middle East (expanded) ─────────────────────────────────────────────────
  { id: 'iran-front-page', name: 'Iran Front Page', url: 'https://ifpnews.com/feed', category: 'world' },
  { id: 'al-jazeera-arabic', name: 'Al-Jazeera Arabic', url: 'https://www.aljazeera.net/feed/rss', category: 'world' },
  { id: 'asharq-al-awsat', name: 'Asharq Al-Awsat', url: 'https://english.aawsat.com/rss', category: 'world' },
  { id: 'middle-east-monitor', name: 'Middle East Monitor', url: 'https://www.middleeastmonitor.com/feed/', category: 'world' },
  { id: 'egypt-independent', name: 'Egypt Independent', url: 'https://www.egyptindependent.com/feed/', category: 'world' },
  { id: 'iraq-news', name: 'Iraq News', url: 'https://www.iraqinews.com/feed/', category: 'world' },
  { id: 'rudaw', name: 'Rudaw', url: 'https://www.rudaw.net/english/rss', category: 'world' },
  { id: 'syria-direct', name: 'Syria Direct', url: 'https://syriadirect.org/feed/', category: 'world' },
  { id: 'yemen-press', name: 'Yemen Press', url: 'https://yemenpress.org/feed/', category: 'world' },
  { id: 'oman-observer', name: 'Oman Observer', url: 'https://www.omanobserver.om/feed/', category: 'world' },
  { id: 'bahrain-mirror', name: 'Bahrain Mirror', url: 'https://www.bahrainmirror.com/en/feed/', category: 'world' },
  { id: 'gulf-news-business', name: 'Gulf News Business', url: 'https://gulfnews.com/business/rss', category: 'business' },
  { id: 'arab-news-tech', name: 'Arab News Tech', url: 'https://www.arabnews.com/rss/technology.xml', category: 'technology' },
  { id: 'al-monitor-iran', name: 'Al-Monitor Iran', url: 'https://www.al-monitor.com/rss/iran', category: 'world' },
  { id: 'al-monitor-turkey', name: 'Al-Monitor Turkey', url: 'https://www.al-monitor.com/rss/turkey', category: 'world' },

  // ── Europe (expanded) ──────────────────────────────────────────────────────
  { id: 'thelocal-at', name: 'The Local Austria', url: 'https://feeds.thelocal.com/rss/at', category: 'world' },
  { id: 'thelocal-ch', name: 'The Local Switzerland', url: 'https://feeds.thelocal.com/rss/ch', category: 'world' },
  { id: 'malta-today', name: 'Malta Today', url: 'https://www.maltatoday.com.mt/rss/news', category: 'world' },
  { id: 'cyprus-mail', name: 'Cyprus Mail', url: 'https://cyprus-mail.com/feed/', category: 'world' },
  { id: 'jutarnji-croatia', name: 'Jutarnji Croatia', url: 'https://www.jutarnji.hr/rss', category: 'world' },
  { id: 'n1-info', name: 'N1 Info', url: 'https://n1info.com/english/feed/', category: 'world' },
  { id: 'tirana-times', name: 'Tirana Times', url: 'https://www.tiranatimes.com/feed/', category: 'world' },
  { id: 'kosovo-online', name: 'Kosovo Online', url: 'https://www.kosovo-online.com/en/rss.xml', category: 'world' },
  { id: 'moldova-org', name: 'Moldova.org', url: 'https://www.moldova.org/en/feed/', category: 'world' },
  { id: 'dutch-news', name: 'Dutch News', url: 'https://www.dutchnews.nl/feed/', category: 'world' },
  { id: 'brussels-times', name: 'The Brussels Times', url: 'https://www.brusselstimes.com/rss', category: 'world' },
  { id: 'schengen-visa-info', name: 'SchengenVisaInfo', url: 'https://www.schengenvisainfo.com/news/feed/', category: 'world' },
  { id: 'eu-reporter', name: 'EU Reporter', url: 'https://www.eureporter.co/feed/', category: 'world' },
  { id: 'euractiv', name: 'Euractiv', url: 'https://www.euractiv.com/feed/', category: 'world' },
  { id: 'thelocal-nl', name: 'The Local Netherlands', url: 'https://feeds.thelocal.com/rss/nl', category: 'world' },
  { id: 'intellinews-russia', name: 'Intellinews Russia', url: 'https://www.intellinews.com/rss/russia', category: 'world' },
  { id: 'politico-eu-tech', name: 'Politico EU Tech', url: 'https://www.politico.eu/section/technology/feed/', category: 'technology' },
  { id: 'euronews-business', name: 'Euronews Business', url: 'https://www.euronews.com/rss?level=theme&name=business', category: 'business' },
  { id: 'dw-europe', name: 'DW Europe', url: 'https://rss.dw.com/rdf/rss-en-eu', category: 'world' },
  { id: 'swiss-info-politics', name: 'SwissInfo Politics', url: 'https://www.swissinfo.ch/eng/politics/rss', category: 'politics' },

  // ── Africa (expanded) ──────────────────────────────────────────────────────
  { id: 'quartz-africa', name: 'Quartz Africa', url: 'https://qz.com/africa/feed', category: 'world' },
  { id: 'african-arguments', name: 'African Arguments', url: 'https://africanarguments.org/feed/', category: 'world' },
  { id: 'the-continent', name: 'The Continent', url: 'https://www.thecontinent.org/feed', category: 'world' },
  { id: 'iss-africa', name: 'ISS Africa', url: 'https://issafrica.org/iss-today/rss', category: 'world' },
  { id: 'business-daily-africa', name: 'Business Daily Africa', url: 'https://www.businessdailyafrica.com/bd/rss', category: 'business' },
  { id: 'zambia-daily-mail', name: 'Zambia Daily Mail', url: 'https://www.daily-mail.co.zm/feed/', category: 'world' },
  { id: 'botswana-guardian', name: 'Botswana Guardian', url: 'https://www.botswanaguardian.co.bw/feed/', category: 'world' },
  { id: 'namibian-sun', name: 'Namibian Sun', url: 'https://www.namibiansun.com/feed', category: 'world' },
  { id: 'lesotho-times', name: 'Lesotho Times', url: 'https://www.lestimes.com/feed/', category: 'world' },
  { id: 'swaziland-news', name: 'Swaziland News', url: 'https://www.swazilandnews.co.za/feed/', category: 'world' },
  { id: 'cameroon-tribune', name: 'Cameroon Tribune', url: 'https://www.cameroon-tribune.cm/rss/', category: 'world' },
  { id: 'vanguard-nigeria-politics', name: 'Vanguard Nigeria Politics', url: 'https://www.vanguardngr.com/category/politics/feed/', category: 'politics' },
  { id: 'africa-news-business', name: 'Africa News Business', url: 'https://www.africanews.com/business/feed/', category: 'business' },
  { id: 'nation-kenya-business', name: 'Nation Kenya Business', url: 'https://nation.africa/service/rss/feeds/business.rss', category: 'business' },
  { id: 'daily-monitor-ug', name: 'Daily Monitor Uganda', url: 'https://www.monitor.co.ug/resource/rss/691168', category: 'world' },
  { id: 'mail-guardian-africa', name: 'Mail & Guardian Africa', url: 'https://mg.co.za/africa/feed/', category: 'world' },
  { id: 'punch-nigeria-politics', name: 'Punch Nigeria Politics', url: 'https://punchng.com/topics/politics/feed/', category: 'politics' },
  { id: 'news24-sa-business', name: 'News24 SA Business', url: 'https://feeds.24.com/articles/fin24/TopStories/rss', category: 'business' },
  { id: 'daily-maverick-opinion', name: 'Daily Maverick Opinion', url: 'https://www.dailymaverick.co.za/opinionista/feed/', category: 'world' },
  { id: 'the-star-kenya-business', name: 'The Star Kenya Business', url: 'https://www.the-star.co.ke/business/rss', category: 'business' },

  // ── Pacific / Oceania (expanded) ───────────────────────────────────────────
  { id: 'post-courier-png', name: 'Post Courier PNG', url: 'https://postcourier.com.pg/feed/', category: 'world' },
  { id: 'solomon-star', name: 'Solomon Star', url: 'https://www.solomonstarnews.com/feed/', category: 'world' },
  { id: 'tonga-daily-news', name: 'Tonga Daily News', url: 'https://tongadailynews.to/feed/', category: 'world' },
  { id: 'pacific-islands-report', name: 'Pacific Islands Report', url: 'https://www.pireport.org/rss', category: 'world' },
  { id: 'islands-business', name: 'Islands Business', url: 'https://islandsbusiness.com/feed/', category: 'world' },
  { id: 'rnz-pacific', name: 'RNZ Pacific', url: 'https://www.rnz.co.nz/rss/pacific.xml', category: 'world' },
  { id: 'fiji-sun', name: 'Fiji Sun', url: 'https://fijisun.com.fj/feed/', category: 'world' },
  { id: 'png-post-courier-business', name: 'PNG Business', url: 'https://postcourier.com.pg/category/business/feed/', category: 'business' },
  { id: 'samoa-observer-politics', name: 'Samoa Observer Politics', url: 'https://www.samoaobserver.ws/category/politics/feed', category: 'politics' },
  { id: 'vanuatu-daily-post', name: 'Vanuatu Daily Post', url: 'https://dailypost.vu/feed/', category: 'world' },

  // ── Central America / Caribbean (expanded) ─────────────────────────────────
  { id: 'belize-times', name: 'Belize Times', url: 'https://www.belizetimes.bz/feed/', category: 'world' },
  { id: 'costa-rica-star', name: 'Costa Rica Star', url: 'https://news.co.cr/feed/', category: 'world' },
  { id: 'panama-star', name: 'Panama Star', url: 'https://thepanamastar.com/feed/', category: 'world' },
  { id: 'honduras-weekly', name: 'Honduras Weekly', url: 'https://www.hondurasweekly.com/feed/', category: 'world' },
  { id: 'antigua-observer', name: 'Antigua Observer', url: 'https://antiguaobserver.com/feed/', category: 'world' },
  { id: 'barbados-today', name: 'Barbados Today', url: 'https://barbadostoday.bb/feed/', category: 'world' },
  { id: 'st-lucia-times', name: 'St. Lucia Times', url: 'https://stluciatimes.com/feed/', category: 'world' },
  { id: 'dominica-news', name: 'Dominica News', url: 'https://dominicanewsonline.com/feed/', category: 'world' },
  { id: 'loop-caribbean', name: 'Loop Caribbean', url: 'https://www.loopnewsbarbados.com/rss.xml', category: 'world' },
  { id: 'jamaica-gleaner', name: 'Jamaica Gleaner', url: 'https://jamaica-gleaner.com/feed', category: 'world' },

  // ── Cybersecurity ─────────────────────────────────────────────────────────
  { id: 'threatpost', name: 'Threatpost', url: 'https://threatpost.com/feed/', category: 'technology' },
  { id: 'security-week', name: 'Security Week', url: 'https://www.securityweek.com/feed/', category: 'technology' },
  { id: 'sc-magazine', name: 'SC Magazine', url: 'https://www.scmagazine.com/feed', category: 'technology' },
  { id: 'cyberscoop', name: 'CyberScoop', url: 'https://www.cyberscoop.com/feed/', category: 'technology' },
  { id: 'graham-cluley', name: 'Graham Cluley', url: 'https://grahamcluley.com/feed/', category: 'technology' },
  { id: 'troy-hunt', name: 'Troy Hunt', url: 'https://www.troyhunt.com/rss/', category: 'technology' },
  { id: 'sans-isc', name: 'SANS ISC', url: 'https://isc.sans.edu/rssfeed.xml', category: 'technology' },
  { id: 'naked-security', name: 'Naked Security', url: 'https://nakedsecurity.sophos.com/feed/', category: 'technology' },
  { id: 'recorded-future', name: 'Recorded Future', url: 'https://www.recordedfuture.com/feed', category: 'technology' },
  { id: 'security-trails', name: 'SecurityTrails', url: 'https://securitytrails.com/blog/feed', category: 'technology' },
  { id: 'infosecurity-mag', name: 'Infosecurity Magazine', url: 'https://www.infosecurity-magazine.com/rss/news/', category: 'technology' },
  { id: 'schneier-security', name: 'Schneier on Security', url: 'https://www.schneier.com/feed/', category: 'technology' },
  { id: 'zero-day-initiative', name: 'Zero Day Initiative', url: 'https://www.zerodayinitiative.com/rss/published/', category: 'technology' },

  // ── Space / Astronomy ─────────────────────────────────────────────────────
  { id: 'spacenews', name: 'SpaceNews', url: 'https://spacenews.com/feed/', category: 'science' },
  { id: 'universe-today', name: 'Universe Today', url: 'https://www.universetoday.com/feed/', category: 'science' },
  { id: 'planetary-society', name: 'Planetary Society', url: 'https://www.planetary.org/feed', category: 'science' },
  { id: 'space-policy-online', name: 'Space Policy Online', url: 'https://spacepolicyonline.com/feed/', category: 'science' },
  { id: 'spacex-updates', name: 'SpaceX Updates', url: 'https://www.spacex.com/updates/rss', category: 'science' },
  { id: 'astronomy-mag', name: 'Astronomy Magazine', url: 'https://astronomy.com/feed', category: 'science' },
  { id: 'nasaspaceflight', name: 'NASASpaceFlight', url: 'https://www.nasaspaceflight.com/feed/', category: 'science' },
  { id: 'sky-telescope', name: 'Sky & Telescope', url: 'https://skyandtelescope.org/feed/', category: 'science' },
  { id: 'astrobites', name: 'Astrobites', url: 'https://astrobites.org/feed/', category: 'science' },
  { id: 'ars-technica-space', name: 'Ars Technica Space', url: 'https://arstechnica.com/tag/space/feed/', category: 'science' },

  // ── Energy / Climate ──────────────────────────────────────────────────────
  { id: 'utility-dive', name: 'Utility Dive', url: 'https://www.utilitydive.com/feeds/news/', category: 'science' },
  { id: 'energy-voice', name: 'Energy Voice', url: 'https://www.energyvoice.com/feed/', category: 'science' },
  { id: 'oilprice', name: 'Oilprice.com', url: 'https://oilprice.com/rss/main', category: 'business' },
  { id: 'renewable-energy-world', name: 'Renewable Energy World', url: 'https://www.renewableenergyworld.com/feed/', category: 'science' },
  { id: 'cleantechnica', name: 'Clean Technica', url: 'https://cleantechnica.com/feed/', category: 'science' },
  { id: 'electrek', name: 'Electrek', url: 'https://electrek.co/feed/', category: 'technology' },
  { id: 'energy-monitor', name: 'Energy Monitor', url: 'https://www.energymonitor.ai/feed/', category: 'science' },
  { id: 'greentech-media', name: 'Greentech Media', url: 'https://www.greentechmedia.com/feed', category: 'science' },
  { id: 'energy-transition', name: 'Energy Transition', url: 'https://energytransition.org/feed/', category: 'science' },
  { id: 'solar-power-world', name: 'Solar Power World', url: 'https://www.solarpowerworldonline.com/feed/', category: 'science' },

  // ── Legal / Justice ───────────────────────────────────────────────────────
  { id: 'law360', name: 'Law360', url: 'https://www.law360.com/rss/articles', category: 'general' },
  { id: 'above-the-law', name: 'Above the Law', url: 'https://abovethelaw.com/feed/', category: 'general' },
  { id: 'scotusblog', name: 'SCOTUSblog', url: 'https://www.scotusblog.com/feed/', category: 'general' },
  { id: 'marshall-project', name: 'The Marshall Project', url: 'https://www.themarshallproject.org/rss/', category: 'general' },
  { id: 'courthouse-news', name: 'Courthouse News', url: 'https://www.courthousenews.com/feed/', category: 'general' },
  { id: 'law-com', name: 'Law.com', url: 'https://www.law.com/feed/', category: 'general' },
  { id: 'jurist', name: 'JURIST', url: 'https://www.jurist.org/news/feed/', category: 'general' },
  { id: 'lawfare-blog', name: 'Lawfare', url: 'https://www.lawfaremedia.org/feed', category: 'general' },
  { id: 'reuters-legal', name: 'Reuters Legal', url: 'https://www.reuters.com/legal/rss', category: 'general' },
  { id: 'national-law-review', name: 'National Law Review', url: 'https://www.natlawreview.com/feed', category: 'general' },

  // ── Military / Defense ────────────────────────────────────────────────────
  { id: 'military-com', name: 'Military.com', url: 'https://www.military.com/rss-feeds', category: 'world' },
  { id: 'breaking-defense', name: 'Breaking Defense', url: 'https://breakingdefense.com/feed/', category: 'world' },
  { id: 'defense-news', name: 'Defense News', url: 'https://www.defensenews.com/arc/outboundfeeds/rss/?outputType=xml', category: 'world' },
  { id: 'war-on-the-rocks', name: 'War on the Rocks', url: 'https://warontherocks.com/feed/', category: 'world' },
  { id: 'the-war-zone', name: 'The War Zone', url: 'https://www.thedrive.com/the-war-zone/rss', category: 'world' },
  { id: 'janes-news', name: 'Janes', url: 'https://www.janes.com/feeds/news', category: 'world' },
  { id: 'stars-and-stripes', name: 'Stars and Stripes', url: 'https://www.stripes.com/rss', category: 'world' },
  { id: 'defense-blog', name: 'Defense Blog', url: 'https://defence-blog.com/feed/', category: 'world' },
  { id: 'c4isrnet', name: 'C4ISRNET', url: 'https://www.c4isrnet.com/arc/outboundfeeds/rss/?outputType=xml', category: 'technology' },
  { id: 'task-and-purpose', name: 'Task & Purpose', url: 'https://taskandpurpose.com/feed/', category: 'world' },

  // ── Economics / Development ───────────────────────────────────────────────
  { id: 'world-bank-blogs', name: 'World Bank Blogs', url: 'https://blogs.worldbank.org/feed', category: 'business' },
  { id: 'imf-blog', name: 'IMF Blog', url: 'https://www.imf.org/en/Blogs/rss', category: 'business' },
  { id: 'brookings-global', name: 'Brookings Global Economy', url: 'https://www.brookings.edu/topic/global-economy/feed/', category: 'business' },
  { id: 'project-syndicate', name: 'Project Syndicate', url: 'https://www.project-syndicate.org/rss', category: 'business' },
  { id: 'vox-dev', name: 'VoxDev', url: 'https://voxdev.org/feed', category: 'business' },
  { id: 'cgdev', name: 'Center for Global Development', url: 'https://www.cgdev.org/rss.xml', category: 'business' },
  { id: 'piie', name: 'Peterson Institute (PIIE)', url: 'https://www.piie.com/rss.xml', category: 'business' },
  { id: 'odi-think', name: 'ODI', url: 'https://odi.org/feed/', category: 'business' },
  { id: 'chatham-house', name: 'Chatham House', url: 'https://www.chathamhouse.org/feed', category: 'world' },
  { id: 'carnegie-endowment', name: 'Carnegie Endowment', url: 'https://carnegieendowment.org/rss/solr.xml', category: 'world' },

  // ── Health / Medical ──────────────────────────────────────────────────────
  { id: 'fierce-healthcare', name: 'Fierce Healthcare', url: 'https://www.fiercehealthcare.com/rss/xml', category: 'health' },
  { id: 'health-affairs', name: 'Health Affairs', url: 'https://www.healthaffairs.org/action/showFeed?type=etoc&feed=rss&jc=hlthaff', category: 'health' },
  { id: 'bmj-news', name: 'BMJ', url: 'https://www.bmj.com/rss/recent', category: 'health' },
  { id: 'medscape-news', name: 'Medscape', url: 'https://www.medscape.com/cx/rssfeeds/public/news.xml', category: 'health' },
  { id: 'jama-network', name: 'JAMA Network', url: 'https://jamanetwork.com/rss/site_3/67.xml', category: 'health' },
  { id: 'nature-medicine', name: 'Nature Medicine', url: 'https://www.nature.com/nm.rss', category: 'health' },
  { id: 'nejm-rss', name: 'NEJM', url: 'https://www.nejm.org/action/showFeed?jc=nejm&type=etoc&feed=rss', category: 'health' },
  { id: 'kff-health-news', name: 'KFF Health News', url: 'https://kffhealthnews.org/feed/', category: 'health' },
  { id: 'plos-medicine', name: 'PLOS Medicine', url: 'https://journals.plos.org/plosmedicine/feed/atom', category: 'health' },
  { id: 'health-day', name: 'HealthDay', url: 'https://consumer.healthday.com/feeds/health-news.xml', category: 'health' },

  // ── Food / Agriculture ────────────────────────────────────────────────────
  { id: 'food-navigator', name: 'Food Navigator', url: 'https://www.foodnavigator.com/rss/news', category: 'science' },
  { id: 'modern-farmer', name: 'Modern Farmer', url: 'https://modernfarmer.com/feed/', category: 'science' },
  { id: 'civil-eats', name: 'Civil Eats', url: 'https://civileats.com/feed/', category: 'science' },
  { id: 'food-safety-news', name: 'Food Safety News', url: 'https://www.foodsafetynews.com/feed/', category: 'health' },
  { id: 'successful-farming', name: 'Successful Farming', url: 'https://www.agriculture.com/rss/news', category: 'science' },
  { id: 'fao-news', name: 'FAO News', url: 'https://www.fao.org/news/rss-feed/en/', category: 'science' },
  { id: 'food-dive', name: 'Food Dive', url: 'https://www.fooddive.com/feeds/news/', category: 'business' },
  { id: 'agri-pulse', name: 'Agri-Pulse', url: 'https://www.agri-pulse.com/rss', category: 'business' },

  // ── Real Estate / Housing ─────────────────────────────────────────────────
  { id: 'housingwire', name: 'HousingWire', url: 'https://www.housingwire.com/feed/', category: 'business' },
  { id: 'curbed', name: 'Curbed', url: 'https://www.curbed.com/rss/index.xml', category: 'business' },
  { id: 'the-real-deal', name: 'The Real Deal', url: 'https://therealdeal.com/feed/', category: 'business' },
  { id: 'inman', name: 'Inman', url: 'https://www.inman.com/feed/', category: 'business' },
  { id: 'bisnow', name: 'Bisnow', url: 'https://www.bisnow.com/feed', category: 'business' },
  { id: 'globe-st', name: 'GlobeSt', url: 'https://www.globest.com/feed/', category: 'business' },
  { id: 'propmodo', name: 'Propmodo', url: 'https://www.propmodo.com/feed/', category: 'business' },
  { id: 'multifamily-exec', name: 'Multifamily Executive', url: 'https://www.multifamilyexecutive.com/rss/', category: 'business' },

  // ── Education ─────────────────────────────────────────────────────────────
  { id: 'edsurge', name: 'EdSurge', url: 'https://www.edsurge.com/feeds/rss', category: 'general' },
  { id: 'campus-technology', name: 'Campus Technology', url: 'https://campustechnology.com/rss-feeds/', category: 'general' },
  { id: 'university-world-news', name: 'University World News', url: 'https://www.universityworldnews.com/rss.php', category: 'general' },
  { id: 'times-higher-ed', name: 'Times Higher Education', url: 'https://www.timeshighereducation.com/rss', category: 'general' },
  { id: 'inside-higher-ed', name: 'Inside Higher Ed', url: 'https://www.insidehighered.com/rss.xml', category: 'general' },
  { id: 'chronicle-higher-ed', name: 'Chronicle of Higher Education', url: 'https://www.chronicle.com/feed', category: 'general' },
  { id: 'education-week', name: 'Education Week', url: 'https://www.edweek.org/feed', category: 'general' },
  { id: 'the74-news', name: 'The 74', url: 'https://www.the74million.org/feed/', category: 'general' },

  // ── Automotive ────────────────────────────────────────────────────────────
  { id: 'automotive-news', name: 'Automotive News', url: 'https://www.autonews.com/feed', category: 'business' },
  { id: 'motor-authority', name: 'Motor Authority', url: 'https://www.motorauthority.com/rss/news', category: 'general' },
  { id: 'car-and-driver', name: 'Car and Driver', url: 'https://www.caranddriver.com/rss/all.xml/', category: 'general' },
  { id: 'jalopnik', name: 'Jalopnik', url: 'https://jalopnik.com/rss', category: 'general' },
  { id: 'electrified-media', name: 'Electrified', url: 'https://electrified.media/feed/', category: 'technology' },
  { id: 'insideevs', name: 'InsideEVs', url: 'https://insideevs.com/rss/news/', category: 'technology' },
  { id: 'the-drive', name: 'The Drive', url: 'https://www.thedrive.com/rss', category: 'general' },
  { id: 'road-and-track', name: 'Road & Track', url: 'https://www.roadandtrack.com/rss/all.xml/', category: 'general' },

  // ── Gaming ────────────────────────────────────────────────────────────────
  { id: 'pc-gamer', name: 'PC Gamer', url: 'https://www.pcgamer.com/rss/', category: 'entertainment' },
  { id: 'rock-paper-shotgun', name: 'Rock Paper Shotgun', url: 'https://www.rockpapershotgun.com/feed', category: 'entertainment' },
  { id: 'eurogamer', name: 'Eurogamer', url: 'https://www.eurogamer.net/feed', category: 'entertainment' },
  { id: 'nintendo-life', name: 'Nintendo Life', url: 'https://www.nintendolife.com/feeds/latest', category: 'entertainment' },
  { id: 'push-square', name: 'Push Square', url: 'https://www.pushsquare.com/feeds/latest', category: 'entertainment' },
  { id: 'pure-xbox', name: 'Pure Xbox', url: 'https://www.purexbox.com/feeds/latest', category: 'entertainment' },
  { id: 'destructoid', name: 'Destructoid', url: 'https://www.destructoid.com/feed/', category: 'entertainment' },
  { id: 'gamesradar', name: 'GamesRadar', url: 'https://www.gamesradar.com/rss/', category: 'entertainment' },
  { id: 'vg247', name: 'VG247', url: 'https://www.vg247.com/feed', category: 'entertainment' },
  { id: 'dualshockers', name: 'DualShockers', url: 'https://www.dualshockers.com/feed/', category: 'entertainment' },

  // ── Crypto / Web3 ─────────────────────────────────────────────────────────
  { id: 'decrypt', name: 'Decrypt', url: 'https://decrypt.co/feed', category: 'technology' },
  { id: 'cointelegraph', name: 'CoinTelegraph', url: 'https://cointelegraph.com/rss', category: 'technology' },
  { id: 'bitcoin-magazine', name: 'Bitcoin Magazine', url: 'https://bitcoinmagazine.com/.rss/full/', category: 'technology' },
  { id: 'defi-pulse', name: 'DeFi Pulse', url: 'https://defipulse.com/blog/feed/', category: 'technology' },
  { id: 'the-defiant', name: 'The Defiant', url: 'https://thedefiant.io/feed', category: 'technology' },
  { id: 'bankless', name: 'Bankless', url: 'https://www.bankless.com/rss/', category: 'technology' },
  { id: 'crypto-briefing', name: 'Crypto Briefing', url: 'https://cryptobriefing.com/feed/', category: 'technology' },
  { id: 'blockonomi', name: 'Blockonomi', url: 'https://blockonomi.com/feed/', category: 'technology' },

  // ── Travel ────────────────────────────────────────────────────────────────
  { id: 'skift', name: 'Skift', url: 'https://skift.com/feed/', category: 'general' },
  { id: 'travel-weekly', name: 'Travel Weekly', url: 'https://www.travelweekly.com/rss', category: 'general' },
  { id: 'lonely-planet', name: 'Lonely Planet', url: 'https://www.lonelyplanet.com/news/feed', category: 'general' },
  { id: 'the-points-guy', name: 'The Points Guy', url: 'https://thepointsguy.com/feed/', category: 'general' },
  { id: 'conde-nast-traveler', name: 'Conde Nast Traveler', url: 'https://www.cntraveler.com/feed/rss', category: 'general' },
  { id: 'travel-pulse', name: 'TravelPulse', url: 'https://www.travelpulse.com/rss', category: 'general' },
  { id: 'phocuswire', name: 'PhocusWire', url: 'https://www.phocuswire.com/rss', category: 'business' },
  { id: 'travel-off-path', name: 'Travel Off Path', url: 'https://www.traveloffpath.com/feed/', category: 'general' },

  // ── Aviation ──────────────────────────────────────────────────────────────
  { id: 'simple-flying', name: 'Simple Flying', url: 'https://simpleflying.com/feed/', category: 'business' },
  { id: 'aviation-week', name: 'Aviation Week', url: 'https://aviationweek.com/rss.xml', category: 'business' },
  { id: 'flightglobal', name: 'FlightGlobal', url: 'https://www.flightglobal.com/rss', category: 'business' },
  { id: 'air-current', name: 'The Air Current', url: 'https://theaircurrent.com/feed/', category: 'business' },
  { id: 'one-mile-at-time', name: 'One Mile at a Time', url: 'https://onemileatatime.com/feed/', category: 'general' },

  // ── Maritime / Shipping ───────────────────────────────────────────────────
  { id: 'maritime-executive', name: 'Maritime Executive', url: 'https://maritime-executive.com/feed', category: 'business' },
  { id: 'splash247', name: 'Splash247', url: 'https://splash247.com/feed/', category: 'business' },
  { id: 'gcaptain', name: 'gCaptain', url: 'https://gcaptain.com/feed/', category: 'business' },
  { id: 'lloyds-list', name: 'Lloyds List', url: 'https://lloydslist.maritimeintelligence.informa.com/rss', category: 'business' },
  { id: 'freightwaves', name: 'FreightWaves', url: 'https://www.freightwaves.com/feed', category: 'business' },

  // ── Supply Chain / Logistics ──────────────────────────────────────────────
  { id: 'supply-chain-dive', name: 'Supply Chain Dive', url: 'https://www.supplychaindive.com/feeds/news/', category: 'business' },
  { id: 'logistics-mgmt', name: 'Logistics Management', url: 'https://www.logisticsmgmt.com/rss', category: 'business' },
  { id: 'dc-velocity', name: 'DC Velocity', url: 'https://www.dcvelocity.com/rss/', category: 'business' },

  // ── Mining / Natural Resources ────────────────────────────────────────────
  { id: 'mining-com', name: 'Mining.com', url: 'https://www.mining.com/feed/', category: 'business' },
  { id: 'mining-weekly', name: 'Mining Weekly', url: 'https://www.miningweekly.com/rss', category: 'business' },
  { id: 'northern-miner', name: 'Northern Miner', url: 'https://www.northernminer.com/feed/', category: 'business' },

  // ── Telecom ───────────────────────────────────────────────────────────────
  { id: 'light-reading', name: 'Light Reading', url: 'https://www.lightreading.com/rss.xml', category: 'technology' },
  { id: 'fierce-telecom', name: 'Fierce Telecom', url: 'https://www.fiercetelecom.com/rss/xml', category: 'technology' },
  { id: 'telecom-tv', name: 'TelecomTV', url: 'https://www.telecomtv.com/rss', category: 'technology' },
  { id: 'sdx-central', name: 'SDxCentral', url: 'https://www.sdxcentral.com/feed/', category: 'technology' },

  // ── Robotics / Drones ─────────────────────────────────────────────────────
  { id: 'robotics-biz-review', name: 'Robotics Business Review', url: 'https://www.roboticsbusinessreview.com/feed/', category: 'technology' },
  { id: 'the-robot-report', name: 'The Robot Report', url: 'https://www.therobotreport.com/feed/', category: 'technology' },
  { id: 'drone-dj', name: 'DroneDJ', url: 'https://dronedj.com/feed/', category: 'technology' },
  { id: 'suas-news', name: 'sUAS News', url: 'https://www.suasnews.com/feed/', category: 'technology' },

  // ── Biotech / Pharma ──────────────────────────────────────────────────────
  { id: 'fierce-biotech', name: 'Fierce Biotech', url: 'https://www.fiercebiotech.com/rss/xml', category: 'health' },
  { id: 'biopharm-dive', name: 'BioPharma Dive', url: 'https://www.biopharmadive.com/feeds/news/', category: 'health' },
  { id: 'genengnews', name: 'GEN News', url: 'https://www.genengnews.com/feed/', category: 'health' },
  { id: 'pharma-times', name: 'PharmaTimes', url: 'https://www.pharmatimes.com/rss', category: 'health' },

  // ── Retail / E-commerce ───────────────────────────────────────────────────
  { id: 'retail-dive', name: 'Retail Dive', url: 'https://www.retaildive.com/feeds/news/', category: 'business' },
  { id: 'retail-wire', name: 'RetailWire', url: 'https://retailwire.com/feed/', category: 'business' },
  { id: 'modern-retail', name: 'Modern Retail', url: 'https://www.modernretail.co/feed/', category: 'business' },
  { id: 'practical-ecommerce', name: 'Practical Ecommerce', url: 'https://www.practicalecommerce.com/feed', category: 'business' },

  // ── Design / Architecture ─────────────────────────────────────────────────
  { id: 'dezeen', name: 'Dezeen', url: 'https://www.dezeen.com/feed/', category: 'entertainment' },
  { id: 'archdaily', name: 'ArchDaily', url: 'https://www.archdaily.com/feed', category: 'entertainment' },
  { id: 'designboom', name: 'Designboom', url: 'https://www.designboom.com/feed/', category: 'entertainment' },
  { id: 'core77', name: 'Core77', url: 'https://www.core77.com/rss', category: 'entertainment' },

  // ── Weather / Natural Disasters ───────────────────────────────────────────
  { id: 'weather-underground-blog', name: 'Weather Underground Blog', url: 'https://www.wunderground.com/blog/feed/rss', category: 'science' },
  { id: 'reliefweb-disasters', name: 'ReliefWeb Disasters', url: 'https://reliefweb.int/disasters/rss.xml', category: 'world' },
  { id: 'severe-weather-europe', name: 'Severe Weather Europe', url: 'https://www.severe-weather.eu/feed/', category: 'science' },

  // ── Privacy / Digital Rights ──────────────────────────────────────────────
  { id: 'eff-deeplinks', name: 'EFF Deeplinks', url: 'https://www.eff.org/rss/updates.xml', category: 'technology' },
  { id: 'privacy-intl', name: 'Privacy International', url: 'https://privacyinternational.org/rss.xml', category: 'technology' },
  { id: 'techdirt', name: 'Techdirt', url: 'https://www.techdirt.com/feed/', category: 'technology' },

  // ── Podcasting / Audio ────────────────────────────────────────────────────
  { id: 'podnews', name: 'Podnews', url: 'https://podnews.net/rss', category: 'entertainment' },
  { id: 'hot-pod', name: 'Hot Pod', url: 'https://hotpodnews.com/feed/', category: 'entertainment' },

  // ── US Regional Newspapers (Major Cities) ─────────────────────────────────
  { id: 'sf-chronicle', name: 'San Francisco Chronicle', url: 'https://www.sfchronicle.com/bayarea/feed/Bay-Area-News-702.php', category: 'world' },
  { id: 'miami-herald', name: 'Miami Herald', url: 'https://www.miamiherald.com/latest-news/article1928.ece/ALTERNATES/FREE_1140/rss.xml', category: 'world' },
  { id: 'ajc', name: 'Atlanta Journal-Constitution', url: 'https://www.ajc.com/news/?outputType=rss', category: 'world' },
  { id: 'star-tribune-local', name: 'Star Tribune Local', url: 'https://www.startribune.com/local/rss/', category: 'world' },
  { id: 'pittsburgh-post-gazette', name: 'Pittsburgh Post-Gazette', url: 'https://www.post-gazette.com/rss/nation', category: 'world' },
  { id: 'stl-post-dispatch', name: 'St. Louis Post-Dispatch', url: 'https://www.stltoday.com/search/?f=rss', category: 'world' },
  { id: 'sj-mercury-news', name: 'San Jose Mercury News', url: 'https://www.mercurynews.com/feed/', category: 'world' },
  { id: 'oc-register', name: 'Orange County Register', url: 'https://www.ocregister.com/feed/', category: 'world' },
  { id: 'tampa-bay-times', name: 'Tampa Bay Times', url: 'https://www.tampabay.com/latest/feed/', category: 'world' },
  { id: 'arizona-republic', name: 'Arizona Republic', url: 'https://rssfeeds.azcentral.com/phoenix/home', category: 'world' },
  { id: 'indianapolis-star', name: 'Indianapolis Star', url: 'https://rssfeeds.indystar.com/indystar/todaysstories', category: 'world' },
  { id: 'milwaukee-journal', name: 'Milwaukee Journal Sentinel', url: 'https://www.jsonline.com/news/?outputType=rss', category: 'world' },
  { id: 'sacramento-bee', name: 'Sacramento Bee', url: 'https://www.sacbee.com/latest-news/article1928.ece/ALTERNATES/FREE_1140/rss.xml', category: 'world' },
  { id: 'kansas-city-star', name: 'Kansas City Star', url: 'https://www.kansascity.com/latest-news/article1928.ece/ALTERNATES/FREE_1140/rss.xml', category: 'world' },
  { id: 'the-oregonian', name: 'The Oregonian', url: 'https://www.oregonlive.com/arc/outboundfeeds/rss/?outputType=xml', category: 'world' },
  { id: 'cleveland-plain-dealer', name: 'Cleveland Plain Dealer', url: 'https://www.cleveland.com/arc/outboundfeeds/rss/?outputType=xml', category: 'world' },
  { id: 'lv-review-journal', name: 'Las Vegas Review-Journal', url: 'https://www.reviewjournal.com/feed/', category: 'world' },
  { id: 'honolulu-star', name: 'Honolulu Star-Advertiser', url: 'https://www.staradvertiser.com/feed/', category: 'world' },
  { id: 'des-moines-register', name: 'Des Moines Register', url: 'https://rssfeeds.desmoinesregister.com/dmreg/home', category: 'world' },
  { id: 'the-tennessean', name: 'The Tennessean', url: 'https://rssfeeds.tennessean.com/tennessean/home', category: 'world' },
  { id: 'austin-statesman', name: 'Austin American-Statesman', url: 'https://www.statesman.com/arcio/rss/', category: 'world' },
  { id: 'hartford-courant', name: 'Hartford Courant', url: 'https://www.courant.com/arcio/rss/', category: 'world' },
  { id: 'abq-journal', name: 'Albuquerque Journal', url: 'https://www.abqjournal.com/feed', category: 'world' },
  { id: 'salt-lake-tribune', name: 'The Salt Lake Tribune', url: 'https://www.sltrib.com/feed/', category: 'world' },
  { id: 'arkansas-democrat', name: 'Arkansas Democrat-Gazette', url: 'https://www.arkansasonline.com/rss/', category: 'world' },
  { id: 'virginian-pilot', name: 'The Virginian-Pilot', url: 'https://www.pilotonline.com/arcio/rss/', category: 'world' },

  // ── US TV Station Feeds ───────────────────────────────────────────────────
  { id: 'abc7-la', name: 'ABC7 Los Angeles', url: 'https://abc7.com/feed/', category: 'world' },
  { id: 'nbc-chicago', name: 'NBC Chicago', url: 'https://www.nbcchicago.com/news/local/?rss=y', category: 'world' },
  { id: 'fox5-ny', name: 'Fox 5 New York', url: 'https://www.fox5ny.com/news.rss', category: 'world' },
  { id: 'wral-nc', name: 'WRAL North Carolina', url: 'https://www.wral.com/news/rss/13548441/', category: 'world' },
  { id: 'khou-houston', name: 'KHOU Houston', url: 'https://www.khou.com/feeds/syndication/rss/news', category: 'world' },
  { id: 'king5-seattle', name: 'KING 5 Seattle', url: 'https://www.king5.com/feeds/syndication/rss/news', category: 'world' },
  { id: 'wgbh-boston', name: 'WGBH Boston', url: 'https://www.wgbh.org/news/feed', category: 'world' },

  // ── US Political / Opinion / Think Tanks ──────────────────────────────────
  { id: 'realclearpolitics', name: 'RealClearPolitics', url: 'https://www.realclearpolitics.com/index.xml', category: 'politics' },
  { id: 'the-dispatch', name: 'The Dispatch', url: 'https://thedispatch.com/feed/', category: 'politics' },
  { id: 'the-bulwark', name: 'The Bulwark', url: 'https://www.thebulwark.com/feed/', category: 'politics' },
  { id: 'lawfare', name: 'Lawfare', url: 'https://www.lawfaremedia.org/feed', category: 'politics' },
  { id: 'brookings', name: 'Brookings Institution', url: 'https://www.brookings.edu/feed/', category: 'politics' },
  { id: 'rand-corp', name: 'RAND Corporation', url: 'https://www.rand.org/news/press.xml', category: 'politics' },
  { id: 'heritage-foundation', name: 'Heritage Foundation', url: 'https://www.heritage.org/rss/all-commentary', category: 'politics' },
  { id: 'center-american-progress', name: 'Center for American Progress', url: 'https://www.americanprogress.org/feed/', category: 'politics' },

  // ── US Business / Finance ─────────────────────────────────────────────────
  { id: 'thestreet', name: 'TheStreet', url: 'https://www.thestreet.com/feeds/rss', category: 'business' },
  { id: 'motley-fool', name: 'Motley Fool', url: 'https://www.fool.com/feeds/index.aspx', category: 'business' },
  { id: 'kiplinger', name: 'Kiplinger', url: 'https://www.kiplinger.com/fronts/feed/kiplinger_rss.xml', category: 'business' },
  { id: 'american-banker', name: 'American Banker', url: 'https://www.americanbanker.com/feed', category: 'business' },

  // ── US Education / Higher Ed ──────────────────────────────────────────────
  { id: 'chronicle-higher-ed', name: 'Chronicle of Higher Education', url: 'https://www.chronicle.com/feed', category: 'science' },
  { id: 'inside-higher-ed', name: 'Inside Higher Ed', url: 'https://www.insidehighered.com/rss/news', category: 'science' },
  { id: 'ed-week', name: 'Education Week', url: 'https://www.edweek.org/feed', category: 'science' },

  // ── Additional US Regional Newspapers ─────────────────────────────────────
  { id: 'boston-globe', name: 'Boston Globe', url: 'https://www.bostonglobe.com/arc/outboundfeeds/rss/homepage/?outputType=xml', category: 'world' },
  { id: 'denver-post', name: 'Denver Post', url: 'https://www.denverpost.com/feed/', category: 'world' },
  { id: 'san-diego-union', name: 'San Diego Union-Tribune', url: 'https://www.sandiegouniontribune.com/feed/', category: 'world' },
  { id: 'charlotte-observer', name: 'Charlotte Observer', url: 'https://www.charlotteobserver.com/latest-news/article1928.ece/ALTERNATES/FREE_1140/rss.xml', category: 'world' },
  { id: 'orlando-sentinel', name: 'Orlando Sentinel', url: 'https://www.orlandosentinel.com/arcio/rss/', category: 'world' },
  { id: 'baltimore-sun', name: 'Baltimore Sun', url: 'https://www.baltimoresun.com/arcio/rss/', category: 'world' },
  { id: 'columbus-dispatch', name: 'Columbus Dispatch', url: 'https://www.dispatch.com/arcio/rss/', category: 'world' },
  { id: 'cincinnati-enquirer', name: 'Cincinnati Enquirer', url: 'https://www.cincinnati.com/arcio/rss/', category: 'world' },
  { id: 'new-orleans-advocate', name: 'New Orleans Advocate', url: 'https://www.nola.com/arc/outboundfeeds/rss/?outputType=xml', category: 'world' },
  { id: 'buffalo-news', name: 'Buffalo News', url: 'https://buffalonews.com/search/?f=rss', category: 'world' },
  { id: 'omaha-world-herald', name: 'Omaha World-Herald', url: 'https://omaha.com/search/?f=rss', category: 'world' },
  { id: 'richmond-times', name: 'Richmond Times-Dispatch', url: 'https://richmond.com/search/?f=rss', category: 'world' },
  { id: 'raleigh-news-observer', name: 'Raleigh News & Observer', url: 'https://www.newsobserver.com/latest-news/article1928.ece/ALTERNATES/FREE_1140/rss.xml', category: 'world' },
  { id: 'lexington-herald', name: 'Lexington Herald-Leader', url: 'https://www.kentucky.com/latest-news/article1928.ece/ALTERNATES/FREE_1140/rss.xml', category: 'world' },
  { id: 'memphis-commercial', name: 'Memphis Commercial Appeal', url: 'https://rssfeeds.commercialappeal.com/commercialappeal/home', category: 'world' },
  { id: 'fresno-bee', name: 'Fresno Bee', url: 'https://www.fresnobee.com/latest-news/article1928.ece/ALTERNATES/FREE_1140/rss.xml', category: 'world' },
  { id: 'providence-journal', name: 'Providence Journal', url: 'https://www.providencejournal.com/arcio/rss/', category: 'world' },
  { id: 'oklahoman', name: 'The Oklahoman', url: 'https://www.oklahoman.com/arcio/rss/', category: 'world' },
  { id: 'louisville-courier', name: 'Louisville Courier Journal', url: 'https://rssfeeds.courier-journal.com/courier-journal/home', category: 'world' },
  { id: 'knoxville-news', name: 'Knoxville News Sentinel', url: 'https://rssfeeds.knoxnews.com/knoxnews/home', category: 'world' },
  { id: 'jacksonville-times', name: 'Florida Times-Union', url: 'https://www.jacksonville.com/arcio/rss/', category: 'world' },
  { id: 'spokane-spokesman', name: 'Spokane Spokesman-Review', url: 'https://www.spokesman.com/feeds/stories/', category: 'world' },
  { id: 'tucson-star', name: 'Arizona Daily Star', url: 'https://tucson.com/search/?f=rss', category: 'world' },
  { id: 'el-paso-times', name: 'El Paso Times', url: 'https://rssfeeds.elpasotimes.com/elpasotimes/home', category: 'world' },
  { id: 'dayton-daily', name: 'Dayton Daily News', url: 'https://www.daytondailynews.com/news/?outputType=rss', category: 'world' },
  { id: 'wichita-eagle', name: 'Wichita Eagle', url: 'https://www.kansas.com/latest-news/article1928.ece/ALTERNATES/FREE_1140/rss.xml', category: 'world' },
  { id: 'tulsa-world', name: 'Tulsa World', url: 'https://tulsaworld.com/search/?f=rss', category: 'world' },
  { id: 'akron-beacon', name: 'Akron Beacon Journal', url: 'https://www.beaconjournal.com/arcio/rss/', category: 'world' },
  { id: 'boise-statesman', name: 'Idaho Statesman', url: 'https://www.idahostatesman.com/latest-news/article1928.ece/ALTERNATES/FREE_1140/rss.xml', category: 'world' },
  { id: 'anchorage-daily', name: 'Anchorage Daily News', url: 'https://www.adn.com/arc/outboundfeeds/rss/?outputType=xml', category: 'world' },
  { id: 'sioux-falls-argus', name: 'Sioux Falls Argus Leader', url: 'https://rssfeeds.argusleader.com/argusleader/home', category: 'world' },
  { id: 'burlington-free-press', name: 'Burlington Free Press', url: 'https://rssfeeds.burlingtonfreepress.com/burlingtonfreepress/home', category: 'world' },
  { id: 'charleston-gazette', name: 'Charleston Gazette-Mail', url: 'https://www.wvgazettemail.com/search/?f=rss', category: 'world' },
  { id: 'billings-gazette', name: 'Billings Gazette', url: 'https://billingsgazette.com/search/?f=rss', category: 'world' },
  { id: 'reno-gazette', name: 'Reno Gazette-Journal', url: 'https://rssfeeds.rgj.com/reno/home', category: 'world' },
  { id: 'rapid-city-journal', name: 'Rapid City Journal', url: 'https://rapidcityjournal.com/search/?f=rss', category: 'world' },
  { id: 'bismarck-tribune', name: 'Bismarck Tribune', url: 'https://bismarcktribune.com/search/?f=rss', category: 'world' },
  { id: 'green-bay-press', name: 'Green Bay Press-Gazette', url: 'https://rssfeeds.greenbaypressgazette.com/greenbaypressgazette/home', category: 'world' },
  { id: 'madison-state-journal', name: 'Wisconsin State Journal', url: 'https://madison.com/search/?f=rss', category: 'world' },
  { id: 'fargo-forum', name: 'Fargo Forum', url: 'https://www.inforum.com/rss', category: 'world' },
  { id: 'duluth-news', name: 'Duluth News Tribune', url: 'https://www.duluthnewstribune.com/rss', category: 'world' },
  { id: 'cedar-rapids-gazette', name: 'Cedar Rapids Gazette', url: 'https://www.thegazette.com/feed/', category: 'world' },
  { id: 'quad-city-times', name: 'Quad-City Times', url: 'https://qctimes.com/search/?f=rss', category: 'world' },
  { id: 'peoria-journal', name: 'Peoria Journal Star', url: 'https://www.pjstar.com/arcio/rss/', category: 'world' },
  { id: 'springfield-news-leader', name: 'Springfield News-Leader', url: 'https://rssfeeds.news-leader.com/springfieldnewsleader/home', category: 'world' },
  { id: 'topeka-capital', name: 'Topeka Capital-Journal', url: 'https://www.cjonline.com/arcio/rss/', category: 'world' },
  { id: 'lincoln-journal-star', name: 'Lincoln Journal Star', url: 'https://journalstar.com/search/?f=rss', category: 'world' },
  { id: 'colorado-springs-gazette', name: 'Colorado Springs Gazette', url: 'https://gazette.com/search/?f=rss', category: 'world' },

  // ── US TV Stations (Additional) ───────────────────────────────────────────
  { id: 'nbc-dallas', name: 'NBC DFW', url: 'https://www.nbcdfw.com/news/local/?rss=y', category: 'world' },
  { id: 'nbc-la', name: 'NBC Los Angeles', url: 'https://www.nbclosangeles.com/news/local/?rss=y', category: 'world' },
  { id: 'nbc-bay-area', name: 'NBC Bay Area', url: 'https://www.nbcbayarea.com/news/local/?rss=y', category: 'world' },
  { id: 'nbc-miami', name: 'NBC Miami', url: 'https://www.nbcmiami.com/news/local/?rss=y', category: 'world' },
  { id: 'nbc-boston', name: 'NBC Boston', url: 'https://www.nbcboston.com/news/local/?rss=y', category: 'world' },
  { id: 'nbc-philly', name: 'NBC Philadelphia', url: 'https://www.nbcphiladelphia.com/news/local/?rss=y', category: 'world' },
  { id: 'nbc-wash', name: 'NBC Washington', url: 'https://www.nbcwashington.com/news/local/?rss=y', category: 'world' },
  { id: 'nbc-ct', name: 'NBC Connecticut', url: 'https://www.nbcconnecticut.com/news/local/?rss=y', category: 'world' },
  { id: 'nbc-sd', name: 'NBC San Diego', url: 'https://www.nbcsandiego.com/news/local/?rss=y', category: 'world' },
  { id: 'abc13-houston', name: 'ABC13 Houston', url: 'https://abc13.com/feed/', category: 'world' },
  { id: 'abc11-raleigh', name: 'ABC11 Raleigh', url: 'https://abc11.com/feed/', category: 'world' },
  { id: 'abc30-fresno', name: 'ABC30 Fresno', url: 'https://abc30.com/feed/', category: 'world' },
  { id: 'fox2-detroit', name: 'Fox 2 Detroit', url: 'https://www.fox2detroit.com/news.rss', category: 'world' },
  { id: 'fox4-dallas', name: 'Fox 4 Dallas', url: 'https://www.fox4news.com/news.rss', category: 'world' },
  { id: 'fox5-atlanta', name: 'Fox 5 Atlanta', url: 'https://www.fox5atlanta.com/news.rss', category: 'world' },
  { id: 'fox5-dc', name: 'Fox 5 DC', url: 'https://www.fox5dc.com/news.rss', category: 'world' },
  { id: 'fox6-milwaukee', name: 'Fox 6 Milwaukee', url: 'https://www.fox6now.com/news.rss', category: 'world' },
  { id: 'fox7-austin', name: 'Fox 7 Austin', url: 'https://www.fox7austin.com/news.rss', category: 'world' },
  { id: 'fox9-minneapolis', name: 'Fox 9 Minneapolis', url: 'https://www.fox9.com/news.rss', category: 'world' },
  { id: 'fox10-phoenix', name: 'Fox 10 Phoenix', url: 'https://www.fox10phoenix.com/news.rss', category: 'world' },
  { id: 'fox13-tampa', name: 'Fox 13 Tampa', url: 'https://www.fox13news.com/news.rss', category: 'world' },
  { id: 'fox13-seattle', name: 'Fox 13 Seattle', url: 'https://www.q13fox.com/news.rss', category: 'world' },
  { id: 'fox26-houston', name: 'Fox 26 Houston', url: 'https://www.fox26houston.com/news.rss', category: 'world' },
  { id: 'fox29-philly', name: 'Fox 29 Philadelphia', url: 'https://www.fox29.com/news.rss', category: 'world' },
  { id: 'fox32-chicago', name: 'Fox 32 Chicago', url: 'https://www.fox32chicago.com/news.rss', category: 'world' },
  { id: 'fox35-orlando', name: 'Fox 35 Orlando', url: 'https://www.fox35orlando.com/news.rss', category: 'world' },

  // ── US Public Radio Stations ──────────────────────────────────────────────
  { id: 'kpbs-sd', name: 'KPBS San Diego', url: 'https://www.kpbs.org/news/feed/', category: 'world' },
  { id: 'kqed-sf', name: 'KQED San Francisco', url: 'https://www.kqed.org/news/feed', category: 'world' },
  { id: 'wnyc-ny', name: 'WNYC New York', url: 'https://feeds.wnyc.org/wnyc-news', category: 'world' },
  { id: 'wbur-boston', name: 'WBUR Boston', url: 'https://www.wbur.org/feed/news', category: 'world' },
  { id: 'whyy-philly', name: 'WHYY Philadelphia', url: 'https://whyy.org/feed/', category: 'world' },
  { id: 'wamu-dc', name: 'WAMU Washington DC', url: 'https://wamu.org/feed/', category: 'world' },
  { id: 'kut-austin', name: 'KUT Austin', url: 'https://www.kut.org/feed/', category: 'world' },
  { id: 'opb-portland', name: 'OPB Oregon', url: 'https://www.opb.org/rss/', category: 'world' },
  { id: 'kuow-seattle', name: 'KUOW Seattle', url: 'https://www.kuow.org/rss.xml', category: 'world' },
  { id: 'wlrn-miami', name: 'WLRN Miami', url: 'https://www.wlrn.org/feed/', category: 'world' },

  // ── More US Regional / State Papers ───────────────────────────────────────
  { id: 'houston-chronicle', name: 'Houston Chronicle', url: 'https://www.houstonchronicle.com/rss/feed/Houston-breaking-news-702.php', category: 'world' },
  { id: 'san-antonio-express', name: 'San Antonio Express-News', url: 'https://www.expressnews.com/rss/feed/Express-News-Headlines-702.php', category: 'world' },
  { id: 'albany-times', name: 'Albany Times Union', url: 'https://www.timesunion.com/rss/feed/News-702.php', category: 'world' },
  { id: 'fort-worth-star', name: 'Fort Worth Star-Telegram', url: 'https://www.star-telegram.com/latest-news/article1928.ece/ALTERNATES/FREE_1140/rss.xml', category: 'world' },
  { id: 'palm-beach-post', name: 'Palm Beach Post', url: 'https://www.palmbeachpost.com/arcio/rss/', category: 'world' },
  { id: 'south-florida-sun', name: 'South Florida Sun Sentinel', url: 'https://www.sun-sentinel.com/arcio/rss/', category: 'world' },
  { id: 'sarasota-herald', name: 'Sarasota Herald-Tribune', url: 'https://www.heraldtribune.com/arcio/rss/', category: 'world' },
  { id: 'savannah-morning', name: 'Savannah Morning News', url: 'https://www.savannahnow.com/arcio/rss/', category: 'world' },
  { id: 'macon-telegraph', name: 'Macon Telegraph', url: 'https://www.macon.com/latest-news/article1928.ece/ALTERNATES/FREE_1140/rss.xml', category: 'world' },
  { id: 'augusta-chronicle', name: 'Augusta Chronicle', url: 'https://www.augustachronicle.com/arcio/rss/', category: 'world' },
  { id: 'greenville-news', name: 'Greenville News', url: 'https://rssfeeds.greenvillenews.com/greenvillenews/home', category: 'world' },
  { id: 'charleston-post-courier', name: 'Charleston Post and Courier', url: 'https://www.postandcourier.com/search/?f=rss', category: 'world' },
  { id: 'eugene-register-guard', name: 'Eugene Register-Guard', url: 'https://www.registerguard.com/arcio/rss/', category: 'world' },
  { id: 'tacoma-news-tribune', name: 'Tacoma News Tribune', url: 'https://www.thenewstribune.com/latest-news/article1928.ece/ALTERNATES/FREE_1140/rss.xml', category: 'world' },
  { id: 'harrisburg-patriot', name: 'Harrisburg Patriot-News', url: 'https://www.pennlive.com/arc/outboundfeeds/rss/?outputType=xml', category: 'world' },
  { id: 'allentown-morning-call', name: 'Allentown Morning Call', url: 'https://www.mcall.com/arcio/rss/', category: 'world' },
  { id: 'worcester-telegram', name: 'Worcester Telegram', url: 'https://www.telegram.com/arcio/rss/', category: 'world' },
  { id: 'grand-rapids-press', name: 'Grand Rapids Press', url: 'https://www.mlive.com/arc/outboundfeeds/rss/?outputType=xml', category: 'world' },
  { id: 'toledo-blade', name: 'Toledo Blade', url: 'https://www.toledoblade.com/RSS', category: 'world' },
  { id: 'erie-times', name: 'Erie Times-News', url: 'https://www.goerie.com/arcio/rss/', category: 'world' },
  { id: 'mobile-press', name: 'Mobile Press-Register', url: 'https://www.al.com/arc/outboundfeeds/rss/?outputType=xml', category: 'world' },
  { id: 'jackson-clarion', name: 'Jackson Clarion-Ledger', url: 'https://rssfeeds.clarionledger.com/clarionledger/home', category: 'world' },
  { id: 'biloxi-sun-herald', name: 'Biloxi Sun Herald', url: 'https://www.sunherald.com/latest-news/article1928.ece/ALTERNATES/FREE_1140/rss.xml', category: 'world' },
  { id: 'baton-rouge-advocate', name: 'Baton Rouge Advocate', url: 'https://www.theadvocate.com/search/?f=rss', category: 'world' },
  { id: 'corpus-christi-caller', name: 'Corpus Christi Caller-Times', url: 'https://rssfeeds.caller.com/caller/home', category: 'world' },
  { id: 'lubbock-avalanche', name: 'Lubbock Avalanche-Journal', url: 'https://www.lubbockonline.com/arcio/rss/', category: 'world' },
  { id: 'las-cruces-sun', name: 'Las Cruces Sun-News', url: 'https://rssfeeds.lcsun-news.com/lcsun-news/home', category: 'world' },
  { id: 'missoula-missoulian', name: 'Missoulian', url: 'https://missoulian.com/search/?f=rss', category: 'world' },
  { id: 'helena-independent', name: 'Helena Independent Record', url: 'https://helenair.com/search/?f=rss', category: 'world' },
  { id: 'casper-star-tribune', name: 'Casper Star-Tribune', url: 'https://trib.com/search/?f=rss', category: 'world' },
  { id: 'great-falls-tribune', name: 'Great Falls Tribune', url: 'https://rssfeeds.greatfallstribune.com/greatfallstribune/home', category: 'world' },
  { id: 'portland-press-herald', name: 'Portland Press Herald', url: 'https://www.pressherald.com/feed/', category: 'world' },
  { id: 'concord-monitor', name: 'Concord Monitor', url: 'https://www.concordmonitor.com/arcio/rss/', category: 'world' },
  { id: 'bangor-daily', name: 'Bangor Daily News', url: 'https://bangordailynews.com/feed/', category: 'world' },
  { id: 'northjersey', name: 'North Jersey Record', url: 'https://rssfeeds.northjersey.com/northjersey/home', category: 'world' },
  { id: 'asbury-park-press', name: 'Asbury Park Press', url: 'https://rssfeeds.app.com/asburyparkpress/home', category: 'world' },
  { id: 'wilmington-news-journal', name: 'Wilmington News Journal', url: 'https://rssfeeds.delawareonline.com/delawareonline/home', category: 'world' },
  { id: 'tallahassee-democrat', name: 'Tallahassee Democrat', url: 'https://rssfeeds.tallahassee.com/tallahasseedemocrat/home', category: 'world' },
  { id: 'pensacola-news-journal', name: 'Pensacola News Journal', url: 'https://rssfeeds.pnj.com/pnj/home', category: 'world' },
  { id: 'ft-myers-news-press', name: 'Fort Myers News-Press', url: 'https://rssfeeds.news-press.com/newspress/home', category: 'world' },
  { id: 'gainesville-sun', name: 'Gainesville Sun', url: 'https://www.gainesville.com/arcio/rss/', category: 'world' },
  { id: 'daytona-beach-news', name: 'Daytona Beach News-Journal', url: 'https://www.news-journalonline.com/arcio/rss/', category: 'world' },

];
// ── Fetch RSS feeds ──────────────────────────────────────────────────────────

async function fetchRSSFeed(feed) {
  try {
    // ── Cache check: reuse if fetched < 2 min ago ──
    const cached = feedCache.get(feed.url);
    if (cached && (Date.now() - cached.ts) < FEED_CACHE_TTL_MS) {
      return cached.articles;
    }

    // ── Timeout: skip feeds that take > 10s ──
    const result = await Promise.race([
      rssParser.parseURL(feed.url),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Feed timeout')), FEED_TIMEOUT_MS)
      ),
    ]);

    const articles = (result.items || []).slice(0, 50).map((item, idx) => {
      const title = item.title || '';
      const description = item.contentSnippet || item.content || '';
      const location = extractLocation(`${title} ${description}`);
      const category = detectCategory(title, description);

      return {
        id: `${feed.id}-${idx}`,
        title,
        description: description.slice(0, 300),
        url: item.link || '',
        imageUrl: item.enclosure?.url || null,
        publishedAt: item.isoDate || new Date().toISOString(),
        source: { id: feed.id, name: feed.name },
        author: item.creator || null,
        category,
        country: '',
        _location: location,
        _category: category,
      };
    });

    // Store in cache
    feedCache.set(feed.url, { ts: Date.now(), articles });
    return articles;
  } catch (err) {
    console.error(`[RSS] Failed to fetch ${feed.name}:`, err.message);
    // On failure, return stale cache if available
    const stale = feedCache.get(feed.url);
    if (stale) return stale.articles;
    return [];
  }
}

// ── Concurrency-limited parallel executor ────────────────────────────────────

async function runWithConcurrency(tasks, limit) {
  const results = [];
  let idx = 0;

  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      try {
        results[i] = { status: 'fulfilled', value: await tasks[i]() };
      } catch (err) {
        results[i] = { status: 'rejected', reason: err };
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function fetchAllNews() {
  console.log(`[News] Fetching from ${RSS_FEEDS.length} RSS feeds...`);
  const startTime = Date.now();

  const tasks = RSS_FEEDS.map(feed => () => fetchRSSFeed(feed));
  const results = await runWithConcurrency(tasks, CONCURRENCY_LIMIT);

  const allArticles = [];
  let successCount = 0;

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.length > 0) {
      allArticles.push(...result.value);
      successCount++;
    }
  }

  console.log(`[News] Fetched ${allArticles.length} articles from ${successCount}/${RSS_FEEDS.length} feeds in ${Date.now() - startTime}ms`);

  // Only keep articles with locations (can be displayed on globe)
  const withLocation = allArticles.filter(a => a._location);
  const withoutLocation = allArticles.filter(a => !a._location);

  console.log(`[News] ${withLocation.length} articles geocoded, ${withoutLocation.length} without location`);

  // Cluster articles by topic, then merge nearby clusters by geography
  let clusters;
  try {
    const topicClusters = clusterArticles(withLocation);
    clusters = mergeNearbyClusters(topicClusters);
  } catch (err) {
    console.error('[News] Clustering error:', err.message);
    clusters = withLocation.map((a, i) => ({
      id: `fallback-${i}`,
      title: a.title,
      summary: a.description || a.title,
      articles: [a],
      location: a._location,
      category: a._category,
      importance: 1,
      firstPublished: a.publishedAt,
      lastUpdated: a.publishedAt,
      isBreaking: false,
    }));
  }

  console.log(`[News] ${clusters.length} clusters after processing`);

  // Format for API response
  const formatted = clusters.map(c => ({
    id: c.id,
    title: c.title,
    summary: c.summary && c.summary.length > DESC_TRUNCATE_LEN
      ? c.summary.slice(0, DESC_TRUNCATE_LEN) + '…'
      : c.summary,
    articles: c.articles
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .map(a => ({
      id: a.id,
      title: a.title,
      description: a.description && a.description.length > DESC_TRUNCATE_LEN
        ? a.description.slice(0, DESC_TRUNCATE_LEN) + '…'
        : a.description,
      url: a.url,
      imageUrl: a.imageUrl,
      publishedAt: a.publishedAt,
      source: a.source,
      author: a.author,
      category: a.category,
      country: a._location?.countryCode || '',
    })),
    location: c.location,
    category: c.category,
    importance: c.importance,
    firstPublished: c.firstPublished,
    lastUpdated: c.lastUpdated,
    isBreaking: c.isBreaking,
  }));

  if (formatted.length > 0) {
    latestNews = formatted;
    lastFetchTime = Date.now();
    console.log(`[News] Stored ${formatted.length} clusters`);
  }
}

// ── API Routes ───────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    clusters: latestNews.length,
    lastFetch: lastFetchTime,
    uptime: process.uptime(),
  });
});

app.get('/api/news', (req, res) => {
  const { category, timeFilter, search } = req.query;
  let filtered = [...latestNews];

  // Filter by category
  if (category && category !== 'all') {
    filtered = filtered.filter(c => c.category === category);
  }

  // Filter by time
  if (timeFilter) {
    const now = Date.now();
    const msMap = { '1h': 3600000, '6h': 21600000, '24h': 86400000, '7d': 604800000 };
    const cutoff = now - (msMap[timeFilter] || 86400000);
    filtered = filtered.filter(c => new Date(c.lastUpdated).getTime() >= cutoff);
  }

  // Filter by search
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.summary.toLowerCase().includes(q) ||
      c.articles.some(a => a.title.toLowerCase().includes(q))
    );
  }

  res.json({
    clusters: filtered,
    total: filtered.length,
    lastFetch: lastFetchTime,
  });
});

app.get('/api/news/stats', (req, res) => {
  const categories = {};
  for (const cluster of latestNews) {
    categories[cluster.category] = (categories[cluster.category] || 0) + 1;
  }

  const totalArticles = latestNews.reduce((sum, c) => sum + c.articles.length, 0);
  const sources = new Set();
  for (const cluster of latestNews) {
    for (const article of cluster.articles) {
      sources.add(article.source.name);
    }
  }

  res.json({
    totalClusters: latestNews.length,
    totalArticles,
    totalSources: sources.size,
    sourceNames: [...sources],
    categories,
    lastFetch: lastFetchTime,
    breakingCount: latestNews.filter(c => c.isBreaking).length,
  });
});

// ── Similar articles by URL ──────────────────────────────────────────────

app.get('/api/news/similar', async (req, res) => {
  const { url } = req.query;

  // Validate URL
  if (!url) {
    return res.status(400).json({ error: 'Missing required query parameter: url' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL provided' });
  }

  // Fetch the page with a 10-second timeout
  let html;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(parsedUrl.href, {
      signal: controller.signal,
      headers: { 'User-Agent': 'WorldGlobeNews/1.0' },
    });
    clearTimeout(timeout);
    html = await response.text();
  } catch (err) {
    const msg = err.name === 'AbortError' ? 'Request timed out (10s)' : err.message;
    return res.status(502).json({ error: `Failed to fetch URL: ${msg}` });
  }

  // Extract title from <title> tag
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/&#?\w+;/g, ' ').trim() : '';

  // Extract og:title
  const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']*?)["']/i)
    || html.match(/<meta\s+content=["']([^"']*?)["']\s+property=["']og:title["']/i);
  const ogTitle = ogTitleMatch ? ogTitleMatch[1].trim() : '';

  // Extract meta description
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*?)["']/i)
    || html.match(/<meta\s+content=["']([^"']*?)["']\s+name=["']description["']/i);
  const description = descMatch ? descMatch[1].trim() : '';

  // Use the best available title
  const bestTitle = ogTitle || title;
  if (!bestTitle) {
    return res.status(422).json({ error: 'Could not extract a title from the provided URL' });
  }

  // Combine title + description for keyword extraction
  const combinedText = `${bestTitle} ${description}`;
  const queryKeywords = getKeywords(combinedText);

  if (queryKeywords.size === 0) {
    return res.status(422).json({ error: 'Could not extract meaningful keywords from the page' });
  }

  // Compare against all clusters
  const scored = latestNews.map(cluster => {
    const clusterKeywords = getKeywords(`${cluster.title} ${cluster.summary}`);
    const similarity = jaccardSimilarity(queryKeywords, clusterKeywords);
    return { cluster, similarity };
  });

  // Sort by similarity descending, take top 10
  scored.sort((a, b) => b.similarity - a.similarity);
  const top = scored.slice(0, 10).filter(s => s.similarity > 0);

  const results = top.map(({ cluster, similarity }) => ({
    ...cluster,
    similarity: Math.round(similarity * 1000) / 1000,
  }));

  res.json({
    query: {
      url,
      title: bestTitle,
      keywords: [...queryKeywords],
    },
    similar: results,
    total: results.length,
  });
});

// ── Background polling ───────────────────────────────────────────────────────

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

async function initialFetch() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await fetchAllNews();
      if (latestNews.length > 0) {
        console.log(`[Boot] Initial fetch succeeded on attempt ${attempt}`);
        return;
      }
    } catch (err) {
      console.error(`[Boot] Attempt ${attempt} failed:`, err.message);
    }
    if (attempt < 3) {
      console.log(`[Boot] Retrying in 5s...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  console.log('[Boot] Starting with empty data, will retry on next poll');
}

// ── Start server ─────────────────────────────────────────────────────────────

app.listen(PORT, async () => {
  console.log(`[Server] World Globe News backend running on port ${PORT}`);
  await initialFetch();
  setInterval(fetchAllNews, POLL_INTERVAL);
});
