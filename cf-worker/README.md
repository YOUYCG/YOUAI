# YOUAI Cloudflare Workers Proxy

Purpose:
- Hide API keys on the server side
- Solve CORS for browser calls
- Provide a simple, streaming-friendly proxy for OpenAI-compatible and Anthropic, and a server-side gateway for Tavily/Serper search

## Endpoints

All endpoints are relative to your Worker domain, e.g.:
- https://your-worker-id.workers.dev

Routes:
- POST/GET /proxy/openai/...  -> forwards to OPENAI_BASE_URL (default https://api.openai.com/v1)
  - Use as a drop-in replacement for OpenAI-compatible APIs:
    - /proxy/openai/chat/completions
    - /proxy/openai/completions
    - /proxy/openai/models
- POST/GET /proxy/anthropic/... -> forwards to ANTHROPIC_BASE_URL (default https://api.anthropic.com)
  - e.g., POST /proxy/anthropic/v1/messages
- POST /proxy/tavily -> forwards to Tavily Search, injects server-side TAVILY_API_KEY
- POST /proxy/serper -> forwards to Serper Search, injects server-side SERPER_API_KEY

CORS:
- ALLOWED_ORIGINS defaults to "*"
- You can set ALLOWED_ORIGINS to comma-separated origins to restrict (e.g. "https://your.app,https://preview.your.app")

## Environment Variables

Set in Cloudflare Workers > Settings > Variables:

- OPENAI_API_KEY
- OPENAI_BASE_URL (optional, default https://api.openai.com/v1)
- ANTHROPIC_API_KEY
- ANTHROPIC_BASE_URL (optional, default https://api.anthropic.com)
- ANTHROPIC_VERSION (optional, default 2023-06-01)
- TAVILY_API_KEY (optional, for Tavily search)
- SERPER_API_KEY (optional, for Serper search)
- ALLOWED_ORIGINS (optional, default "*")

## Development

- Install Wrangler
  npm i -g wrangler

- Dev
  wrangler dev

- Publish
  wrangler deploy

## How to plug into the frontend

- OpenAI-compatible (OpenAI, Groq, xAI, OpenRouter, Together, DeepSeek)
  - In the app’s API Key 设置 -> OpenAI-compatible:
    - Set Base URL to your worker: https://your-worker.workers.dev/proxy/openai
    - Remove API Key from the browser (leave empty)
    - Keep Model as appropriate (e.g. gpt-4o-mini, grok-2, llama-3.1-70b, etc.)

- Anthropic (Claude)
  - Set Base URL to your worker: https://your-worker.workers.dev/proxy/anthropic
  - Remove API Key from the browser
  - Keep Model as appropriate (claude-3-5-sonnet-latest, etc.)

- Web Search
  - In API Key 设置 -> Web Search:
    - Leave Tavily/Serper keys empty on the client
    - Set Search Proxy URL to your worker origin, e.g. https://your-worker.workers.dev
    - Frontend will call:
      - POST {SEARCH_PROXY_URL}/proxy/tavily
      - or POST {SEARCH_PROXY_URL}/proxy/serper

Security notes:
- Keys never leave the server when using the proxy
- Consider restricting ALLOWED_ORIGINS
- Optionally add rate limiting or token verification per your needs