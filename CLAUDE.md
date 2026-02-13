# CLAUDE.md — GapMap Project

## Project Overview

GapMap is an AI-powered location strategy platform that helps entrepreneurs find optimal business locations. It combines Google Maps with Gemini AI to analyze competition, identify market gaps, assess accessibility, and provide strategic location recommendations.

**Core value proposition:** Ask a natural-language question like "Where should I open a gym in Bukit Jalil?" and get an interactive map with competitor markers, AI-driven zone analysis (Red/Orange/Green circles with coordinates), accessibility scoring, and environmental data (elevation, air quality, timezone).

**Target users:** Entrepreneurs, small business owners, franchise developers scouting new locations.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| UI | React | 19.2.3 |
| Language | TypeScript (strict) | 5.9.3 |
| Styling | Tailwind CSS v4 | ^4 |
| Animations | Framer Motion | ^12.31.1 |
| Icons | Lucide React | ^0.563.0 |
| Maps | @googlemaps/js-api-loader + @googlemaps/markerclusterer | ^2.0.2 / ^2.6.2 |
| AI | @google/generative-ai (Gemini) | ^0.24.1 |

**No database.** All state is in-memory (React useState). No auth, no persistence.

## Architecture

Feature-based directory structure with barrel exports:

```
src/
├── app/
│   ├── page.tsx                    # Main orchestrator (client component)
│   ├── layout.tsx                  # Root layout (Geist fonts, metadata)
│   ├── globals.css                 # Theme, glassmorphism, scrollbar, InfoWindow overrides
│   └── api/
│       ├── chat/route.ts           # POST /api/chat — Gemini AI intent classification
│       └── market-analysis/route.ts # POST /api/market-analysis — AI zone analysis
├── features/
│   ├── chat/
│   │   ├── index.ts                # Exports: ChatSidebar, useChat, useMarketAnalysis
│   │   ├── components/
│   │   │   ├── ChatSidebar.tsx     # Left sidebar: header, search, messages, input
│   │   │   ├── ChatMessage.tsx     # Message bubble with markdown + inline analysis cards
│   │   │   ├── ChatInput.tsx       # Textarea + quick action buttons (Find/Directions/Analyze)
│   │   │   └── MarketAnalysisCard.tsx # Inline card showing zone analysis in chat
│   │   └── hooks/
│   │       ├── useChat.ts          # Chat state, POST /api/chat, returns intent+query
│   │       └── useMarketAnalysis.ts # POST /api/market-analysis, returns AnalysisCardData
│   └── map/
│       ├── index.ts                # Exports: Map, ResultsPanel, useMapActions
│       ├── components/
│       │   ├── Map.tsx             # Google Maps + Street View + ZoneComparisonTable
│       │   ├── ResultsPanel.tsx    # Right sidebar: results listed and grouped by AI zone
│       │   └── SearchBar.tsx       # Search input with recent searches dropdown
│       └── hooks/
│           └── useMapActions.ts    # All map operations: search, directions, zones, accessibility
├── shared/
│   ├── types/
│   │   └── chat.ts                 # All shared TypeScript interfaces
│   ├── constants/
│   │   └── mapStyles.ts            # Light, Dark, Satellite map styles + defaults
│   └── utils/
│       ├── geminiChat.ts           # Gemini 2.5 Flash — system prompt, JSON mode, intent classification
│       ├── geminiMarketAnalysis.ts # Market analysis prompt builder with zone coordinate rules
│       ├── googleMaps.ts           # Google Maps loader (maps, places, visualization, routes, geocoding)
│       ├── geocoding.ts            # Forward/reverse geocode + extractLocationFromQuery()
│       ├── distanceMatrix.ts       # Accessibility scoring (8-direction travel times, 0-100 score)
│       ├── elevation.ts            # Elevation API (flood risk assessment)
│       ├── airQuality.ts           # Air Quality API (AQI, health/business impact)
│       ├── timezone.ts             # Timezone API (local time display)
│       ├── routes.ts               # Routes API v2 (advanced routing with alternatives)
│       ├── zoneClusterer.ts        # Haversine-based place clustering into zones
│       ├── infoWindowRenderer.ts   # Rich HTML InfoWindow (photos, reviews, badges, environment)
│       └── markerIcons.ts          # Category-based marker colors (restaurant=red, cafe=amber, etc.)
```

