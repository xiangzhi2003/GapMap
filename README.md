# GapMap — AI-Powered Location Strategy Platform

> **Find the best location for your business using AI-driven market gap analysis.**

GapMap helps entrepreneurs and small business owners stop guessing where to open their next venture. Simply ask a natural-language question — *"Where should I open a gym in Bukit Jalil?"* — and instantly get an interactive map with competitor locations, AI-generated opportunity zones, accessibility scores, and real-world environmental data.

Built for the **hackathon** as a full-stack prototype demonstrating the integration of conversational AI, geospatial analysis, and real-time data.

---

## The Problem

Scouting a business location traditionally requires weeks of manual research — visiting areas, counting competitors, checking accessibility, studying demographics. Most entrepreneurs skip this step entirely and rely on gut feeling, leading to poor location decisions.

**GapMap automates this entire process in seconds using AI.**

---

## Features

### AI Intelligence
- **Conversational AI Chat** — Natural-language interface powered by Gemini 2.5 Flash. Understands 5 intent types: search, analyze, directions, accessibility, and general chat
- **AI Zone Analysis** — Gemini identifies Red (saturated), Orange (moderate competition), and Green (market gap) zones with precise geographic coordinates
- **Target Audience Profiling** — AI returns income level, age range, and demographic traits per zone
- **Context-Aware Advice** — Proactively mentions flood risk near rivers, air quality for outdoor businesses, and other environmental factors

### Map & Location
- **Live Competitor Search** — Auto-paginates Google Places results (up to 60 competitors per search)
- **Zone Circles on Map** — Red/Orange/Green circles drawn at AI-calculated coordinates with radius in meters; green zones pulse to draw attention
- **Numbered Markers + Clustering** — MarkerClusterer handles dense result sets, numbered markers match results panel
- **Rich Info Windows** — Photos, ratings, reviews, open/closed status, service badges (delivery, takeout, wheelchair), elevation, AQI, and local timezone
- **Directions & Routes** — Multi-route display with alternatives via Routes API v2
- **Accessibility Scoring** — 8-direction travel time analysis returning a 0–100 score
- **Street View** — Integrated with custom header and "Open in Google Maps" link

### Environmental Data (per location)
- **Elevation** — Flood risk assessment (below 10m = high risk)
- **Air Quality Index** — Malaysia haze-aware AQI with health and business impact rating
- **Local Timezone** — Live local time for any searched location

### Authentication & Persistence
- **Google Sign-In** — Secure OAuth via Firebase Authentication; no anonymous access
- **Chat History** — Every conversation auto-saved to Cloud Firestore, organized by session
- **Session Browser** — Sidebar history panel to reload or delete past sessions
- **Cross-Device Sync** — Sign in on any device and access previous analyses

### UI/UX
- **Cyberpunk Dark Theme** — Glassmorphism panels, cyan/magenta accents, animated glow effects
- **Resizable Sidebar** — Drag the right edge to adjust width (380px–560px)
- **Responsive Mobile Layout** — Works on phones and tablets; starts closed on mobile to show map first
- **Results Panel** — Right-side sliding panel grouping competitors by AI zone

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript (strict) | 5.9.3 |
| AI Model | Google Gemini 2.5 Flash | via `@google/generative-ai` |
| Maps | Google Maps Platform (10 APIs) | `@googlemaps/js-api-loader` |
| Auth | Firebase Authentication | Firebase 12.9.0 |
| Database | Cloud Firestore | Firebase 12.9.0 |
| UI | React | 19.2.3 |
| Styling | Tailwind CSS | v4 |
| Animations | Framer Motion | ^12.31.1 |
| Icons | Lucide React | ^0.563.0 |

---

## How It Works

