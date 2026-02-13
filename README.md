# GapMap - AI-Powered Location Strategy Platform

GapMap helps entrepreneurs find optimal business locations by combining Google Maps with Gemini AI. Ask a natural-language question like "Where should I open a gym in Bukit Jalil?" and get an interactive map with competitor markers, AI-driven zone analysis, accessibility scoring, and environmental data.

## Features

- **AI Chat Interface** — Conversational sidebar with quick actions (Find, Directions, Analyze)
- **AI Zone Analysis** — Gemini identifies Red (saturated), Orange (moderate), and Green (opportunity) zones with precise coordinates rendered as colored map circles
- **Pulsing Green Zones** — Opportunity zones animate to draw attention
- **Results Panel** — Right-side sliding panel listing all search results grouped by zone
- **Auto-Pagination** — Automatically fetches all Google Places results (up to 60)
- **Rich Info Windows** — Photos, ratings, reviews, service badges, elevation, AQI, timezone
- **Directions & Routes** — Multi-route display with alternatives and Routes API v2 data
- **Accessibility Scoring** — 8-direction travel time analysis with 0-100 score
- **Environmental Data** — Elevation (flood risk), Air Quality Index, timezone per location
- **Adaptive Map Styling** — Light theme for roadmap, optimized styles for satellite/hybrid
- **Street View** — Integrated with custom header and "Open in Google Maps" link

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **AI:** Google Gemini 2.5 Flash
- **Maps:** Google Maps JavaScript API + MarkerClusterer
- **UI:** Tailwind CSS v4, Framer Motion, Lucide Icons
- **Language:** TypeScript (strict)

## Getting Started

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
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

**Get your API keys:**
- **Google Maps API Key:** https://console.cloud.google.com/apis/credentials
  - Enable: Maps JavaScript API, Places API, Directions API, Distance Matrix API, Elevation API, Geocoding API, Air Quality API, Routes API, Timezone API
- **Gemini API Key:** https://aistudio.google.com/app/apikey

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Usage Examples

Try these queries in the chat:

- "I want to open a Pet Cafe in Selangor. Where should I set up?"
- "Analyze the market for opening a Coffee Shop in Kuala Lumpur"
- "Find gyms in Puchong"
- "How to get from KL Sentral to Bukit Jalil"
- "How accessible is Mid Valley Megamall?"

The AI will respond with:
- **Zone Circles** on the map — Red (high competition), Orange (moderate), Green (opportunity)
- **Numbered Markers** for each competitor with rich info windows
- **Results Panel** listing all places grouped by zone
- **Strategic Insights** with market analysis and recommendations

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Main orchestrator (client component)
│   ├── layout.tsx                  # Root layout (Geist fonts, metadata)
│   ├── globals.css                 # Theme, glassmorphism, scrollbar, InfoWindow overrides
│   └── api/
│       ├── chat/route.ts           # POST /api/chat — Gemini AI intent classification
│       └── market-analysis/route.ts # POST /api/market-analysis — Zone analysis
│
├── features/
│   ├── chat/
│   │   ├── index.ts                # Exports: ChatSidebar, useChat, useMarketAnalysis
│   │   ├── components/
│   │   │   ├── ChatSidebar.tsx     # Left sidebar: header, search, messages, input
│   │   │   ├── ChatMessage.tsx     # Message bubble with markdown + analysis cards
│   │   │   ├── ChatInput.tsx       # Textarea + quick action buttons
│   │   │   └── MarketAnalysisCard.tsx # Inline analysis card in chat messages
│   │   └── hooks/
│   │       ├── useChat.ts          # Chat state, POST /api/chat, returns intent+query
│   │       └── useMarketAnalysis.ts # POST /api/market-analysis, returns zone data
│   │
│   └── map/
│       ├── index.ts                # Exports: Map, ResultsPanel, useMapActions
│       ├── components/
│       │   ├── Map.tsx             # Google Maps + Street View + zone comparison table
│       │   ├── ResultsPanel.tsx    # Right sidebar: results grouped by zone
│       │   └── SearchBar.tsx       # Search input with recent searches dropdown
│       └── hooks/
│           └── useMapActions.ts    # All map operations: search, directions, zones, accessibility
│
└── shared/
    ├── constants/
    │   └── mapStyles.ts            # Light, Dark, Satellite map styles
    ├── types/
    │   └── chat.ts                 # All shared TypeScript interfaces
    └── utils/
        ├── geminiChat.ts           # Gemini 2.5 Flash — system prompt, JSON mode
        ├── geminiMarketAnalysis.ts # Market analysis prompt with zone coordinate generation
        ├── googleMaps.ts           # Google Maps loader (singleton)
        ├── geocoding.ts            # Forward/reverse geocode + location extraction
        ├── distanceMatrix.ts       # Accessibility scoring (8-direction, 0-100)
        ├── elevation.ts            # Elevation API (flood risk)
        ├── airQuality.ts           # Air Quality API (AQI + business impact)
        ├── timezone.ts             # Timezone API (local time)
        ├── routes.ts               # Routes API v2 (advanced routing)
        ├── zoneClusterer.ts        # Haversine-based place clustering into zones
        ├── infoWindowRenderer.ts   # Rich HTML InfoWindow renderer
        └── markerIcons.ts          # Category-based marker colors
```

## How It Works

1. **User Query** — Chat input (e.g., "Analyze market for gyms in Bukit Jalil")
2. **AI Intent Classification** — Gemini 2.5 Flash classifies intent: `search`, `analyze`, `directions`, `accessibility`, or `chat`
3. **Map Action** — Based on intent:
   - **search/analyze** — Searches Google Places, auto-fetches all pages (up to 60 results)
   - **analyze** — Additionally runs AI zone analysis returning Red/Orange/Green zones with lat/lng/radius
   - **directions** — Renders routes with alternatives
   - **accessibility** — Calculates 8-direction travel times
4. **Zone Rendering** — AI-returned zones drawn as colored circles on the map with labels and pulsing animations for green zones
5. **Results Panel** — Opens automatically, groups results by zone proximity using Haversine distance
6. **AI Response** — Strategic insights and market analysis displayed in chat

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/xiangzhi2003/GapMap)

### Environment Variables

After deploying, add these in Vercel project Settings > Environment Variables:
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `GEMINI_API_KEY`

### Google Maps API Key Configuration

Update your API key to allow your Vercel domain:
1. Go to https://console.cloud.google.com/apis/credentials
2. Click on your API key > HTTP referrers, add:
   - `https://your-app.vercel.app/*`
   - `https://*.vercel.app/*` (for preview deployments)

## License

MIT

## Credits

Built with Claude