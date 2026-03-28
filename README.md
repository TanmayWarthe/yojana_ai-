# 🏛️ YojanaAI — Next.js

**AI-Powered Indian Government Scheme Assistant**  
आपकी योजना, आपकी आवाज़ — Your Scheme, Your Voice

> Team Exception | Pallotti Hackfest | Problem Statement 3

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js 18+** (check: `node --version`)
- **npm** or **yarn**

### 2. Create the project

```bash
npx create-next-app@latest yojana-ai --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
cd yojana-ai
```

### 3. Replace project files

Copy all the files from this zip into the `yojana-ai/` folder, **overwriting** the defaults:

```
yojana-ai/
├── app/
│   ├── globals.css          ← replace
│   ├── layout.tsx           ← replace
│   ├── page.tsx             ← replace
│   ├── HomeClient.tsx       ← NEW
│   ├── find/page.tsx        ← NEW
│   ├── chat/page.tsx        ← NEW
│   ├── browse/page.tsx      ← NEW
│   ├── events/page.tsx      ← NEW
│   ├── compare/page.tsx     ← NEW
│   ├── about/page.tsx       ← NEW
│   └── api/
│       ├── chat/route.ts    ← NEW
│       ├── schemes/route.ts ← NEW
│       └── stt/route.ts     ← NEW
├── components/
│   ├── layout/
│   │   ├── Header.tsx       ← NEW
│   │   └── Footer.tsx       ← NEW
│   └── schemes/
│       └── SchemeCard.tsx   ← NEW
├── lib/
│   ├── constants.ts         ← NEW
│   └── eligibility.ts       ← NEW
├── types/
│   └── index.ts             ← NEW
├── public/
│   └── schemes.json         ← NEW (from your Python scraper)
├── .env.local               ← replace (add your API keys)
├── next.config.js           ← replace
└── tsconfig.json            ← replace
```

### 4. Set environment variables

Edit `.env.local`:

```env
GROQ_API_KEY=your_groq_key_here
DEEPGRAM_API_KEY=your_deepgram_key_here
GEMINI_API_KEY=your_gemini_key_here   # optional fallback
```

> Your keys are already in `.env.local` — just verify them.

### 5. Install & run

```bash
npm install
npm run dev
```

Open **http://localhost:3000** 🎉

---

## 📁 Project Structure

```
app/                    Next.js App Router pages
  api/chat/            POST — AI chat via Groq
  api/schemes/         GET  — Serve schemes.json
  api/stt/             POST — Speech-to-text via Deepgram
  find/                Eligibility finder form
  chat/                AI chat with voice input
  browse/              Browse & search all schemes
  events/              Life event based matching
  compare/             Side-by-side scheme comparison
  about/               Team & tech info

components/
  layout/Header.tsx    Tricolor header + stats bar + nav
  layout/Footer.tsx    Links + disclaimer
  schemes/SchemeCard.tsx  Expandable scheme card

lib/
  constants.ts         Languages, states, categories
  eligibility.ts       Matching engine (ported from Python)

types/index.ts         TypeScript interfaces

public/schemes.json    219 government schemes database
```

---

## 🌐 Pages

| Route | Description |
|-------|-------------|
| `/` | Home — welcome, quick access, stats |
| `/find` | Fill profile → get matched schemes |
| `/chat` | AI chat in 9 languages + voice input |
| `/browse` | Search & browse all 219 schemes |
| `/events` | Life event based scheme finder |
| `/compare` | Side-by-side scheme comparison |
| `/about` | Team & technology information |

---

## 🔑 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/schemes` | GET | Returns all schemes from `public/schemes.json` |
| `/api/chat` | POST | Sends messages to Groq LLM, returns AI reply |
| `/api/stt` | POST | Sends audio to Deepgram, returns transcript |

---

## 🔄 Keeping Schemes Updated

Your Python scraper (`step4_scrape_schemes.py`) runs every 6 hours and updates `data/schemes.json`.  
To sync it to the Next.js app, copy the file:

```bash
cp data/schemes.json yojana-ai/public/schemes.json
```

Or set up a cron job / GitHub Action to do this automatically.

---

## 🚢 Deployment

### Vercel (recommended — free)

```bash
npm install -g vercel
vercel --prod
```

Add environment variables in the Vercel dashboard under **Settings → Environment Variables**.

### Other platforms
- **Railway**, **Render**, **Fly.io** all work with `npm run build && npm start`
- Set `NODE_ENV=production` and all env vars on the platform

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Custom CSS (design system in `globals.css`) |
| LLM | Groq llama-3.3-70b (primary) |
| Speech-to-Text | Deepgram nova-2 |
| Text-to-Speech | Web Speech API |
| Data | 219 government schemes (Python scraper) |

---

## 👥 Team Exception

Built for **Pallotti Hackfest 2025 — Problem Statement 3**  
Solving India's government scheme awareness gap with AI.

---

*Not an official government website. For applications, visit official government portals.*
