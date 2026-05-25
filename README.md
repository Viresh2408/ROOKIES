# 🍊 Rookies — Virtual COO for Indian Small Businesses

[![Live](https://img.shields.io/badge/Live-rookies--apsit.vercel.app-orange?style=for-the-badge&logo=vercel)](https://rookies-apsit.vercel.app)
[![Tech Stack](https://img.shields.io/badge/Stack-Next.js%2016%20%7C%20Supabase%20%7C%20LiveKit-orange?style=for-the-badge)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-Private-red?style=for-the-badge)](LICENSE)

**Rookies** is a WhatsApp-first AI SaaS platform and Virtual COO designed for home bakers, kirana stores, Instagram-first brands, and other micro-merchants across India. It empowers them to manage orders, payments, customers, and inventory seamlessly—all from one calm, human-friendly dashboard or via a **real-time AI Voice Assistant**.

Built with **Next.js 16.1 (App Router)**, **React 19**, **TailwindCSS v4**, **Clerk Auth**, **Supabase (PostgreSQL with RLS)**, and **Prisma ORM**.

---

## 🚀 Key Highlights & Recent Major Upgrades

We have recently integrated a state-of-the-art **Real-Time AI Voice Agent** powered by **LiveKit Agents**, enabling hands-free, high-performance voice-driven business operations. 

```
                               ┌──────────────────────────┐
                               │     Next.js Web App      │
                               │  (React 19 / Tailwind 4) │
                               └────────────┬─────────────┘
                                            │
                                            │ LiveKit Data Channel
                                            │ (Real-time Navigation & Sync)
                                            ▼
┌──────────────┐   Voice IP    ┌──────────────────────────┐   API Requests   ┌─────────────────┐
│ User Audio   ├──────────────►│    LiveKit Voice Agent   ├─────────────────►│   Supabase DB   │
│ (Vocal commands)             │ (VAD / Groq STT / LLM)   │  (Secured JSON)  │  (Prisma ORM)   │
└──────────────┘               └────────────┬─────────────┘                  └─────────────────┘
                                            │
                                            │ Godmode TTS Audio
                                            ▼
                               ┌──────────────────────────┐
                               │       Deepgram TTS       │
                               │  (Direct Audio Playback) │
                               └──────────────────────────┘
```

### 🎙️ 1. Ultra-Low Latency Voice Agent (`agent/main.py`)
- **LiveKit Agents SDK 0.12.x**: Fully asynchronous voice agent loop that handles connection state, voice activity detection, and streaming speech-to-text / text-to-speech.
- **State-of-the-Art AI Services**:
  - **STT**: Groq `whisper-large-v3-turbo` for near-instant, high-accuracy speech transcription.
  - **LLM**: Groq `llama-3.1-8b-instant` orchestrating conversational logic, entity extraction, and function calling.
  - **TTS**: Deepgram `aura-asteria-en` for natural-sounding, ultra-low latency audio syntheses.
- **"Godmode" Direct TTS Playback**: To completely bypass the LLM's latency and token regeneration cost when reading long product catalogs, the agent caches the inventory lists and uses direct TTS streaming (`assistant.say()`) to read the items to the user in real time.
- **Intelligent Context Trimming**: Automatically prunes conversation turns on every final transcript to a maximum sliding window of the last 6 messages. This minimizes the token footprint, dramatically accelerating responses and eliminating rate limit issues.

### 🌐 2. Bidirectional Dashboard Sync (`components/VoiceAgent.tsx`)
- **Real-Time Client Navigation**: The Voice Agent sends low-latency JSON navigation events (`{"type": "navigation", "path": "/dashboard/inventory"}`) over LiveKit data channels.
- **Instant Client Hydration**: The browser-side component parses these navigation packets, programmatically updates routes via `router.push()`, and triggers `router.refresh()` so that newly modified orders, customers, or items immediately render in server-side components.

### 📦 3. Conversational Multi-Step Inventory Onboarding
- **Smart Conversational Flow**: A highly robust `add_inventory` tool prompts the user for one item attribute at a time (Name → SKU → Stock Quantity → Unit → Cost Price → Sell Price → Low Stock alert level).
- **Duplicate Prevention Safeguard**: Interrogates the active database API for matching item names prior to creation to prevent duplicate menu records and alert the user dynamically.
- **Schema & Server Action Expansion**: Updated Prisma schema and backend queries in `lib/agent-actions.ts` to fully support `sku`, `costPrice`, and `lowStockAt` throughout the database lifecycle.

---

## 🛠️ Complete Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | Next.js 16.1.6 (App Router, Server Components, Turbopack) |
| **User Interface** | React 19.0.0 (Server & Client Components) |
| **Voice Agent Framework** | LiveKit Agents SDK 0.12.x (Python-based asynchronous server) |
| **AI Models (Voice)** | Groq Whispering/Llama-3.1 + Deepgram Aura |
| **Styling** | TailwindCSS v4.0 (Custom warm minimal palette) |
| **Database** | Supabase (PostgreSQL with Row Level Security) |
| **ORM** | Prisma 7.0 (Relational schema with 10 tables) |
| **Authentication** | Clerk (`@clerk/nextjs` SDK) |
| **State & Forms** | React Hook Form + Zod v4 validation |
| **Transitions & Toasts**| Framer Motion + Sonner |

---

## 📂 Project Directory Structure

```
├── agent/                          # Real-Time AI Voice Agent Services
│   └── main.py                     # Asynchronous LiveKit Voice Agent & LLM tools
├── app/                            # Next.js App Router (React 19)
│   ├── layout.tsx                  # Base layout wrapping Clerk & Toaster providers
│   ├── globals.css                 # TailwindCSS v4 styling & color definitions
│   ├── (marketing)/                # Public landing pages
│   ├── (auth)/                     # Clerk sign-in / sign-up and onboarding setup flow
│   ├── (dashboard)/                # Protected business owner dashboards
│   │   ├── dashboard/              # Overview stats cards & real-time analytics
│   │   └── dashboard/orders/       # Live order feeds and action components
│   ├── api/
│   │   ├── agent/[action]/route.ts # Next.js API route servicing agent requests (React 19 sync params fixed)
│   │   └── webhooks/n8n/route.ts   # n8n webhook receiver endpoint
│   └── auth/callback/route.ts      # Auth route callback handlers
├── components/                     # Shared UI Components
│   ├── VoiceAgent.tsx              # LiveKit Voice widget with real-time route listeners
│   └── ui/                         # Base ShadCN-style visual nodes (Buttons, Cards, Dialogs)
├── lib/                            # Helper utilities & client constructors
│   ├── agent-actions.ts            # Server actions performing DB writes for the voice assistant
│   ├── auth.ts                     # Authentication hooks
│   └── utils.ts                    # Formatter modules (INR currency, string cleanups)
├── prisma/                         # Prisma database schema definition
│   └── schema.prisma               # Complete multi-tenant tables (10 models)
├── supabase/                       # Supabase configuration & RLS migrations
│   └── migrations/                 # PostgreSQL migrations initializing multi-tenant RLS
└── package.json                    # Package manifest & configuration scripts
```

---

## ⚡ Development & Setup Instructions

Follow these steps to run both the Next.js web application and the Python LiveKit voice agent locally.

### 📋 Prerequisites
- **Node.js** 18.18+ (20+ recommended)
- **Python** 3.10+
- A **Clerk** account ([clerk.com](https://clerk.com))
- A **Supabase** database ([supabase.com](https://supabase.com))
- **LiveKit** sandbox credentials and **Groq** & **Deepgram** API keys

---

### Step 1: Clone the Repository & Install Web Dependencies
```bash
git clone https://github.com/Viresh2408/ROOKIES.git
cd ROOKIES/Rookies
npm install
```

### Step 2: Configure Web Environment Variables
Create a `.env.local` file in the `Rookies` folder:
```env
# ─── Clerk Authentication ───
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/setup

# ─── Supabase PostgreSQL Connection ───
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
SUPABASE_SERVICE_ROLE_KEY=ey...
DATABASE_URL=postgresql://postgres.your-project-id:...@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# ─── Application URL ───
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ─── LiveKit Agent API Shared Secret ───
ROOKIES_API_URL=http://localhost:3000/api/agent
ROOKIES_AGENT_SECRET=your_secure_agent_secret
```

### Step 3: Run Database Migrations & Start Next.js Development Server
```bash
# Push schema changes to Supabase
npx prisma db push

# Start web application
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the web dashboard.

---

### Step 4: Install & Start the AI Voice Agent
1. Navigate to the `Rookies` root (or where the agent subfolder lies).
2. Set up a Python virtual environment and install dependencies:
   ```bash
   cd agent
   python -m venv .venv
   
   # On Windows:
   .venv\Scripts\activate
   # On macOS/Linux:
   source .venv/bin/activate
   
   pip install -r requirements.txt
   ```
   *(Note: Make sure your `requirements.txt` includes `livekit-agents>=0.12.0`, `livekit-plugins-openai`, `livekit-plugins-silero`, `livekit-plugins-deepgram`, `livekit-plugins-groq`, `python-dotenv`, and `aiohttp`)*.

3. Create an `.env` file in the `agent` folder:
   ```env
   LIVEKIT_URL=wss://your-livekit-project.livekit.cloud
   LIVEKIT_API_KEY=API...
   LIVEKIT_API_SECRET=SEC...
   GROQ_API_KEY=gsk_...
   DEEPGRAM_API_KEY=dg_...
   ROOKIES_API_URL=http://localhost:3000/api/agent
   ROOKIES_AGENT_SECRET=your_secure_agent_secret
   ```

4. Run the voice agent in development mode:
   ```bash
   python main.py dev
   ```

---

## 🗄️ Relational Database Schema (Prisma)

Rookies utilizes a multi-tenant PostgreSQL architecture where every transactional model is securely mapped to a `Business` via `business_id` using PostgreSQL Row Level Security (RLS).

| Model | Purpose | Key Attributes |
| :--- | :--- | :--- |
| **`User`** | Tracks merchant profiles | `clerkId`, `email`, `name`, `phone` |
| **`Business`** | Central tenant profile | `name`, `slug`, `type`, `city`, `gstNumber` |
| **`BusinessMember`** | Links merchants to businesses | `userId`, `businessId`, `role` (owner/admin) |
| **`InventoryItem`** | Tracks retail items in stock | `name`, `sku`, `quantity`, `unit`, `costPrice`, `sellPrice`, `lowStockAt` |
| **`Order`** | Records user transactions | `customer_name`, `customer_phone`, `items` (JSON), `total_amount`, `status` |
| **`Customer`** | CRM profile of regular buyers | `name`, `phone`, `email`, `address`, `notes` |
| **`Payment`** | Transaction logging | `amount`, `method` (UPI/cash), `status` (pending/received) |
| **`VoiceSession`** | Log of voice-assistant room starts | `roomName`, `userId`, `startedAt`, `commandCount` |
| **`VoiceCommand`** | Audit log of vocal intent parsed | `transcript`, `intent`, `entities` (JSON), `success` |

---

## 🛣️ Development Roadmap

- [x] Onboarding setup flow with Business DNA onboarding (4-step setup).
- [x] Prisma Multi-tenant schema integration.
- [x] Orders, Inventory and CRM management pages.
- [x] Asynchronous Voice Agent core implementation using LiveKit 0.12.
- [x] Conversational item-adding flow (`add_inventory` tool) with field-skipping.
- [x] LiveKit bidirectional dashboard navigation sync.
- [x] Custom context-trimming to eliminate rate-limiting latency.
- [ ] WhatsApp Automated Messaging integration (using n8n webhook workflow).
- [ ] Direct offline backup sync and automatic inventory alerts to WhatsApp.
- [ ] Indian regional language support (Hindi, Marathi, Kannada) in the Voice STT/TTS pipeline.

---

## 📄 License & Collaboration
This project is private and proprietary. All rights reserved. For issues, contact the repository administrator.
