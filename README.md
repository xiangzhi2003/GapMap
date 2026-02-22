# GapMap — AI-Powered Location Strategy Platform

> Find your best business location using AI, not guesswork.

---

## The Problem

Every year, thousands of small businesses fail not because of a bad product — but because of a bad location. Entrepreneurs pick locations based on gut feeling, proximity to home, or simply because a shopfront was available. They rarely know how many competitors are nearby, whether the area is accessible, or if there is even a market gap to fill.

Researching a location the traditional way takes weeks: visiting areas in person, counting competitors, estimating foot traffic, checking road access. Most first-time entrepreneurs skip this step entirely.

**GapMap solves this in seconds.**

---

## What Is GapMap

GapMap is a web-based AI platform that helps entrepreneurs find the optimal location for their business. A user describes what they want to open and where they are considering — in plain, natural language — and GapMap responds with a live interactive map, competitor analysis, AI-generated zone recommendations, and strategic insights.

It is not a directory or a search engine. It is a **location intelligence tool** that thinks like a business consultant.

---

## How It Works — User Journey

### 1. Sign In
The user signs in with their Google account. This gates the platform and enables persistent chat history across sessions.

### 2. Ask a Question
The user types a natural-language question in the chat sidebar, for example:

> *"I want to open a pet cafe in Subang Jaya. Is there a market gap?"*
> *"Analyze competition for bubble tea shops in Bukit Jalil"*
> *"How accessible is a location near Pavilion KL?"*

No special syntax or form to fill in — just plain conversation.

### 3. AI Classifies the Intent
The message is sent to **Gemini 2.5 Flash** which reads it and decides what the user actually wants:

| Intent | What it means | What happens next |
|--------|--------------|-------------------|
| `search` | Find places nearby | Map shows competitor markers |
| `analyze` | Market gap analysis | Full zone analysis with AI zones |
| `directions` | Route from A to B | Routes rendered on map |
| `accessibility` | How easy is it to reach | 8-direction travel time scoring |
| `chat` | General question | AI responds conversationally |

### 4. The Map Responds
Based on the intent, the map executes the corresponding action:

- **Competitors are found** via Google Places API — automatically fetching all available results, up to 60 locations, across multiple pages
- **Numbered markers** appear for each competitor, grouped intelligently using a clustering algorithm when results are dense
- **A results panel** slides in from the right, listing every place with its name, rating, address, and open/closed status

### 5. AI Zone Analysis
For market analysis queries, the competitors are sent to Gemini for deeper analysis. The AI returns three types of geographic zones — each with real map coordinates (latitude, longitude, and radius in metres):

- **Red Zones** — Saturated areas. 5 or more competitors within close range. Entering here is high risk.
- **Orange Zones** — Moderate competition. 2–4 competitors. Differentiation is possible but requires a strong angle.
- **Green Zones** — Market gaps. 0–1 competitors. The AI identifies these as the best opportunity areas, and they pulse on the map to draw attention.

These zones are drawn as coloured circles directly on the Google Map.

### 6. Deep Place Information
Clicking any competitor marker opens a rich information window showing:
- Business photos from Google
- Star ratings and selected customer reviews
- Open/closed status and operating hours
- Service flags: delivery, takeout, dine-in, wheelchair accessibility, outdoor seating
- **Elevation** of the location (flood risk assessment — below 10m above sea level is flagged)
- **Air Quality Index** — real-time AQI data (haze-aware for Malaysia)
- **Local timezone and current time**

### 7. Results Grouped by Zone
The results panel organises competitors by which AI zone they fall within, using geographic proximity (Haversine distance). This makes it easy to visually understand which areas are crowded versus open.

### 8. Strategic Insights in Chat
The chat sidebar displays the AI's analysis as a readable message: which zones to avoid, which zones offer opportunity, what type of customer the area attracts, and what income bracket lives or works nearby.

### 9. History Saved Automatically
Every message and every analysis is saved to the user's account in real time. The user can return days later, switch sessions, review a past analysis, or start a fresh conversation — all without losing previous work.

---

## Core Features

### AI Capabilities
- Natural language intent classification (5 intent types)
- Market gap zone generation with real geographic coordinates
- Target audience profiling per zone (income level, age range, demographics)
- Context-aware environmental commentary (flood risk, air quality, business impact)
- Conversation history fed into every AI call for follow-up question support

