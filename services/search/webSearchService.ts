export type WebSearchResult = {
  title: string;
  url: string;
  snippet?: string;
  content?: string; // optional full/long content when available
};

function getFromLocal(key: string): string {
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function getProxyBase(): string {
  try {
    let u = localStorage.getItem('SEARCH_PROXY_URL') || '';
replace(/\/+$/, '');
  } catch {
    return '';
  }
}

async function searchWithTavily(query: string, maxResults: number): Promise<WebSearchResult[]> {
  const proxy = getProxyBase();
  const body = {
    query,
    search_depth: 'advanced',
    include_answer: false,
    include_raw_content: true,
    max_results: Math.min(Math.max(maxResults, 1), 8),
  };

  try {
    if (proxy) {
      const url = `${proxy}/proxy/tavily`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!resp.ok) return [];
      const data = await resp.json();
      const results: WebSearchResult[] = (data.results || []).map((r: any) => ({
        title: r.title || r.url || 'Untitled',
        url: r.url,
        snippet: (r.content || r.snippet || '').slice(0, 500),
        content: r.raw_content || r.content || '',
      }));
      return results;
    }

    const apiKey = getFromLocal('TAVILY_API_KEY');
    if (!apiKey) return [];
    const url = 'https://api.tavily.com/search';
    const withKey = { ...body, api_key: apiKey };
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(withKey),
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    const results: WebSearchResult[] = (data.results || []).map((r: any) => ({
      title: r.title || r.url || 'Untitled',
      url: r.url,
      snippet: (r.content || r.snippet || '').slice(0, 500),
      content: r.raw_content || r.content || '',
    }));
    return results;
  } catch {
    return [];
  }
}

async function searchWithSerper(query: string, maxResults: number): Promise<WebSearchResult[]> {
  const proxy = getProxyBase();
  const body = {
    q: query,
    num: Math.min(Math.max(maxResults, 1), 10),
    gl: 'us',
    hl: 'en',
  };

  try {
    if (proxy) {
      const url = `${proxy}/proxy/serper`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!resp.ok) return [];
      const data = await resp.json();
      const organic = data.organic || [];
      const results: WebSearchResult[] = organic.slice(0, maxResults).map((r: any) => ({
        title: r.title || r.link || 'Untitled',
        url: r.link,
        snippet: (r.snippet || '').slice(0, 500),
        content: r.snippet || '',
      }));
      return results;
    }

    const apiKey = getFromLocal('SERPER_API_KEY');
    if (!apiKey) return [];
    const url = 'https://google.serper.dev/search';
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    const organic = data.organic || [];
    const results: WebSearchResult[] = organic.slice(0, maxResults).map((r: any) => ({
      title: r.title || r.link || 'Untitled',
      url: r.link,
      snippet: (r.snippet || '').slice(0, 500),
      content: r.snippet || '',
    }));
    return results;
  } catch {
    return [];
  }
}

export async function webSearch(query: string, maxResults = 3): Promise<WebSearchResult[]> {
  // Preference: Tavily -> Serper -> []
  const tavily = await searchWithTavily(query, maxResults);
  if (tavily.length) return tavily;
  const serper = await searchWithSerper(query, maxResults);
  if (serper.length) return serper;
  return [];
}