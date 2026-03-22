import express from 'express';
import cors from 'cors';
import compression from 'compression';
import fetch from 'node-fetch';
import Parser from 'rss-parser';

const app = express();
const PORT = process.env.PORT || 3009;
const rssParser = new Parser();

app.use(cors());
app.use(compression());
app.use(express.json());

// ── In-memory data store ─────────────────────────────────────────────────────

let latestNews = [];
let lastFetchTime = 0;

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
};

// ── Location extraction from text ────────────────────────────────────────────

function extractLocation(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  // Check cities first (more specific)
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (lower.includes(city)) {
      return {
        lat: coords.lat,
        lng: coords.lng,
        name: city.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
        countryCode: coords.country,
      };
    }
  }

  // Check country names
  for (const [code, info] of Object.entries(COUNTRY_COORDS)) {
    if (lower.includes(info.name.toLowerCase())) {
      return { lat: info.lat, lng: info.lng, name: info.name, countryCode: code };
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
      if (info) return { lat: info.lat, lng: info.lng, name: info.name, countryCode: code };
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

    // Find similar articles
    const wordsA = getKeywords(articles[i].title);

    for (let j = i + 1; j < articles.length; j++) {
      if (used.has(j)) continue;

      const wordsB = getKeywords(articles[j].title);
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
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
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
];

// ── Fetch RSS feeds ──────────────────────────────────────────────────────────

async function fetchRSSFeed(feed) {
  try {
    const result = await rssParser.parseURL(feed.url);
    return (result.items || []).slice(0, 25).map((item, idx) => {
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
  } catch (err) {
    console.error(`[RSS] Failed to fetch ${feed.name}:`, err.message);
    return [];
  }
}

async function fetchAllNews() {
  console.log(`[News] Fetching from ${RSS_FEEDS.length} RSS feeds...`);
  const startTime = Date.now();

  const results = await Promise.allSettled(
    RSS_FEEDS.map(feed => fetchRSSFeed(feed))
  );

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

  // Cluster articles
  const clusters = clusterArticles(withLocation);

  // Format for API response
  const formatted = clusters.map(c => ({
    id: c.id,
    title: c.title,
    summary: c.summary,
    articles: c.articles
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 10)
      .map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
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
