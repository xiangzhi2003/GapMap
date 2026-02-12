# CLAUDE.md — GapMap Project

## Project Overview

GapMap is an AI-powered location strategy platform that helps entrepreneurs find optimal business locations. It combines Google Maps with Gemini AI to analyze competition, identify market gaps, assess accessibility, and provide strategic location recommendations.

**Core value proposition:** Ask a natural-language question like "Where should I open a gym in Bukit Jalil?" and get an interactive map with competitor markers, market gap analysis, accessibility scoring, and environmental data (elevation, air quality, timezone).

**Target users:** Entrepreneurs, small business owners, franchise developers scouting new locations.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| UI | React | 19.2.3 |
| Language | TypeScript (strict) | ^5 |
| Styling | Tailwind CSS v4 | ^4 |
| Animations | Framer Motion | ^12.31.1 |
| Icons | Lucide React | ^0.563.0 |
| Maps | @googlemaps/js-api-loader + @googlemaps/markerclusterer | 2.0.2 / 2.6.2 |
| AI | @google/generative-ai (Gemini) | ^0.24.1 |

**No database.** All state is in-memory (React useState). No auth, no persistence.

## Architecture

Feature-based directory structure with barrel exports:

```
src/
├── app/
│   ├── page.tsx              # Main orchestrator (client component)
│   ├── layout.tsx            # Root layout (Geist fonts, metadata)
│   ├── globals.css           # Theme, glassmorphism, scrollbar, InfoWindow overrides
│   └── api/chat/route.ts     # POST /api/chat — Gemini AI endpoint
├── features/
│   ├── chat/
│   │   ├── index.ts          # Exports: ChatSidebar, useChat
│   │   ├── components/
│   │   │   ├── ChatSidebar.tsx   # Sidebar panel: header, search, messages, input
│   │   │   ├── ChatMessage.tsx   # Message bubble with lightweight markdown renderer
│   │   │   └── ChatInput.tsx     # Textarea + quick action buttons (Find/Directions/Analyze)
│   │   └── hooks/
│   │       └── useChat.ts        # Chat state, sends POST /api/chat, returns intent+query
│   └── map/
│       ├── index.ts          # Exports: Map, useMapActions
│       ├── components/
│       │   ├── Map.tsx           # Google Maps initialization, Street View, route info
│       │   └── SearchBar.tsx     # Search input with recent searches dropdown
│       └── hooks/
│           └── useMapActions.ts  # All map operations: search, directions, accessibility
├── shared/
│   ├── types/
│   │   └── chat.ts           # All shared TypeScript interfaces
│   ├── constants/
│   │   └── mapStyles.ts      # Light, Dark, Satellite map styles + defaults
│   └── utils/
│       ├── geminiChat.ts     # Gemini 2.5 Flash — system prompt, JSON mode, intent classification
│       ├── googleMaps.ts     # Google Maps loader (maps, places, visualization, routes, geocoding)
│       ├── geocoding.ts      # Forward/reverse geocode + extractLocationFromQuery()
│       ├── distanceMatrix.ts # Accessibility scoring (8-direction travel times, 0-100 score)
│       ├── elevation.ts      # Elevation API (flood risk assessment)
│       ├── airQuality.ts     # Air Quality API (AQI, health/business impact)
│       ├── timezone.ts       # Timezone API (local time display)
│       ├── routes.ts         # Routes API (advanced routing with alternatives)
│       ├── infoWindowRenderer.ts  # Rich HTML InfoWindow (photos, reviews, badges, environment)
│       └── markerIcons.ts    # Category-based marker colors (restaurant=red, cafe=amber, etc.)
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
| Geocoding API | `geocoding.ts` | Address ↔ coordinates conversion |

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

## API Route

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

## AI System — Intent Classification

Gemini receives a detailed system instruction and returns structured JSON (JSON mode via `responseMimeType: 'application/json'`).

### Intent Flow

| Intent | Trigger | Map Action | AI Reply |
|--------|---------|------------|----------|
| `search` | "Find X in Y" | `searchPlaces(query, map)` | Brief acknowledgment |
| `directions` | "How to get from A to B" | `getDirections(origin, dest, map)` | Route overview |
| `analyze` | "Analyze market for X in Y" | `searchPlaces(query, map)` | Full market analysis with competition, gaps, terrain, AQI |
| `accessibility` | "How accessible is X" | `analyzeAccessibility(query, map)` | Accessibility overview + 8-direction travel analysis |
| `chat` | "Thanks!", general questions | None | Conversational response |

### Key AI Behaviors
- **Location precision:** Queries include "Malaysia" and use "in [location]" phrasing to enforce geographic boundaries
- **Context awareness:** Map center/zoom appended to user message so AI references the visible area
- **Conversation history:** Full message history passed to Gemini for follow-up understanding
- **Proactive analysis:** For outdoor businesses, AI mentions air quality; for areas near rivers, mentions flood risk

## Key Hooks

### `useChat()` — `src/features/chat/hooks/useChat.ts`
Manages chat messages state. Sends POST to `/api/chat` with message + history + mapContext. Returns `{ intent, query, directions }` so the orchestrator (`page.tsx`) can trigger map actions.

### `useMapActions()` — `src/features/map/hooks/useMapActions.ts`
All map operations in one hook:
- **`searchPlaces(query, map)`** — Text Search with smart location filtering (geocode → bounds → filter by address match). Creates numbered markers with MarkerClusterer. Supports pagination.
- **`getDirections(origin, dest, map)`** — Directions with alternative routes displayed as gray polylines. Also fetches Routes API for richer data.
- **`analyzeAccessibility(query, map)`** — Searches first, then calculates travel times from 8 surrounding points using Distance Matrix API. Returns 0-100 score.
- **`loadMoreResults(map)`** — Pagination via Google Places `nextPage()`.
- **`clearSearchResults()` / `clearDirections()`** — Cleanup markers, clusterer, heatmap, polylines.

**Environment enrichment:** When a marker is clicked, `getPlaceDetails` fetches full details then calls `enrichPlaceWithEnvironmentData()` which fetches elevation, AQI, and timezone in parallel (`Promise.allSettled`).

## Key Components

### `ChatSidebar` — `src/features/chat/components/ChatSidebar.tsx`
Sliding sidebar (320px desktop, 85vw mobile) with:
- Header with GapMap logo (click to reload)
- SearchBar for direct place search
- Chat messages area with auto-scroll
- "Clear All Markers" button (shows when map has markers/directions)
- ChatInput with quick actions
- Suggestion buttons for empty state ("Open a Pet Cafe in Selangor", etc.)

### `ChatMessage` — `src/features/chat/components/ChatMessage.tsx`
Renders user/assistant messages with lightweight markdown: **bold**, `code`, bullet points, numbered lists, headings.

### `ChatInput` — `src/features/chat/components/ChatInput.tsx`
Auto-resizing textarea. Quick action buttons: Find, Directions, Analyze. Enter to send, Shift+Enter for newline.

### `Map` — `src/features/map/components/Map.tsx`
Full-screen Google Map with:
- Light theme by default, switches styles for satellite/hybrid views
- All standard controls enabled (zoom, map type, Street View, fullscreen, scale, rotate)
- Custom Street View header (Google Maps style) with back button and "Open in Google Maps" link
- Route info shown as InfoWindow at route midpoint
- "Load More Results" button for pagination
- Results count badge

### `SearchBar` — `src/features/map/components/SearchBar.tsx`
Search input in the sidebar with recent searches dropdown (up to 5 shown, 10 stored).

## Type Definitions — `src/shared/types/chat.ts`

| Type | Purpose |
|------|---------|
| `ChatMessage` | `{ id, role, content, timestamp }` — stored in useChat state |
| `ChatContext` | `{ center?, zoom? }` — current map viewport sent to AI |
| `ChatApiRequest` | `{ message, history, mapContext? }` — POST body |
| `ChatApiResponse` | `{ intent, query, directions, reply }` — AI response |
| `PlaceResult` | Extended place data: core fields + delivery/takeout/dineIn/wheelchair + elevation/AQI/timezone |
| `AnalysisCardData` | Red/orange/green zone analysis structure (defined but not currently rendered as a card) |

### Other Types (in util files)
| Type | File | Purpose |
|------|------|---------|
| `AirQualityData` | `airQuality.ts` | `{ aqi, category, dominantPollutant, color, healthRecommendation, businessImpact }` |
| `AccessibilityResult` | `distanceMatrix.ts` | Single origin→destination travel result |
| `AccessibilityAnalysis` | `distanceMatrix.ts` | Full 8-direction analysis with score (0-100) |
| `RouteOption` | `routes.ts` | `{ summary, distance, duration, distanceMeters, durationSeconds, warnings }` |
| `AdvancedRouteResult` | `routes.ts` | `{ routes[], bestRoute index, analysis string }` |

## Utility Files

| File | Exports | Notes |
|------|---------|-------|
| `geminiChat.ts` | `chat()` | Server-side only. System prompt + JSON mode. Model: `gemini-2.5-flash`. |
| `googleMaps.ts` | `loadGoogleMaps()` | Loads libraries: maps, places, visualization, routes, geocoding. Singleton pattern. |
| `geocoding.ts` | `reverseGeocode()`, `forwardGeocode()`, `extractLocationFromQuery()` | Cached. `extractLocationFromQuery` uses regex to pull location names from queries. |
| `distanceMatrix.ts` | `calculateAccessibility()` | Generates 8 surrounding points at configurable radius (default 3km), scores 0-100. |
| `elevation.ts` | `getElevation()` | Cached by 5-decimal lat/lng. Used for flood risk (<10m = high risk). |
| `airQuality.ts` | `getAirQuality()` | REST call to Air Quality API. Returns AQI + health recommendation + business impact. |
| `timezone.ts` | `getTimezone()` | Cached by 3-decimal lat/lng. Returns timezone ID + computed local time. |
| `routes.ts` | `getAdvancedRoutes()` | REST call to Routes API v2. Supports DRIVE/WALK/BICYCLE/TRANSIT. |
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

## Data Flow

```
User types message
  → useChat.sendMessage(content, mapContext)
    → POST /api/chat { message, history, mapContext }
      → geminiChat.chat() → Gemini 2.5 Flash (JSON mode)
    ← { intent, query, directions, reply }
  → page.tsx handleSendMessage() inspects intent:
    → "search"/"analyze" → useMapActions.searchPlaces(query, map)
    → "directions" → useMapActions.getDirections(origin, dest, map)
    → "accessibility" → useMapActions.analyzeAccessibility(query, map)
    → "chat" → no map action, just display reply
```

## Known Limitations

- **No authentication** — anyone with the URL can use it
- **No persistence** — chat history lost on page refresh
- **No rate limiting** — API calls are unbounded (cost risk)
- **No SSR** — entire app is `'use client'` (page.tsx is client component)
- **Google API costs** — every search, direction, detail click, and enrichment costs money
- **Places API pagination** — `nextPage()` has a ~2s delay enforced by Google
- **Accessibility analysis** — uses 2-second `setTimeout` to wait for search results (race condition possible)
- **`AnalysisCardData`** — type defined but not rendered as a visual card component
- **Location filtering** — regex-based extraction (`extractLocationFromQuery`) may miss complex location names
