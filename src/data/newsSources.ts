import type { NewsBias, NewsSource } from '../types';

// ── Bias Colors & Labels ───────────────────────────────────────────────────

export const BIAS_COLORS: Record<NewsBias, string> = {
  left:         '#3b82f6', // blue
  'center-left':'#60a5fa', // light blue
  center:       '#a8a3b3', // gray
  'center-right':'#f87171',// light red
  right:        '#ef4444', // red
  independent:  '#6b6578', // muted
};

export const BIAS_LABELS: Record<NewsBias, string> = {
  left:          'Left',
  'center-left': 'Center-Left',
  center:        'Center',
  'center-right':'Center-Right',
  right:         'Right',
  independent:   'Independent',
};

// ── 50+ Global News Sources ─────────────────────────────────────────────────

export const NEWS_SOURCES: NewsSource[] = [
  // ── Wire Services ───────────────────────────────────────────────────────────
  { id: 'reuters',        name: 'Reuters',             color: '#FF8000', category: 'wire',      country: 'GB', reliabilityTier: 1, url: 'https://www.reuters.com',            bias: 'center' },
  { id: 'ap',             name: 'Associated Press',    color: '#EF3E42', category: 'wire',      country: 'US', reliabilityTier: 1, url: 'https://apnews.com',                 bias: 'center' },
  { id: 'afp',            name: 'AFP',                 color: '#325EA8', category: 'wire',      country: 'FR', reliabilityTier: 1, url: 'https://www.afp.com',                bias: 'center' },
  { id: 'upi',            name: 'UPI',                 color: '#E31937', category: 'wire',      country: 'US', reliabilityTier: 2, url: 'https://www.upi.com',                bias: 'center' },

  // ── US Broadcast ────────────────────────────────────────────────────────────
  { id: 'cnn',            name: 'CNN',                 color: '#CC0000', category: 'broadcast', country: 'US', reliabilityTier: 2, url: 'https://www.cnn.com',                bias: 'center-left' },
  { id: 'fox-news',       name: 'Fox News',            color: '#003366', category: 'broadcast', country: 'US', reliabilityTier: 3, url: 'https://www.foxnews.com',            bias: 'center-right' },
  { id: 'msnbc',          name: 'MSNBC',               color: '#0089CF', category: 'broadcast', country: 'US', reliabilityTier: 3, url: 'https://www.msnbc.com',              bias: 'left' },
  { id: 'nbc-news',       name: 'NBC News',            color: '#6A3D9A', category: 'broadcast', country: 'US', reliabilityTier: 2, url: 'https://www.nbcnews.com',            bias: 'center-left' },
  { id: 'abc-news',       name: 'ABC News',            color: '#000000', category: 'broadcast', country: 'US', reliabilityTier: 2, url: 'https://abcnews.go.com',             bias: 'center-left' },
  { id: 'cbs-news',       name: 'CBS News',            color: '#1A1A1A', category: 'broadcast', country: 'US', reliabilityTier: 2, url: 'https://www.cbsnews.com',            bias: 'center-left' },
  { id: 'npr',            name: 'NPR',                 color: '#1A1A1A', category: 'broadcast', country: 'US', reliabilityTier: 1, url: 'https://www.npr.org',                bias: 'center-left' },
  { id: 'pbs',            name: 'PBS NewsHour',        color: '#2638C4', category: 'broadcast', country: 'US', reliabilityTier: 1, url: 'https://www.pbs.org/newshour',       bias: 'center-left' },

  // ── US Print ────────────────────────────────────────────────────────────────
  { id: 'nyt',            name: 'The New York Times',  color: '#1A1A1A', category: 'print',     country: 'US', reliabilityTier: 1, url: 'https://www.nytimes.com',            bias: 'center-left' },
  { id: 'wapo',           name: 'Washington Post',     color: '#231F20', category: 'print',     country: 'US', reliabilityTier: 1, url: 'https://www.washingtonpost.com',     bias: 'center-left' },
  { id: 'wsj',            name: 'Wall Street Journal', color: '#0274B6', category: 'print',     country: 'US', reliabilityTier: 1, url: 'https://www.wsj.com',                bias: 'center' },
  { id: 'bloomberg',      name: 'Bloomberg',           color: '#472A91', category: 'print',     country: 'US', reliabilityTier: 1, url: 'https://www.bloomberg.com',          bias: 'center-left' },
  { id: 'usa-today',      name: 'USA Today',           color: '#009BFF', category: 'print',     country: 'US', reliabilityTier: 2, url: 'https://www.usatoday.com',           bias: 'center' },
  { id: 'politico',       name: 'Politico',            color: '#EE293D', category: 'print',     country: 'US', reliabilityTier: 2, url: 'https://www.politico.com',           bias: 'center-left' },

  // ── UK ──────────────────────────────────────────────────────────────────────
  { id: 'bbc',            name: 'BBC News',            color: '#BB1919', category: 'broadcast', country: 'GB', reliabilityTier: 1, url: 'https://www.bbc.com/news',           bias: 'center-left' },
  { id: 'sky-news',       name: 'Sky News',            color: '#9C0000', category: 'broadcast', country: 'GB', reliabilityTier: 2, url: 'https://news.sky.com',               bias: 'center' },
  { id: 'guardian',       name: 'The Guardian',        color: '#052962', category: 'print',     country: 'GB', reliabilityTier: 1, url: 'https://www.theguardian.com',        bias: 'center-left' },
  { id: 'telegraph',      name: 'The Telegraph',       color: '#1D8649', category: 'print',     country: 'GB', reliabilityTier: 2, url: 'https://www.telegraph.co.uk',        bias: 'center-right' },
  { id: 'ft',             name: 'Financial Times',     color: '#FFF1E5', category: 'print',     country: 'GB', reliabilityTier: 1, url: 'https://www.ft.com',                 bias: 'center' },
  { id: 'independent',    name: 'The Independent',     color: '#EC1A2E', category: 'digital',   country: 'GB', reliabilityTier: 2, url: 'https://www.independent.co.uk',      bias: 'center-left' },

  // ── Europe ──────────────────────────────────────────────────────────────────
  { id: 'dw',             name: 'DW',                  color: '#0090D4', category: 'broadcast', country: 'DE', reliabilityTier: 1, url: 'https://www.dw.com',                 bias: 'center' },
  { id: 'france24',       name: 'France 24',           color: '#00A7E1', category: 'broadcast', country: 'FR', reliabilityTier: 1, url: 'https://www.france24.com',           bias: 'center' },
  { id: 'euronews',       name: 'EuroNews',            color: '#003D7C', category: 'broadcast', country: 'FR', reliabilityTier: 2, url: 'https://www.euronews.com',           bias: 'center' },
  { id: 'el-pais',        name: 'El Pa\u00eds',              color: '#1A1A1A', category: 'print',     country: 'ES', reliabilityTier: 1, url: 'https://elpais.com',                 bias: 'center-left' },
  { id: 'der-spiegel',    name: 'Der Spiegel',         color: '#E64415', category: 'print',     country: 'DE', reliabilityTier: 1, url: 'https://www.spiegel.de',             bias: 'center-left' },
  { id: 'le-monde',       name: 'Le Monde',            color: '#1A1A1A', category: 'print',     country: 'FR', reliabilityTier: 1, url: 'https://www.lemonde.fr',             bias: 'center-left' },
  { id: 'ansa',           name: 'ANSA',                color: '#004B87', category: 'wire',      country: 'IT', reliabilityTier: 1, url: 'https://www.ansa.it',                bias: 'center' },

  // ── Middle East ─────────────────────────────────────────────────────────────
  { id: 'al-jazeera',     name: 'Al Jazeera',          color: '#D2A44E', category: 'broadcast', country: 'QA', reliabilityTier: 2, url: 'https://www.aljazeera.com',          bias: 'independent' },
  { id: 'al-arabiya',     name: 'Al Arabiya',          color: '#F47920', category: 'broadcast', country: 'SA', reliabilityTier: 2, url: 'https://english.alarabiya.net',      bias: 'independent' },
  { id: 'times-of-israel',name: 'Times of Israel',     color: '#195EA1', category: 'digital',   country: 'IL', reliabilityTier: 2, url: 'https://www.timesofisrael.com',      bias: 'independent' },

  // ── Asia-Pacific ────────────────────────────────────────────────────────────
  { id: 'nhk',            name: 'NHK World',           color: '#0068B7', category: 'broadcast', country: 'JP', reliabilityTier: 1, url: 'https://www3.nhk.or.jp/nhkworld',    bias: 'center' },
  { id: 'scmp',           name: 'South China Morning Post', color: '#FFCC00', category: 'print', country: 'HK', reliabilityTier: 2, url: 'https://www.scmp.com',              bias: 'independent' },
  { id: 'times-of-india', name: 'Times of India',      color: '#E03A3E', category: 'print',     country: 'IN', reliabilityTier: 2, url: 'https://timesofindia.indiatimes.com', bias: 'independent' },
  { id: 'straits-times',  name: 'The Straits Times',   color: '#1B3FAB', category: 'print',     country: 'SG', reliabilityTier: 1, url: 'https://www.straitstimes.com',       bias: 'center' },
  { id: 'yonhap',         name: 'Yonhap News',         color: '#0046A0', category: 'wire',      country: 'KR', reliabilityTier: 1, url: 'https://en.yna.co.kr',               bias: 'center' },
  { id: 'xinhua',         name: 'Xinhua',              color: '#DE2910', category: 'state',     country: 'CN', reliabilityTier: 3, url: 'http://www.xinhuanet.com',            bias: 'independent' },

  // ── Tech ────────────────────────────────────────────────────────────────────
  { id: 'techcrunch',     name: 'TechCrunch',          color: '#0A9E01', category: 'digital',   country: 'US', reliabilityTier: 2, url: 'https://techcrunch.com',             bias: 'independent' },
  { id: 'the-verge',      name: 'The Verge',           color: '#E5127D', category: 'digital',   country: 'US', reliabilityTier: 2, url: 'https://www.theverge.com',           bias: 'independent' },
  { id: 'ars-technica',   name: 'Ars Technica',        color: '#FF4E00', category: 'digital',   country: 'US', reliabilityTier: 1, url: 'https://arstechnica.com',            bias: 'independent' },
  { id: 'wired',          name: 'Wired',               color: '#000000', category: 'digital',   country: 'US', reliabilityTier: 2, url: 'https://www.wired.com',              bias: 'independent' },

  // ── Business ────────────────────────────────────────────────────────────────
  { id: 'cnbc',           name: 'CNBC',                color: '#005594', category: 'broadcast', country: 'US', reliabilityTier: 2, url: 'https://www.cnbc.com',               bias: 'center' },
  { id: 'marketwatch',    name: 'MarketWatch',         color: '#00AC4E', category: 'digital',   country: 'US', reliabilityTier: 2, url: 'https://www.marketwatch.com',        bias: 'center' },
  { id: 'forbes',         name: 'Forbes',              color: '#1A1A1A', category: 'digital',   country: 'US', reliabilityTier: 2, url: 'https://www.forbes.com',             bias: 'center' },

  // ── Additional Global Sources ───────────────────────────────────────────────
  { id: 'abc-au',         name: 'ABC Australia',       color: '#000000', category: 'broadcast', country: 'AU', reliabilityTier: 1, url: 'https://www.abc.net.au/news',        bias: 'center' },
  { id: 'cbc',            name: 'CBC News',            color: '#E21836', category: 'broadcast', country: 'CA', reliabilityTier: 1, url: 'https://www.cbc.ca/news',            bias: 'center-left' },
  { id: 'globe-and-mail', name: 'The Globe and Mail',  color: '#1A1A1A', category: 'print',     country: 'CA', reliabilityTier: 1, url: 'https://www.theglobeandmail.com',    bias: 'center' },
  { id: 'rt',             name: 'RT',                  color: '#6ABF31', category: 'state',     country: 'RU', reliabilityTier: 3, url: 'https://www.rt.com',                 bias: 'independent' },
  { id: 'tass',           name: 'TASS',                color: '#1E3A8A', category: 'state',     country: 'RU', reliabilityTier: 3, url: 'https://tass.com',                   bias: 'independent' },
];

// ── Lookup Maps (built once at import time) ─────────────────────────────────

const sourceById = new Map<string, NewsSource>(
  NEWS_SOURCES.map((s) => [s.id, s])
);

const sourceByName = new Map<string, NewsSource>(
  NEWS_SOURCES.map((s) => [s.name.toLowerCase(), s])
);

// ── Helper Functions ────────────────────────────────────────────────────────

/** Look up a news source by its unique id. Returns undefined if not found. */
export function getSourceById(id: string): NewsSource | undefined {
  return sourceById.get(id);
}

/** Look up a news source by its display name (case-insensitive). */
export function getSourceByName(name: string): NewsSource | undefined {
  return sourceByName.get(name.toLowerCase());
}

/** Get the brand color hex string for a source identified by display name.
 *  Falls back to a neutral gray if the name is unrecognized. */
export function getSourceColor(sourceName: string): string {
  const source = sourceByName.get(sourceName.toLowerCase());
  return source?.color ?? '#888888';
}