```
User types: "Analyze market for coffee shops in Bangsar"
        │
        ▼
POST /api/chat  →  Gemini 2.5 Flash (JSON mode)
        │          classifies intent: "analyze"
        │          extracts: category="coffee shop", location="Bangsar"
        ▼
searchPlaces()  →  Google Places Text Search
        │          auto-paginates up to 60 results
        │          creates numbered map markers + clusterer
        ▼
POST /api/market-analysis  →  Gemini 2.5 Flash
        │                     analyzes competitor distribution
        │                     returns Red/Orange/Green zones
        │                     with lat/lng/radius coordinates
        ▼
renderAIZones()  →  draws colored circles on map
                    green zones pulse
                    zone labels + InfoWindows added
        │
        ▼
ResultsPanel  →  groups competitors by zone (Haversine distance)
ChatMessage   →  displays strategic insights + analysis card
Firestore     →  saves entire conversation to user's session
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Google Cloud project with billing enabled
- A Google AI Studio account (free)
- A Firebase project (free tier)

### 1. Clone the repository

```bash
git clone https://github.com/xiangzhi2003/GapMap.git
cd GapMap
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create `.env.local` in the project root:

```env
# Gemini AI (server-side only)
GEMINI_API_KEY=your_gemini_api_key

# Google Maps Platform (client-side)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Firebase (client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### 4. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com) → **Create a project**
2. **Enable Authentication:**
   - Go to Authentication → Get started → Sign-in method
   - Enable **Google** provider → Save
3. **Enable Firestore:**
   - Go to Firestore Database → Create database
   - Choose **Production mode** → select a region → Done
4. **Register your web app:**
   - Project Settings → Your apps → Add app → Web (`</>`)
   - Copy the `firebaseConfig` values into your `.env.local`
5. **Add authorized domains** (required for Google Sign-In to work):
   - Authentication → Settings → Authorized domains → **Add domain**
   - Add: `localhost` (for local dev)
   - Add: `your-app.vercel.app` (for production)
6. **Set Firestore security rules:**
   - Firestore Database → Rules → paste the following:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /sessions/{sessionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        match /messages/{messageId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
  }
}
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — sign in with Google and start analyzing.

---

## Environment Variables Reference

| Variable | Side | Where to Get |
|----------|------|-------------|
| `GEMINI_API_KEY` | Server only | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client | Firebase Console → Project Settings → Your apps |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client | Same as above |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client | Same as above |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Client | Same as above |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Client | Same as above |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Client | Same as above |

---

## Google Maps APIs to Enable

In [Google Cloud Console](https://console.cloud.google.com/apis/library), enable all of the following for your API key:

| API | Used For |
|-----|---------|
| Maps JavaScript API | Map rendering, Street View |
| Places API | Business search (Text Search + Place Details) |
| Directions API | Route calculation and display |
| Distance Matrix API | 8-direction accessibility scoring |
| Elevation API | Flood risk assessment |
| Geocoding API | Address ↔ coordinates conversion |
| Air Quality API | AQI data (Malaysia haze-aware) |
| Routes API | Advanced routing with alternatives |
| Time Zone API | Local time per location |

---

## Usage Examples

Sign in, then try these queries in the chat sidebar:

| Query | What Happens |
|-------|-------------|
| `Analyze market for coffee shops in Bangsar` | Zone analysis with Red/Orange/Green circles on map |
| `Where should I open a gym in Bukit Jalil?` | Full competitor scan + AI recommendation |
| `Find pet cafes in Petaling Jaya` | Numbered markers with rich info windows |
| `How to get from KL Sentral to Mid Valley` | Multi-route directions with alternatives |
| `How accessible is Pavilion KL?` | 8-direction travel time analysis, 0–100 score |
| `I want to open a bakery in Puchong` | Competitor search + market gap zones |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                     # Main orchestrator — auth gating, layout, intent routing
│   ├── layout.tsx                   # Root layout — fonts, viewport, AuthProvider wrapper
│   ├── globals.css                  # Theme variables, glassmorphism, InfoWindow overrides
│   └── api/
│       ├── chat/route.ts            # POST /api/chat — Gemini intent classification
│       └── market-analysis/route.ts # POST /api/market-analysis — AI zone analysis
│
├── features/
│   ├── auth/
│   │   ├── context/AuthContext.tsx  # Google Sign-In, onAuthStateChanged, user state
│   │   ├── components/LoginScreen.tsx # Full-screen glassmorphic login UI
│   │   └── index.ts
│   │
│   ├── sessions/
│   │   ├── context/SessionContext.tsx # Firestore CRUD, session list (onSnapshot), message load
│   │   ├── types/session.ts          # FirestoreMessage, FirestoreSession, Timestamp helpers
│   │   └── index.ts
│   │
│   ├── chat/
│   │   ├── components/
│   │   │   ├── ChatSidebar.tsx      # Left sidebar — search, messages, history, user profile
│   │   │   ├── ChatMessage.tsx      # Message bubble with markdown + inline analysis cards
│   │   │   ├── ChatInput.tsx        # Auto-resize textarea + quick action buttons
│   │   │   └── MarketAnalysisCard.tsx # Zone summary card shown inside chat messages
│   │   ├── hooks/
│   │   │   ├── useChat.ts           # POST /api/chat, intent parsing, message state
│   │   │   └── useMarketAnalysis.ts # POST /api/market-analysis, zone data
│   │   └── index.ts
│   │
│   └── map/
│       ├── components/
│       │   ├── Map.tsx              # Google Map, zone circles, Street View, zone comparison table
│       │   ├── ResultsPanel.tsx     # Right panel — results grouped by AI zone
│       │   └── SearchBar.tsx        # Search input with recent searches dropdown
│       ├── hooks/
│       │   └── useMapActions.ts     # All map ops: search, directions, zones, accessibility
│       └── index.ts
│
├── lib/
│   └── firebase.ts                  # Firebase singleton (auth + db)
│
└── shared/
    ├── constants/
    │   └── mapStyles.ts             # Light, Dark, Satellite map styles
    ├── types/
    │   └── chat.ts                  # All TypeScript interfaces (ChatMessage, AnalysisCardData, etc.)
    └── utils/
        ├── geminiChat.ts            # Gemini system prompt + JSON mode intent classification
        ├── geminiMarketAnalysis.ts  # Market analysis prompt with zone coordinate rules
        ├── googleMaps.ts            # Maps loader (singleton, loads all libraries)
        ├── geocoding.ts             # Forward/reverse geocode + location name extraction
        ├── distanceMatrix.ts        # 8-direction accessibility scoring (0–100)
        ├── elevation.ts             # Elevation API with flood risk assessment
        ├── airQuality.ts            # Air Quality API (AQI + health/business impact)
        ├── timezone.ts              # Timezone API (local time per location)
        ├── routes.ts                # Routes API v2 (advanced routing)
        ├── zoneClusterer.ts         # Haversine-based place clustering
        ├── infoWindowRenderer.ts    # Rich HTML InfoWindow (photos, ratings, badges)
        └── markerIcons.ts           # Category-based marker colors
```

