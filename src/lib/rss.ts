import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 5000,
});

export interface FeedItem {
  title: string;
  link: string;
  content: string;
  pubDate: Date;
}

export async function fetchFeed(url: string): Promise<FeedItem[]> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
      },
    });

    if (!res.ok) {
      console.warn(`[RSS] Failed to fetch ${url}: HTTP ${res.status}`);
      return [];
    }

    const text = await res.text();
    const feed = await parser.parseString(text);

    return feed.items.map((item) => ({
      title: item.title || 'Sans titre',
      link: item.link || '',
      content: item.contentSnippet || item.content || item.summary || '',
      pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
    }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[RSS] Error parsing feed ${url}:`, message);
    return [];
  }
}
