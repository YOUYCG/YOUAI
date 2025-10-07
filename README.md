
# YOUAI Chat · 多模型 AI 对话应用 | Multi‑Provider AI Chat

简体中文 | English

- 中文请向下阅读
- For English, see the English section below

---

## 简介（中文）

一个用 React + TypeScript 构建的现代化 AI 对话应用，支持多家模型供应商、流式输出、Markdown 渲染、图片输入、多会话管理、全局搜索、对话导出，以及“网络搜索 + 深度思考”等增强能力。并提供 Cloudflare Workers 代理模板，便于隐藏密钥并解决 CORS。

### 功能亮点
- 多模型支持
  - Google Gemini
  - OpenAI 兼容（OpenAI、Groq、xAI/Grok、OpenRouter、Together、DeepSeek 等）
  - Anthropic（Claude）
  - Placeholder（占位符示例）
- 实时流式输出与 Markdown 渲染（代码块、表格、链接等）
- 图片上传（支持图像输入的模型可用）
- 主题与外观
  - 亮/暗主题切换，支持动态主色
  - 玻璃拟态风格、渐变按钮、统一的卡片样式
- 会话能力
  - 多会话管理、重命名、删除
  - 顶部全局搜索（跨会话检索）
  - 导出当前会话为 Markdown / JSON
- 网络搜索与深度思考
  - Tavily / Serper 二选一（支持 Cloudflare Workers 代理）
  - “模式”选择：普通、网络搜索、深度思考、搜索 + 深思
  - 引用风格（数字 [n]、行内 URL、脚注）与输出详细度（简洁/适中/详细）可选
  - 搜索结果折叠预览（摘要/展开更多内容）
- 配置与安全
  - 左侧“API Key 设置”面板集中配置所有 Provider
  - 可选 Cloudflare Workers 代理隐藏密钥、解决 CORS 问题
  - 也可在浏览器本地保存 Key（快速试用，生产不推荐）

### 本地开发
建议 Node.js 20+（Cloudflare Pages 也推荐 Node 20）。项目根目录附带 .nvmrc（20.14.0）。
1) 安装依赖
- npm ci
2) 启动开发服务器
- npm run dev
- 打开 http://localhost:5173
3) 构建与本地预览
- npm run build
- npm run preview

提示：仓库根目录包含 cf-worker/（Cloudflare Workers 代理模板），可单独进入该目录部署代理，详见下文。

### 使用指南
1) 选择模型与配置
- 左侧“API Key 设置”面板可配置：
  - Gemini：API Key、模型（如 gemini-2.0-flash / gemini-1.5-flash）
  - OpenAI 兼容：API Key、Base URL、模型（或使用预设快速填充）
  - Anthropic（Claude）：API Key、Base URL、模型
  - Web Search：Tavily/Serper API Key，或仅配置 Search Proxy URL 走 Worker 代理（推荐）
- 若使用 Cloudflare Workers 代理：
  - OpenAI 兼容 Base URL：改为 https://your-worker.workers.dev/proxy/openai
  - Anthropic Base URL：改为 https://your-worker.workers.dev/proxy/anthropic
  - Web Search：在“Search Proxy URL”填 https://your-worker.workers.dev（前端无需存任何搜索 Key）

2) 对话与增强
- 输入框上方选择“模式”（普通/网络搜索/深度思考/搜索+深思）
- 选择“网络搜索/搜索+深思”时可设置结果数（1-8）
- 可选择“引用风格”（数字 [n] / 行内 URL / 脚注）与“输出详细度”（简洁/适中/详细）
- 启用搜索后，回复卡片下方显示“搜索结果（可展开）”及“Sources”链接列表

3) 多会话、搜索与导出
- 顶部栏提供新建/切换/重命名/删除会话
- 全局搜索支持跨会话检索
- 支持导出当前会话为 Markdown 或 JSON 文件

### Cloudflare Pages 部署
- Node 版本：建议 20（在 Pages 构建设置中指定）
- 构建命令：npm ci && npm run build
- 输出目录：dist
- 环境变量：
  - 前端可直接在浏览器保存 Key（localStorage，便于试用）；生产建议改用 Workers 代理隐藏 Key
  - 如需“构建期注入”（Vite define/import.meta.env），在 Pages 的“构建环境变量”中设置（如 GEMINI_API_KEY）
  - 若仅使用浏览器本地 Key 或 Workers 代理，可不在 Pages 配置 LLM 密钥

