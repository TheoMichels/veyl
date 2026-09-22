import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 5000,
});

export async function fetchFeed(url: string) {
  try {
    const feed = await parser.parseURL(url);
    return feed.items.map(item => ({
      title: item.title || 'Sans titre',
      link: item.link || '',
      content: item.contentSnippet || item.content || item.summary || '',
      pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
    }));
  } catch (error) {
    console.error(`Error fetching RSS feed ${url}:`, error);
    return [];
  }
}
