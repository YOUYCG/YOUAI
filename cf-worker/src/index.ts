export interface Env {
  // OpenAI-compatible
  OPENAI_API_KEY?: string;
  OPENAI_BASE_URL?: string; // default https://api.openai.com/v1

  // Anthropic
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_BASE_URL?: string; // default https://api.anthropic.com
  ANTHROPIC_VERSION?: string; // default 2023-06-01

  // Search
  TAVILY_API_KEY?: string;
  SERPER_API_KEY?: string;

  // CORS
  ALLOWED_ORIGINS?: string; // comma separated or '*'
}

function corsHeaders(origin: string, env: Env): Headers {
  const allowed = (env.ALLOWED_ORIGINS || '*').trim();
  const h = new Headers();
  h.set('Access-Control-Allow-Credentials', 'true');
  h.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  h.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  h.set('Vary', 'Origin');

  if (allowed === '*') {
    h.set('Access-Control-Allow-Origin', '*');
  } else {
    const list = allowed.split(',').map(s => s.trim());
    if (list.includes(origin)) {
      h.set('Access-Control-Allow-Origin', origin);
    }
  }
  return h;
}

function withCors(resp: Response, origin: string, env: Env) {
  const h = corsHeaders(origin, env);
  h.forEach((v, k) => resp.headers.set(k, v));
  return resp;
}

function handleOptions(request: Request, env: Env): Response {
  const origin = request.headers.get('Origin') || '';
  const resp = new Response(null, { status: 204, headers: new Headers() });
  return withCors(resp, origin, env);
}

async function proxyOpenAI(path: string, req: Request, env: Env): Promise<Response> {
  const base = (env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const url = `${base}${path}`;
  const headers = new Headers(req.headers);
  headers.set('Authorization', `Bearer ${env.OPENAI_API_KEY || ''}`);
  headers.set('content-type', 'application/json');
  return fetch(url, {
    method: req.method,
    headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text(),
  });
}

async function proxyAnthropic(path: string, req: Request, env: Env): Promise<Response> {
  const base = (env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/+$/, '');
  const url = `${base}${path}`;
  const headers = new Headers(req.headers);
  headers.set('x-api-key', env.ANTHROPIC_API_KEY || '');
  headers.set('anthropic-version', env.ANTHROPIC_VERSION || '2023-06-01');
  headers.set('content-type', 'application/json');
  return fetch(url, {
    method: req.method,
    headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text(),
  });
}

async function proxyTavily(req: Request, env: Env): Promise<Response> {
  const url = 'https://api.tavily.com/search';
  const body = await req.json().catch(() => ({}));
  const payload = {
    ...body,
    api_key: env.TAVILY_API_KEY || '',
  };
  return fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

async function proxySerper(req: Request, env: Env): Promise<Response> {
  const url = 'https://google.serper.dev/search';
  const body = await req.text();
  return fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-API-KEY': env.SERPER_API_KEY || '',
    },
    body,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions(request, env);
    }

    try {
      if (url.pathname.startsWith('/proxy/openai/')) {
        const path = url.pathname.replace('/proxy', '');
        const resp = await proxyOpenAI(path, request, env);
        return withCors(resp, origin, env);
      }

      if (url.pathname.startsWith('/proxy/anthropic/')) {
        const path = url.pathname.replace('/proxy', '');
        const resp = await proxyAnthropic(path, request, env);
        return withCors(resp, origin, env);
      }

      if (url.pathname === '/proxy/tavily') {
        const resp = await proxyTavily(request, env);
        return withCors(resp, origin, env);
      }

      if (url.pathname === '/proxy/serper') {
        const resp = await proxySerper(request, env);
        return withCors(resp, origin, env);
      }

      return new Response('Not Found', { status: 404 });
    } catch (e: any) {
      const resp = new Response(JSON.stringify({ error: e?.message || 'Proxy error' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
      return withCors(resp, origin, env);
    }
  },
};