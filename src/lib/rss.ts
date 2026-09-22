import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 5000,
});

export async function fetchFeed(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
      },
      next: { revalidate: 3600 } // Optionally use Next.js cache if applicable, or just standard fetch
    });

    if (!res.ok) {
      console.warn(`[RSS] Failed to fetch ${url}: HTTP ${res.status}`);
      return [];
    }

    const text = await res.text();
    const feed = await parser.parseString(text);
    
    return feed.items.map(item => ({
      title: item.title || 'Sans titre',
      link: item.link || '',
      content: item.contentSnippet || item.content || item.summary || '',
      pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
    }));
  } catch (error) {
    console.error(`[RSS] Error parsing feed ${url}:`, (error as Error).message);
    return [];
  }
}
