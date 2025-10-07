
# YOUAI Chat

[中文文档 (Chinese Docs)](README.zh-CN.md) | [English Documentation](README.en.md)

A modern, multi‑provider AI chat application with streaming, Markdown, image input, multi‑session management, global search, export, and optional Web‑search + Deep‑thinking modes. A Cloudflare Workers proxy template is included to hide API keys and solve CORS.

Quick start
- Node.js 20+ recommended (repo includes .nvmrc 20.14.0)
- Install: npm ci
- Dev: npm run dev (http://localhost:5173)
- Build: npm run build; Preview: npm run preview

Deploy
- Cloudflare Pages: build with npm ci && npm run build, output dist
- Cloudflare Workers proxy (recommended): see cf-worker/README.md

For full guides, please read:
- 中文文档: README.zh-CN.md
- English docs: README.en.md
