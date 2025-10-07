# YOUAI Chat · Multi‑Provider AI Chat

A modern AI chat application built with React and TypeScript. It supports multiple model providers, streaming responses, Markdown rendering, image input, multi‑session management, global search, conversation export, and advanced “Web Search + Deep Thinking” modes. A Cloudflare Workers proxy template is included to hide API keys and solve CORS in production.

## Highlights
- Multi‑provider support
  - Google Gemini
  - OpenAI‑compatible (OpenAI, Groq, xAI/Grok, OpenRouter, Together, DeepSeek, etc.)
  - Anthropic (Claude)
  - Placeholder provider (for demos)
- Streaming responses with Markdown (code blocks, tables, links)
- Image upload (for vision‑capable models)
- Theming & UI
  - Light/Dark theme with dynamic accent color
  - Cohesive glassy cards and gradient buttons
- Sessions
  - Multi‑session management (create/rename/delete)
  - Global search across sessions
  - Export current session as Markdown/JSON
- Web Search & Deep Thinking
  - Choose Tavily or Serper (Cloudflare Workers proxy supported)
  - Compose modes: Normal, Web Search, Deep Thinking, Search + Deep
  - Citation style (numeric [n], inline URL, footnote) and output detail (concise/balanced/verbose)
  - Collapsible search result previews (summary/expand)
- Configuration & Security
  - Unified “API Key Settings” panel
  - Optional Cloudflare Workers proxy to hide keys and bypass CORS
  - Optional client‑side keys in localStorage (for quick trials; not recommended for production)

## Local Development
Node.js 20+ recommended (Cloudflare Pages also works best with Node 20). An .nvmrc (20.14.0) is included.

1) Install deps
- npm ci

2) Start dev server
- npm run dev
- Open http://localhost:5173

3) Build & preview
- npm run build
- npm run preview

Tip: A Cloudflare Workers proxy template is available under cf-worker/. See “Cloudflare Workers Proxy” below.

## Usage
1) Model selection & configuration
- In “API Key Settings”:
  - Gemini: API Key, model (e.g. gemini‑2.0‑flash / gemini‑1.5‑flash)
  - OpenAI‑compatible: API Key, Base URL, Model (presets available)
  - Anthropic (Claude): API Key, Base URL, Model
  - Web Search: Tavily/Serper API Key, or set Search Proxy URL (recommended) to your Worker
- With Workers proxy:
  - OpenAI Base URL → https://your-worker.workers.dev/proxy/openai
  - Anthropic Base URL → https://your-worker.workers.dev/proxy/anthropic
  - Web Search → set “Search Proxy URL” to https://your-worker.workers.dev (no client‑side search keys needed)

2) Chat & enhancements
- Choose a compose mode: Normal / Web Search / Deep Thinking / Search + Deep
- If Web Search is enabled, select result count (1–8)
- Choose citation style (numeric [n] / inline URL / footnote) and output detail (concise/balanced/verbose)
- With Web Search, the assistant message shows collapsible “Search Results” and a Sources list

3) Sessions, search, and export
- Top bar: create/switch/rename/delete sessions
- Global search across sessions
- Export current session as Markdown/JSON

## Cloudflare Pages Deployment
- Node version: 20 recommended (set in Pages build settings)
- Build command: npm ci && npm run build
- Output directory: dist

Environment variables
- For quick trials, you can store keys in the browser via “API Key Settings”. For production, prefer Workers proxy to hide keys.
- If you need build‑time injection (Vite define/import.meta.env), set them as Build Env Vars in Pages (e.g., GEMINI_API_KEY).
- If you only use client‑side keys or Workers proxy, no LLM keys are required in Pages.

## Cloudflare Workers Proxy (Recommended)
Template under cf-worker/
- wrangler.toml: Worker config
- src/index.ts: Proxy code
- README.md: Instructions

Supported routes
- /proxy/openai/... → forwards to OPENAI_BASE_URL (default https://api.openai.com/v1)
- /proxy/anthropic/... → forwards to ANTHROPIC_BASE_URL (default https://api.anthropic.com)
- /proxy/tavily → forwards to Tavily (injects TAVILY_API_KEY on server)
- /proxy/serper → forwards to Serper (injects SERPER_API_KEY on server)
- CORS via ALLOWED_ORIGINS (default "*")

Deploy (quick)
- npm i -g wrangler
- cd cf-worker
- wrangler dev (local), wrangler deploy (prod)
- Set Worker variables:
  - OPENAI_API_KEY, OPENAI_BASE_URL (optional)
  - ANTHROPIC_API_KEY, ANTHROPIC_BASE_URL (optional), ANTHROPIC_VERSION (optional, default 2023‑06‑01)
  - TAVILY_API_KEY (optional), SERPER_API_KEY (optional)
  - ALLOWED_ORIGINS (optional, default "*")
- Frontend integration:
  - OpenAI Base URL → https://your-worker.workers.dev/proxy/openai
  - Anthropic Base URL → https://your-worker.workers.dev/proxy/anthropic
  - Search Proxy URL → https://your-worker.workers.dev

## Environment & Storage
- Optional client‑side keys:
  - GEMINI_API_KEY, GEMINI_MODEL
  - OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL
  - ANTHROPIC_API_KEY, ANTHROPIC_BASE_URL, ANTHROPIC_MODEL
  - PLACEHOLDER_API_KEY
  - TAVILY_API_KEY, SERPER_API_KEY (omit if using Workers proxy)
  - SEARCH_PROXY_URL (Worker origin for search proxy)
- Security
  - Avoid storing secrets in the browser for production
  - Use Workers proxy to hide keys and restrict origins
  - Configure domain restrictions in provider consoles (e.g., Google AI Studio)

## Project Structure (brief)
```
.
├── App.tsx
├── components/
│   ├── ApiKeySettings.tsx
│   ├── ChatInput.tsx
│   ├── ChatMessage.tsx
│   ├── QuickActionsPanel.tsx
│   ├── TopBar.tsx
│   └── ThemeProvider.tsx
├── services/
│   ├── llm/
│   │   ├── providers/
│   │   │   ├── geminiProvider.ts
│   │   │   ├── openaiCompatibleProvider.ts
│   │   │   └── anthropicProvider.ts
│   │   ├── llmServiceFactory.ts
│   │   └── types.ts
│   └── search/
│       └── webSearchService.ts
├── cf-worker/
│   ├── wrangler.toml
│   ├── src/index.ts
│   └── README.md
├── index.html / index.tsx
├── vite.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## FAQ
- Does it require Node 20?
  - Recommended. Some deps may work on Node 18, but Node 20 is safer and is included in .nvmrc.
- Seeing CORS errors?
  - Browser‑side calls to third‑party APIs often hit CORS. Use the included Cloudflare Workers proxy and set ALLOWED_ORIGINS.

## License
Open source, see LICENSE in the repo.