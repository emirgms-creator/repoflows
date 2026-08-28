<div align="center">

# 🌐 RepoFlows

**Instant Runtime Architecture Visualizer for any GitHub Repository.**

Transform any public GitHub repository into an interactive, animated, and verifiable system topology map in seconds using AI and the Archify vector rendering engine.

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Gemini AI](https://img.shields.io/badge/AI-Google_Gemini-orange?style=flat-square&logo=google)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg?style=flat-square)](LICENSE)

</div>

---

## ⚡ Features

- 🔍 **Instant Repository Analysis:** Paste any `owner/repo` or GitHub URL (`https://github.com/vercel/next.js`) to reverse-engineer its architecture.
- 🤖 **Gemini AI Topology Synthesis:** Extracts runtime services, client tiers, databases, gateways, and message buses using strict schema-driven IR generation.
- 🎨 **Archify Vector Canvas:** Crisp, animated vector diagram rendering with clean grid layout and protocol-labeled connections.
- 💾 **Permanent Smart Caching:** Local disk-based caching ensures instant reloading for previously scanned repositories.
- 📤 **Multi-Format Export:** Export your generated architecture as:
  - 📄 **Standalone HTML Document** (self-contained interactive viewer)
  - 📐 **Scalable Vector Graphics (SVG)**
  - 🟣 **Archify JSON IR** (raw structured topology data)
- 🛡️ **Production-Ready & Secure:** IP-based rate limiting, safe iframe sandboxing, header-based API key transport, and sanitized rendering.

---

## 🏗️ How It Works

```
┌─────────────────────────┐
│ 1. GitHub Ingestion     │ Fetches metadata, file tree & key manifests
│    (REST API & Raw)     │ (package.json, docker-compose, Dockerfile, go.mod, etc.)
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ 2. Gemini AI Engine     │ Reverse-engineers components, boundaries,
│    (Structured JSON IR) │ connections, and runtime flow into strict schema
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ 3. Archify Compiler     │ Compiles JSON IR into a standalone interactive
│    (Vector Engine)      │ animated HTML canvas
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ 4. Interactive Viewer   │ Pan, zoom, inspect nodes, and export diagrams
└─────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.18.0 or later recommended)
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey) (Free tier available)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/emirgms-creator/repoflows.git
   cd repoflows
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env.local` file in the root directory:
   ```bash
   cp .env.example .env.local
   ```

   Fill in your API keys:
   ```env
   # Required: Google Gemini API Key
   GEMINI_API_KEY=your_gemini_api_key_here

   # Optional: Model Selection (defaults to gemini-2.5-flash-lite)
   GEMINI_MODEL=gemini-2.5-flash-lite

   # Optional: GitHub Personal Access Token (boosts rate limit from 60 to 5,000 req/hr)
   # GITHUB_TOKEN=ghp_your_github_token_here

   # Optional: Canonical Site URL for SEO
   NEXT_PUBLIC_SITE_URL=https://repoflows.com
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Variables

| Variable | Required | Description | Default |
|---|:---:|---|---|
| `GEMINI_API_KEY` | **Yes** | Google Gemini API key from AI Studio | — |
| `GEMINI_MODEL` | No | Gemini model name for synthesis | `gemini-2.5-flash-lite` |
| `GITHUB_TOKEN` | No | GitHub PAT for higher API rate limits | — |
| `NEXT_PUBLIC_SITE_URL` | No | Base production URL for SEO & sitemaps | `https://repoflows.com` |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis REST URL for permanent serverless cache | — |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis REST Token for permanent serverless cache | — |

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Server-side Route Handlers)
- **UI & Styling:** [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **AI Synthesis:** [Google Gemini API](https://ai.google.dev/) (via direct HTTP `x-goog-api-key` header integration)
- **Vector Rendering Engine:** [Archify](https://github.com/tt-a1i/archify) (Architecture vector layout engine)
- **Security & Proxy:** Next.js Proxy convention, IP-based rate limiting, strict iframe isolation

---

## 📁 Project Structure

```
repoflows/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate/   # POST /api/generate (GitHub -> Gemini -> Archify pipeline)
│   │   │   ├── recent/     # GET /api/recent (Cached diagram summaries)
│   │   │   └── render/     # GET /api/render (Direct standalone HTML render)
│   │   ├── map/            # Interactive diagram canvas viewer & exporter
│   │   ├── error.tsx       # Minimalist error boundary
│   │   ├── not-found.tsx   # 404 page
│   │   ├── robots.ts       # Dynamic robots.txt
│   │   ├── sitemap.ts      # Dynamic sitemap.xml
│   │   ├── layout.tsx      # Root layout with comprehensive SEO metadata
│   │   └── page.tsx        # Landing page with wave animation & search box
│   ├── components/         # Reusable UI components (HeroSearch, RecentScans, etc.)
│   ├── lib/                # Core utilities (gemini.ts, github.ts, cache.ts, archify-renderer.ts)
│   └── proxy.ts            # Rate limiting & security headers proxy
├── public/                 # Static assets
├── .env.example            # Example environment variables template
├── LICENSE                 # MIT License
└── package.json
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