### Cloudflare Workers 代理（推荐）
模板在 cf-worker/
- wrangler.toml：Workers 配置
- src/index.ts：代理实现
- README.md：使用说明

支持能力
- /proxy/openai/... → 转发至 OPENAI_BASE_URL（默认 https://api.openai.com/v1）
- /proxy/anthropic/... → 转发至 ANTHROPIC_BASE_URL（默认 https://api.anthropic.com）
- /proxy/tavily → 转 Tavily Search，注入服务端 TAVILY_API_KEY
- /proxy/serper → 转 Serper Search，注入服务端 SERPER_API_KEY
- CORS：通过 ALLOWED_ORIGINS 允许多个来源（默认 "*"）

部署（简要）
- npm i -g wrangler
- cd cf-worker
- wrangler dev（本地）
- wrangler deploy（部署）
- 在 Workers 后台设置变量：
  - OPENAI_API_KEY、OPENAI_BASE_URL（可选）
  - ANTHROPIC_API_KEY、ANTHROPIC_BASE_URL（可选）、ANTHROPIC_VERSION（可选，默认 2023-06-01）
  - TAVILY_API_KEY（可选）、SERPER_API_KEY（可选）
  - ALLOWED_ORIGINS（可选，默认 "*"）
- 前端接入：
  - OpenAI Base URL → https://your-worker.workers.dev/proxy/openai
  - Anthropic Base URL → https://your-worker.workers.dev/proxy/anthropic
  - Search Proxy URL → https://your-worker.workers.dev

### 环境与存储说明
- 浏览器端本地存储键（选填）
  - GEMINI_API_KEY、GEMINI_MODEL
  - OPENAI_API_KEY、OPENAI_BASE_URL、OPENAI_MODEL
  - ANTHROPIC_API_KEY、ANTHROPIC_BASE_URL、ANTHROPIC_MODEL
  - PLACEHOLDER_API_KEY
  - TAVILY_API_KEY、SERPER_API_KEY（使用 Workers 代理可不填）
  - SEARCH_PROXY_URL（使用 Workers 代理时填 Worker 域名）
- 安全建议
  - 生产避免在浏览器保存明文密钥
  - 使用 Workers 代理隐藏密钥并限制来源域名
  - 在各平台控制台配置域名限制（如 Google AI Studio）

### 目录结构（简）
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

### 常见问题
- 构建/运行要求 Node 20？
  - 是。虽然部分依赖在 Node 18 也可工作，但建议使用 Node 20 以获得更好的兼容性（已附带 .nvmrc）。
- CORS 报错？
  - 前端直连第三方 API 往往受 CORS 限制。推荐使用本仓库的 Cloudflare Workers 代理，并在 Workers 变量中配置 ALLOWED_ORIGINS。

### 许可证
本项目开源，遵循仓库中的 LICENSE。

---

## Introduction (English)

A modern AI chat application built with React and TypeScript. It supports multiple model providers, streaming responses, Markdown rendering, image input, multi-session management, global search, conversation export, and advanced “Web Search + Deep Thinking” modes. A Cloudflare Workers proxy template is included to hide API keys and solve CORS in production.

### Highlights
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

### Local Development
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

### Usage
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

### Cloudflare Pages Deployment
- Node version: 20 recommended (set in Pages build settings)
- Build command: npm ci && npm run build
- Output directory: dist

Environment variables
- For quick trials, you can store keys in the browser via “API Key Settings”. For production, prefer Workers proxy to hide keys.
- If you need build‑time injection (Vite define/import.meta.env), set them as Build Env Vars in Pages (e.g., GEMINI_API_KEY).
- If you only use client‑side keys or Workers proxy, no LLM keys are required in Pages.

### Cloudflare Workers Proxy (Recommended)
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

### Environment & Storage
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

### Project Structure (brief)
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

### FAQ
- Does it require Node 20?
  - Recommended. Some deps may work on Node 18, but Node 20 is safer and is included in .nvmrc.
- Seeing CORS errors?
  - Browser‑side calls to third‑party APIs often hit CORS. Use the included Cloudflare Workers proxy and set ALLOWED_ORIGINS.

### License
Open source, see LICENSE in the repo.