**Path alias:** `@/*` maps to `./src/*` (configured in tsconfig.json).

## External APIs

All Google APIs use the same API key (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`). Gemini uses a separate server-side key.

### Google Maps Platform (client-side)
| API | Used In | Purpose |
|-----|---------|---------|
| Maps JavaScript API | `googleMaps.ts`, `Map.tsx` | Map rendering, Street View |
| Places API (Text Search) | `useMapActions.ts` | Search for businesses by query |
| Places API (Place Details) | `useMapActions.ts` | Full place info on marker click |
| Directions API | `useMapActions.ts` | Route rendering with alternatives |
| Distance Matrix API | `distanceMatrix.ts` | Accessibility scoring (8-direction travel times) |
| Elevation API | `elevation.ts` | Terrain/flood risk data |
| Geocoding API | `geocoding.ts` | Address <> coordinates conversion |

### Google APIs (REST, client-side)
| API | Used In | Purpose |
|-----|---------|---------|
| Air Quality API | `airQuality.ts` | AQI data (haze-aware for Malaysia) |
| Time Zone API | `timezone.ts` | Local time for any location |
| Routes API v2 | `routes.ts` | Advanced routing with alternatives |

### Gemini AI (server-side)
| Model | Used In | Purpose |
|-------|---------|---------|
| Gemini 2.5 Flash | `geminiChat.ts` | Intent classification + strategic business advice |
| Gemini 2.5 Flash | `geminiMarketAnalysis.ts` | Zone analysis with coordinate generation |

## API Routes

### `POST /api/chat`

**Request body** (`ChatApiRequest`):
```json
{
  "message": "Find gyms in Puchong",
  "history": [{ "id": "...", "role": "user", "content": "...", "timestamp": "ISO string" }],
  "mapContext": { "center": { "lat": 3.1, "lng": 101.6 }, "zoom": 14 }
}
```

**Response** (`ChatApiResponse`):
```json
{
  "intent": "search",
  "query": "gyms in Puchong Malaysia",
  "directions": null,
  "reply": "Searching for gyms in Puchong..."
}
```

**Intent values:** `search` | `directions` | `analyze` | `accessibility` | `chat`

### `POST /api/market-analysis`

Takes place results + business type + location + user query. Returns `AnalysisCardData` with Red/Orange/Green zones (each with `lat`, `lng`, `radius` in meters) plus strategic insights.

## AI System — Intent Classification

Gemini receives a detailed system instruction and returns structured JSON (JSON mode via `responseMimeType: 'application/json'`).

### Intent Flow

| Intent | Trigger | Map Action | AI Reply |
|--------|---------|------------|----------|
| `search` | "Find X in Y" | `searchPlaces(query, map)` | Brief acknowledgment |
| `directions` | "How to get from A to B" | `getDirections(origin, dest, map)` | Route overview |
| `analyze` | "Analyze market for X in Y" | `searchPlaces()` then `analyzeMarket()` then `renderAIZones()` | Full zone analysis with coordinates |
| `accessibility` | "How accessible is X" | `analyzeAccessibility(query, map)` | 8-direction travel analysis |
| `chat` | "Thanks!", general questions | None | Conversational response |

### AI Zone Analysis Flow (analyze intent)
1. `searchPlaces()` fetches all competitors (auto-paginates up to 60)
2. `analyzeMarket()` sends places to Gemini which returns `AnalysisCardData` with zone coordinates
3. `renderAIZones()` draws colored circles on map (red/orange/green), adds labels, pulses green zones
4. `ResultsPanel` auto-opens and groups results by zone using Haversine distance

### Key AI Behaviors
- **Zone coordinates:** Gemini calculates centroid lat/lng for red/orange zones from place data, estimates coordinates for green zones based on geographic gaps
- **Location precision:** Queries include "Malaysia" and use "in [location]" phrasing
- **Context awareness:** Map center/zoom appended to user message
- **Conversation history:** Full message history passed for follow-up understanding
- **Proactive analysis:** For outdoor businesses, mentions air quality; near rivers, mentions flood risk

## Key Hooks

### `useChat()` — `src/features/chat/hooks/useChat.ts`
Manages chat messages state. Sends POST to `/api/chat` with message + history + mapContext. Returns `{ intent, query, directions, category, location }` so the orchestrator (`page.tsx`) can trigger map actions.

### `useMarketAnalysis()` — `src/features/chat/hooks/useMarketAnalysis.ts`
Sends place results to `/api/market-analysis` for AI zone analysis. Returns `{ analysis: AnalysisCardData, insights: string }`.

### `useMapActions()` — `src/features/map/hooks/useMapActions.ts`
All map operations in one hook:
- **`searchPlaces(query, map, opts?)`** — Text Search with smart location filtering. Creates numbered markers with MarkerClusterer. Auto-paginates all pages (up to 60 results with 2s delay between pages).
- **`getDirections(origin, dest, map)`** — Directions with alternative routes displayed as gray polylines. Also fetches Routes API for richer data.
- **`analyzeAccessibility(query, map)`** — Searches first, then calculates travel times from 8 surrounding points using Distance Matrix API. Returns 0-100 score.
- **`renderAIZones(analysis, map)`** — Draws colored circles for Red/Orange/Green zones from AI-returned coordinates. Green zones pulse. Adds labels and InfoWindows. Auto fit-bounds.
- **`triggerMarkerClick(placeId)`** — Programmatically triggers a marker click (used by ResultsPanel).
- **`clearSearchResults()` / `clearDirections()`** — Cleanup markers, clusterer, zones, polylines.

**Environment enrichment:** When a marker is clicked, `getPlaceDetails` fetches full details then calls `enrichPlaceWithEnvironmentData()` which fetches elevation, AQI, and timezone in parallel (`Promise.allSettled`).

## Key Components

### `ChatSidebar` — `src/features/chat/components/ChatSidebar.tsx`
Left sliding sidebar (320px desktop, 85vw mobile) with:
- Header with GapMap logo (click to reload)
- SearchBar for direct place search
- Chat messages area with auto-scroll
- "Clear All Markers" button (shows when map has markers/directions)
- ChatInput with quick actions
- Suggestion buttons for empty state

### `ChatMessage` — `src/features/chat/components/ChatMessage.tsx`
Renders user/assistant messages with lightweight markdown: **bold**, `code`, bullet points, numbered lists, headings. Includes inline `MarketAnalysisCard` for analysis messages.

### `ChatInput` — `src/features/chat/components/ChatInput.tsx`
Auto-resizing textarea. Quick action buttons: Find, Directions, Analyze. Enter to send, Shift+Enter for newline.

### `Map` — `src/features/map/components/Map.tsx`
Full-screen Google Map with:
- Light theme by default, switches styles for satellite/hybrid views
- All standard controls enabled (zoom, map type, Street View, fullscreen, scale, rotate)
- Custom Street View header with back button and "Open in Google Maps" link
- Route info shown as InfoWindow at route midpoint
- Results count badge
- `ZoneComparisonTable` — Bottom panel showing AI zone data (name, level badge, competitor count, reasoning) when analysis is active

### `ResultsPanel` — `src/features/map/components/ResultsPanel.tsx`
Right sliding panel (320px) showing search results:
- Groups results by AI zones using Haversine distance (place within zone radius x 1.5)
- Zone sections with colored headers (red/orange/green) and sticky headers
- PlaceCard showing marker number, name, rating stars, type, address, open/closed status
- Click to pan map and trigger marker InfoWindow
- Falls back to flat list when no AI zone data

### `SearchBar` — `src/features/map/components/SearchBar.tsx`
Search input in the sidebar with recent searches dropdown (up to 5 shown, 10 stored).

## Type Definitions — `src/shared/types/chat.ts`

| Type | Purpose |
|------|---------|
| `ChatMessage` | `{ id, role, content, timestamp, analysisData? }` — stored in useChat state |
| `ChatContext` | `{ center?, zoom? }` — current map viewport sent to AI |
| `ChatApiRequest` | `{ message, history, mapContext? }` — POST body |
| `ChatApiResponse` | `{ intent, query, directions, reply, category?, location? }` — AI response |
| `PlaceResult` | Extended place data: core fields + delivery/takeout/dineIn/wheelchair + elevation/AQI/timezone |
| `MarketZone` | `{ name, reason, count?, lat, lng, radius }` — single zone with coordinates |
| `AnalysisCardData` | `{ businessType, location, redZones, orangeZones, greenZones, recommendation }` |

### Other Types (in util files)
| Type | File | Purpose |
|------|------|---------|
| `AirQualityData` | `airQuality.ts` | `{ aqi, category, dominantPollutant, color, healthRecommendation, businessImpact }` |
| `AccessibilityResult` | `distanceMatrix.ts` | Single origin-to-destination travel result |
| `AccessibilityAnalysis` | `distanceMatrix.ts` | Full 8-direction analysis with score (0-100) |
| `RouteOption` | `routes.ts` | `{ summary, distance, duration, distanceMeters, durationSeconds, warnings }` |
| `AdvancedRouteResult` | `routes.ts` | `{ routes[], bestRoute index, analysis string }` |
| `ZoneCluster` | `zoneClusterer.ts` | Haversine-based cluster result |
| `HeatmapMode` | `useMapActions.ts` | `'competition' \| 'opportunity' \| 'environment' \| 'off'` (inline type) |

## Utility Files

| File | Exports | Notes |
|------|---------|-------|
| `geminiChat.ts` | `chat()` | Server-side only. System prompt + JSON mode. Model: `gemini-2.5-flash`. |
| `geminiMarketAnalysis.ts` | `buildMarketAnalysisPrompt()` | Builds analysis prompt with coordinate calculation rules for zones. |
| `googleMaps.ts` | `loadGoogleMaps()` | Loads libraries: maps, places, visualization, routes, geocoding. Singleton pattern. |
| `geocoding.ts` | `reverseGeocode()`, `forwardGeocode()`, `extractLocationFromQuery()` | Cached. `extractLocationFromQuery` uses regex to pull location names from queries. |
| `distanceMatrix.ts` | `calculateAccessibility()` | Generates 8 surrounding points at configurable radius (default 3km), scores 0-100. |
| `elevation.ts` | `getElevation()` | Cached by 5-decimal lat/lng. Used for flood risk (<10m = high risk). |
| `airQuality.ts` | `getAirQuality()` | REST call to Air Quality API. Returns AQI + health recommendation + business impact. |
| `timezone.ts` | `getTimezone()` | Cached by 3-decimal lat/lng. Returns timezone ID + computed local time. |
| `routes.ts` | `getAdvancedRoutes()` | REST call to Routes API v2. Supports DRIVE/WALK/BICYCLE/TRANSIT. |
| `zoneClusterer.ts` | `clusterPlaces()` | Groups places into zone clusters using Haversine distance. |
| `infoWindowRenderer.ts` | `renderRichInfoWindow()` | Returns HTML string. Shows photo, rating, open status, service badges, environment badges, hours, reviews, Google Maps link. |
| `markerIcons.ts` | `getCategoryColor()` | Maps place types to colors (restaurant=#ef4444, cafe=#f59e0b, gym=#06b6d4, etc.). Default: #00f0ff (cyan). |

## Environment Variables

| Variable | Side | Required | Description |
|----------|------|----------|-------------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client + some REST APIs | Yes | Google Maps Platform key. Must have Maps JS, Places, Directions, Distance Matrix, Elevation, Geocoding, Air Quality, Routes, Timezone APIs enabled. |
| `GEMINI_API_KEY` | Server only | Yes | Google AI Studio key for Gemini 2.5 Flash. |

## Dev Commands

```bash
npm run dev      # Start dev server (Next.js)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

## Design System

**Theme:** Cyberpunk-inspired dark UI with glassmorphism.

**CSS Variables** (in `globals.css`):
- `--background: #0a0a0f` — app background
- `--foreground: #ededed` — text color
- `--cyber-cyan: #00f0ff` — primary accent
- `--cyber-magenta: #ff00ff` — secondary accent
- `--cyber-panel: #12121a` — panel/card background

**Key classes:**
- `.glass-panel` — `rgba(18,18,26,0.8)` + `backdrop-blur(12px)` + cyan border
- `.glow-cyan` / `.glow-magenta` — box-shadow glow effects
- `.animate-pulse-glow` — pulsing cyan glow animation
- `.custom-scrollbar` — thin cyan-tinted scrollbar

**Fonts:** Geist Sans + Geist Mono (via `next/font/google`).

**Map styles:** Light (default), Dark (cyberpunk), Satellite — auto-switch on map type change. Default center: `{ lat: 20, lng: 100 }` (Asia), zoom: 3.

**InfoWindow styling:** CSS overrides make Google Maps InfoWindows match the dark theme (#12121a background, cyan borders, glow shadow).

**Zone colors:**
- Red zones: `rgba(239, 68, 68, 0.15)` fill, `#ef4444` border — high competition
- Orange zones: `rgba(249, 115, 22, 0.15)` fill, `#f97316` border — moderate competition
- Green zones: `rgba(34, 197, 94, 0.15)` fill, `#22c55e` border — opportunity (pulsing animation)

## Data Flow

```
User types message
  -> useChat.sendMessage(content, mapContext)
    -> POST /api/chat { message, history, mapContext }
      -> geminiChat.chat() -> Gemini 2.5 Flash (JSON mode)
    <- { intent, query, directions, reply, category, location }
  -> page.tsx handleSendMessage() inspects intent:
    -> "search" -> searchPlaces(query, map) -> auto-open ResultsPanel
    -> "analyze" -> searchPlaces() -> analyzeMarket() -> renderAIZones() -> auto-open ResultsPanel
    -> "directions" -> getDirections(origin, dest, map)
    -> "accessibility" -> analyzeAccessibility(query, map)
    -> "chat" -> no map action, just display reply
```

## Layout

```
+------------------+----------------------------+------------------+
|   ChatSidebar    |         Google Map          |  ResultsPanel    |
|   (320px left)   |       (full screen)         |  (320px right)   |
|                  |                              |                  |
|  - Search bar    |  - Markers + Clusterer       |  - Zone headers  |
|  - Chat messages |  - AI Zone circles           |  - Place cards   |
|  - Quick actions |  - Route polylines           |  - Grouped by    |
|  - Suggestions   |  - Street View               |    zone color    |
|                  |  +------------------------+  |                  |
|                  |  | ZoneComparisonTable    |  |                  |
|                  |  | (bottom overlay)       |  |                  |
|                  |  +------------------------+  |                  |
+------------------+----------------------------+------------------+
```

Both sidebars slide in/out with Framer Motion animations. Toggle buttons appear when panels are closed.

## Known Limitations

- **No authentication** — anyone with the URL can use it
- **No persistence** — chat history lost on page refresh
- **No rate limiting** — API calls are unbounded (cost risk)
- **No SSR** — entire app is `'use client'` (page.tsx is client component)
- **Google API costs** — every search, direction, detail click, and enrichment costs money
- **Places API pagination** — `nextPage()` has a ~2s delay enforced by Google (auto-fetched, up to 60 results)
- **Accessibility analysis** — uses 2-second `setTimeout` to wait for search results (race condition possible)
- **Location filtering** — regex-based extraction (`extractLocationFromQuery`) may miss complex location names
- **AI zone coordinates** — Gemini estimates green zone coordinates based on geographic gaps; accuracy varies
