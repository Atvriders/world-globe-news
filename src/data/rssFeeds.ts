export interface RSSFeed {
  id: string;
  name: string;
  url: string;
  category: 'world' | 'politics' | 'business' | 'technology' | 'sports' | 'health' | 'science' | 'entertainment';
  country: string;
  language: 'en' | 'fr' | 'de' | 'es' | 'ar';
}

export const RSS_FEEDS: RSSFeed[] = [
  // BBC (UK)
  {
    id: 'bbc-world',
    name: 'BBC World',
    url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'world',
    country: 'GB',
    language: 'en',
  },
  {
    id: 'bbc-business',
    name: 'BBC Business',
    url: 'http://feeds.bbci.co.uk/news/business/rss.xml',
    category: 'business',
    country: 'GB',
    language: 'en',
  },
  {
    id: 'bbc-technology',
    name: 'BBC Technology',
    url: 'http://feeds.bbci.co.uk/news/technology/rss.xml',
    category: 'technology',
    country: 'GB',
    language: 'en',
  },
  {
    id: 'bbc-science',
    name: 'BBC Science & Environment',
    url: 'http://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    category: 'science',
    country: 'GB',
    language: 'en',
  },
  {
    id: 'bbc-health',
    name: 'BBC Health',
    url: 'http://feeds.bbci.co.uk/news/health/rss.xml',
    category: 'health',
    country: 'GB',
    language: 'en',
  },
  {
    id: 'bbc-entertainment',
    name: 'BBC Entertainment & Arts',
    url: 'http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml',
    category: 'entertainment',
    country: 'GB',
    language: 'en',
  },

  // Al Jazeera (QA)
  {
    id: 'aljazeera-all',
    name: 'Al Jazeera',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    category: 'world',
    country: 'QA',
    language: 'en',
  },

  // NPR (US)
  {
    id: 'npr-world',
    name: 'NPR World',
    url: 'https://feeds.npr.org/1004/rss.xml',
    category: 'world',
    country: 'US',
    language: 'en',
  },
  {
    id: 'npr-politics',
    name: 'NPR Politics',
    url: 'https://feeds.npr.org/1014/rss.xml',
    category: 'politics',
    country: 'US',
    language: 'en',
  },
  {
    id: 'npr-health',
    name: 'NPR Health',
    url: 'https://feeds.npr.org/1128/rss.xml',
    category: 'health',
    country: 'US',
    language: 'en',
  },

  // France 24 (FR)
  {
    id: 'france24-en',
    name: 'France 24',
    url: 'https://www.france24.com/en/rss',
    category: 'world',
    country: 'FR',
    language: 'en',
  },
  {
    id: 'france24-fr',
    name: 'France 24 (Fran\u00e7ais)',
    url: 'https://www.france24.com/fr/rss',
    category: 'world',
    country: 'FR',
    language: 'fr',
  },

  // Deutsche Welle (DE)
  {
    id: 'dw-all',
    name: 'DW All',
    url: 'https://rss.dw.com/rdf/rss-en-all',
    category: 'world',
    country: 'DE',
    language: 'en',
  },
  {
    id: 'dw-business',
    name: 'DW Business',
    url: 'https://rss.dw.com/rdf/rss-en-bus',
    category: 'business',
    country: 'DE',
    language: 'en',
  },
  {
    id: 'dw-science',
    name: 'DW Science',
    url: 'https://rss.dw.com/rdf/rss-en-sci',
    category: 'science',
    country: 'DE',
    language: 'en',
  },

  // The Guardian (GB)
  {
    id: 'guardian-world',
    name: 'The Guardian World',
    url: 'https://www.theguardian.com/world/rss',
    category: 'world',
    country: 'GB',
    language: 'en',
  },
  {
    id: 'guardian-technology',
    name: 'The Guardian Tech',
    url: 'https://www.theguardian.com/technology/rss',
    category: 'technology',
    country: 'GB',
    language: 'en',
  },
  {
    id: 'guardian-sport',
    name: 'The Guardian Sport',
    url: 'https://www.theguardian.com/sport/rss',
    category: 'sports',
    country: 'GB',
    language: 'en',
  },

  // CBS News (US)
  {
    id: 'cbs-world',
    name: 'CBS World',
    url: 'https://www.cbsnews.com/latest/rss/world',
    category: 'world',
    country: 'US',
    language: 'en',
  },
  {
    id: 'cbs-politics',
    name: 'CBS Politics',
    url: 'https://www.cbsnews.com/latest/rss/politics',
    category: 'politics',
    country: 'US',
    language: 'en',
  },
  {
    id: 'cbs-science',
    name: 'CBS Science',
    url: 'https://www.cbsnews.com/latest/rss/science',
    category: 'science',
    country: 'US',
    language: 'en',
  },

  // ABC News (US)
  {
    id: 'abc-headlines',
    name: 'ABC News',
    url: 'http://feeds.abcnews.com/abcnews/usheadlines',
    category: 'world',
    country: 'US',
    language: 'en',
  },

  // South China Morning Post (HK)
  {
    id: 'scmp-world',
    name: 'SCMP World',
    url: 'https://www.scmp.com/rss/5/feed',
    category: 'world',
    country: 'HK',
    language: 'en',
  },
  {
    id: 'scmp-china',
    name: 'SCMP China',
    url: 'https://www.scmp.com/rss/4/feed',
    category: 'politics',
    country: 'HK',
    language: 'en',
  },

  // Times of India (IN)
  {
    id: 'toi-top',
    name: 'Times of India',
    url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',
    category: 'world',
    country: 'IN',
    language: 'en',
  },

  // ESPN Sports (US)
  {
    id: 'espn-top',
    name: 'ESPN Top Headlines',
    url: 'https://www.espn.com/espn/rss/news',
    category: 'sports',
    country: 'US',
    language: 'en',
  },

  // El Pais (ES)
  {
    id: 'elpais-international',
    name: 'El Pa\u00eds Internacional',
    url: 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/internacional/portada',
    category: 'world',
    country: 'ES',
    language: 'es',
  },

  // Reuters (US)
  {
    id: 'reuters-world',
    name: 'Reuters World',
    url: 'https://www.reutersagency.com/feed/?best-topics=world',
    category: 'world',
    country: 'US',
    language: 'en',
  },
  {
    id: 'reuters-business',
    name: 'Reuters Business',
    url: 'https://www.reutersagency.com/feed/?best-topics=business-finance',
    category: 'business',
    country: 'US',
    language: 'en',
  },
  {
    id: 'reuters-tech',
    name: 'Reuters Technology',
    url: 'https://www.reutersagency.com/feed/?best-topics=tech',
    category: 'technology',
    country: 'US',
    language: 'en',
  },
];

export function getFeedsByCategory(cat: string): RSSFeed[] {
  return RSS_FEEDS.filter((feed) => feed.category === cat);
}

export function getFeedsByCountry(code: string): RSSFeed[] {
  return RSS_FEEDS.filter((feed) => feed.country === code.toUpperCase());
}