### Map Capabilities
- Live competitor search with auto-pagination (up to 60 results)
- Marker clustering for dense result sets
- AI zone circles (red/orange/green) with animated pulsing for green zones
- Zone comparison table showing zone name, competition level, reasoning
- Multi-route directions with alternative routes
- Street View integration with a custom navigation header
- Light, Dark, and Satellite map styles

### Accessibility Analysis
- Calculates travel times from 8 cardinal and intercardinal directions (N, NE, E, SE, S, SW, W, NW)
- Uses a 3km radius by default, configurable
- Returns a single accessibility score from 0–100
- Powered by Google Distance Matrix API

### Environmental Intelligence
- **Elevation API** — Identifies flood-prone areas (< 10m above sea level = high risk)
- **Air Quality API** — Returns AQI category, dominant pollutant, health recommendation, and business impact. Malaysia haze season aware.
- **Timezone API** — Shows current local time for any searched location

### Authentication and Persistence
- Google Sign-In via Firebase Authentication (OAuth 2.0)
- Chat sessions stored in Cloud Firestore, organised per user
- Session history panel in the sidebar with session titles, timestamps, and message count
- Load any past session to resume an analysis; delete sessions that are no longer needed

---

## Technical Architecture

### System Overview

```
Browser (React / Next.js)
│
├── ChatSidebar (left panel)
│   ├── useChat hook  →  POST /api/chat  →  Gemini 2.5 Flash
│   └── SessionContext  →  Firestore (read/write chat history)
│
├── Google Map (full screen)
│   └── useMapActions hook
│       ├── Google Places API  (search, place details)
│       ├── Google Directions API  (routes)
│       ├── Google Distance Matrix API  (accessibility)
│       ├── Google Elevation API  (flood risk)
│       ├── Google Air Quality API  (AQI)
│       ├── Google Timezone API  (local time)
│       └── Google Routes API v2  (advanced routing)
│
└── ResultsPanel (right panel)
    └── Groups results by zone using Haversine distance
```

### AI Layer

Two separate Gemini 2.5 Flash calls serve different purposes:

**Intent Classification (`/api/chat`)**
Receives the user message, full conversation history, and current map context (center coordinates + zoom level). Returns structured JSON identifying the intent, the search query, and any relevant entities (business category, location name). Uses JSON mode (`responseMimeType: 'application/json'`) for reliable parsing.

**Market Analysis (`/api/market-analysis`)**
Receives up to 20 of the highest-rated competitors (filtered to control cost and prompt size). Returns a full zone analysis object with Red, Orange, and Green zones — each containing a human-readable name, reasoning, geographic centroid, radius in metres, and audience fit rating. Green zone coordinates are estimated by Gemini based on identified geographic gaps in the competitor distribution.

### Data Flow for Zone Analysis

```
User message  →  /api/chat  →  intent: "analyze"
                                query: "bubble tea in Bukit Jalil"
      │
      ▼
searchPlaces()
  Google Places Text Search
  auto-paginate: page 1 → 2s wait → page 2 → 2s wait → page 3
  up to 60 results total
  create numbered markers + MarkerClusterer
      │
      ▼
/api/market-analysis
  top 20 competitors by rating sent to Gemini
  Gemini returns:
    redZones:    [{ name, reason, lat, lng, radius, count }]
    orangeZones: [{ name, reason, lat, lng, radius, count }]
    greenZones:  [{ name, reason, lat, lng, radius, audienceFit }]
    recommendation: "string"
    targetAudienceAnalysis: { primaryAudience, incomeLevel, ageRange, keyTraits }
      │
      ▼
renderAIZones()
  draw circles on Google Map
  green zones get pulsing animation
  zone labels added as map overlays
  map auto-fits to show all zones
      │
      ▼
ResultsPanel
  Haversine distance check: is each place inside a zone? (1.5x radius threshold)
  group and render under zone headers
      │
      ▼
Firestore
  message + analysisData saved to users/{uid}/sessions/{sessionId}/messages/{id}
```

### Firestore Data Model

```
users/{uid}
├── displayName, email, photoURL, lastSignIn

└── sessions/{sessionId}
    ├── title          (first user message, truncated to 60 chars)
    ├── createdAt
    ├── updatedAt
    ├── messageCount
    ├── lastMessage    (preview, 80 chars)

    └── messages/{messageId}
        ├── id
        ├── role       ("user" | "assistant")
        ├── content    (text of message)
        ├── timestamp
        └── analysisData  (full zone JSON, or null)
```

---

## Technologies Used

