import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 5000,
});

export async function fetchFeed(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VeilleBot/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
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