---

## Firestore Data Model

```
users/{uid}
  ├── displayName, email, photoURL, lastSignIn
  └── sessions/{sessionId}
        ├── title, createdAt, updatedAt, messageCount, lastMessage
        └── messages/{messageId}
              ├── id, role ("user" | "assistant")
              ├── content, timestamp
              └── analysisData (zone analysis JSON or null)
```

---

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/xiangzhi2003/GapMap)

### Step 1 — Add all environment variables in Vercel

Go to your Vercel project → Settings → Environment Variables and add all 8 variables:

- `GEMINI_API_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Step 2 — Add your Vercel domain to Firebase authorized domains

Firebase Console → Authentication → Settings → Authorized domains → Add:
- `your-app.vercel.app`
- `chiang-xiang-zhis-projects.vercel.app` (covers all preview deployments)

### Step 3 — Restrict your Google Maps API key

Google Cloud Console → APIs & Credentials → your API key → HTTP referrers:
- `https://your-app.vercel.app/*`
- `https://*.vercel.app/*`
- `http://localhost:3000/*`

---

## Known Limitations

- No rate limiting — every user action calls paid Google APIs (cost risk in production)
- AI zone coordinates are estimated by Gemini; accuracy varies for green (gap) zones
- Places API auto-pagination has a mandatory ~2s delay per page (Google enforced)
- Accessibility analysis depends on a `setTimeout` to wait for search results
- Location name extraction uses regex and may miss complex or compound location names

---

## License

MIT — see [LICENSE](LICENSE)

## Credits

Built with [Claude](https://claude.ai) · Powered by [Google Gemini](https://deepmind.google/technologies/gemini/) · Maps by [Google Maps Platform](https://developers.google.com/maps) · Auth & DB by [Firebase](https://firebase.google.com)