### AI and Intelligence
| Technology | Role |
|-----------|------|
| Google Gemini 2.5 Flash | Intent classification + market zone analysis |
| JSON Mode (`responseMimeType`) | Forces Gemini to return machine-readable JSON |
| Conversation history injection | Enables follow-up questions and context retention |

### Mapping and Location
| Technology | Role |
|-----------|------|
| Google Maps JavaScript API | Interactive map rendering |
| Google Places API | Business search and detailed place data |
| Google Directions API | Route calculation and display |
| Google Distance Matrix API | Travel time from 8 directions (accessibility score) |
| Google Elevation API | Terrain height for flood risk |
| Google Air Quality API | Real-time AQI and health data |
| Google Routes API v2 | Advanced routing with multiple alternatives |
| Google Timezone API | Local time for any location |
| Google Geocoding API | Address to coordinates conversion |
| MarkerClusterer | Groups dense markers into cluster bubbles |

### Backend
| Technology | Role |
|-----------|------|
| Next.js App Router | Framework with API routes for server-side AI calls |
| TypeScript (strict) | Full type safety across the entire codebase |
| Gemini API (server-side) | AI key kept server-side only, never exposed to browser |

### Frontend
| Technology | Role |
|-----------|------|
| React 19 | UI component rendering |
| Tailwind CSS v4 | Utility-first styling |
| Framer Motion | Sidebar/panel animations, zone pulse effects |
| Lucide React | Icon library |

### Authentication and Database
| Technology | Role |
|-----------|------|
| Firebase Authentication | Google OAuth sign-in |
| Cloud Firestore | NoSQL database for chat history persistence |
| Firestore `onSnapshot` | Real-time session list updates in sidebar |

---

## Design Approach

GapMap uses a **cyberpunk-inspired dark theme** with glassmorphism panels. The design language was chosen to feel analytical and data-driven — like a command centre for business intelligence rather than a standard web app.

**Colour system:**
- Background: `#0a0a0f` (near black)
- Primary accent: `#00f0ff` (cyan) — used for highlights, borders, active states
- Secondary accent: `#ff00ff` (magenta) — used sparingly for contrast
- Panel background: `#12121a` with `backdrop-blur` for glassmorphism

**Zone colours are semantically meaningful:**
- Red (`#ef4444`) — danger, saturation, avoid
- Orange (`#f97316`) — caution, moderate, consider carefully
- Green (`#22c55e`) — opportunity, proceed, recommended

Green zones pulse using a CSS keyframe animation to draw the user's eye toward the most actionable information on the map.

**Layout:**

```
┌─────────────────┬──────────────────────────┬─────────────────┐
│   ChatSidebar   │       Google Map          │  ResultsPanel   │
│   (380px min)   │     (full screen)         │   (320px)       │
│                 │                           │                 │
│  Search bar     │  Markers + Clusterer      │  Zone headers   │
│  Chat messages  │  AI Zone circles          │  Place cards    │
│  History panel  │  Route polylines          │  Grouped by     │
│  User profile   │  Street View              │  zone colour    │
│                 │  ┌─────────────────────┐  │                 │
│                 │  │ Zone Comparison     │  │                 │
│                 │  │ Table (bottom)      │  │                 │
│                 │  └─────────────────────┘  │                 │
└─────────────────┴──────────────────────────┴─────────────────┘
```

Both sidebars slide in and out with spring animations. On mobile, they open as full-screen overlays with a backdrop. The chat sidebar is resizable by dragging its right edge.

---

## Scope and Limitations

- **Malaysia-focused** — The AI system prompt is tuned for Malaysian geography and market context. Location examples, air quality data, and flood risk thresholds are calibrated for this region.
- **No rate limiting** — The prototype makes live API calls on every interaction. In a production deployment, rate limiting and caching would be required to manage cost.
- **AI coordinate accuracy** — Red and Orange zone coordinates are derived from actual competitor locations. Green zone coordinates are estimated by Gemini based on detected geographic gaps — accuracy varies by area density.
- **Places API limit** — Google enforces a mandatory ~2-second delay between paginated results. Fetching 60 results takes approximately 6 seconds.
- **No offline support** — All data is fetched live. There is no caching layer or offline mode.

---

## License

MIT

## Credits

Built with [Claude](https://claude.ai) · AI by [Google Gemini](https://deepmind.google/technologies/gemini/) · Maps by [Google Maps Platform](https://developers.google.com/maps) · Auth & Database by [Firebase](https://firebase.google.com)
