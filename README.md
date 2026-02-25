# GapMap — AI-Powered Location Strategy Platform

> Find your best business location using AI, not guesswork.

---

## Executive Summary

GapMap is an AI-powered location strategy platform that helps entrepreneurs make data-driven decisions about where to open their business. The core problem it solves is one of the leading causes of small business failure: choosing a location based on intuition rather than evidence. GapMap replaces weeks of manual research — visiting sites, counting competitors, estimating foot traffic — with a single natural-language question answered in seconds.

The technical pipeline works as follows: a user's plain-English query is classified by Gemini 2.5 Flash into a structured intent, which triggers a live search of the Google Places API for all nearby competitors. Those results are then sent back to Gemini for spatial market analysis, which returns Red, Orange, and Green zones — each with real latitude, longitude, and radius values — that are rendered as interactive circles directly on a Google Map.

GapMap is built on top of eight Google Maps Platform APIs (Places, Directions, Distance Matrix, Elevation, Air Quality, Routes, Geocoding, and Timezone), Gemini 2.5 Flash for both intent classification and market zone analysis, and Firebase for Google OAuth authentication and Firestore-backed session persistence. The platform makes this level of location intelligence — previously the domain of expensive consulting firms — freely accessible to any entrepreneur with a question to ask.

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

## Alignment with UN Sustainable Development Goals

**SDG 8 — Decent Work and Economic Growth**

A poor location choice is one of the most common and preventable causes of small business failure. Most first-time entrepreneurs lack access to market research tools, so they rely on guesswork — and pay for it with failed ventures and lost livelihoods. GapMap directly addresses this by giving any entrepreneur — regardless of budget or background — the same quality of location analysis that large corporations commission from professional consultants. By reducing avoidable business failures, GapMap contributes to more sustainable economic participation and job creation at the grassroots level.

---

**SDG 9 — Industry, Innovation and Infrastructure**

GapMap represents a novel application of AI to geospatial reasoning: rather than simply summarising text, Gemini generates precise geographic coordinates (latitude, longitude, radius) that drive real map geometry. This transforms a language model into a spatial planning tool — an infrastructure layer for location intelligence that did not previously exist at this accessibility level. The natural-language interface also removes the data literacy barrier that typically gates access to GIS tools, making geospatial analysis available to people who have never worked with maps programmatically.

---

**SDG 10 — Reduced Inequalities**

Historically, detailed market gap analysis required hiring location consultants, purchasing commercial GIS data, or employing analysts with specialised skills — all of which are out of reach for small operators. Large franchise groups and retail chains make location decisions backed by expensive research; independent entrepreneurs do not. GapMap closes this gap by giving a street food vendor or a first-time cafe owner the same analytical capability as a multinational expansion team. Equal access to business intelligence is a form of economic equity.

---

**SDG 11 — Sustainable Cities and Communities**

Urban commercial clustering is wasteful: when businesses of the same type concentrate in the same area, they create congestion in some zones and leave others commercially underserved. GapMap's Green Zone detection actively guides entrepreneurs toward areas with genuine demand and low competition — not just the obvious high-footfall streets everyone defaults to. Over time, this kind of data-driven distribution of new businesses can contribute to more balanced, liveable urban development and reduce the hollowing out of underserved neighbourhoods.

---

## AI Innovation — How GapMap Uses Gemini

### Intent Classification as an Orchestration Layer

Rather than building separate UI flows for search, directions, analysis, and accessibility queries, GapMap uses Gemini 2.5 Flash as an orchestration layer. Every user message is sent to `/api/chat` along with the full conversation history and the current map viewport (center coordinates and zoom level). Gemini returns structured JSON — enforced via `responseMimeType: 'application/json'` — that identifies the intent, extracts the search query, and isolates the business category and location name.

This approach means the interface has no forms, no dropdowns, and no mode switching. The user types naturally; the AI decides what to do. Feeding the full conversation history into every call enables genuine follow-up question support: "What about further south?" works because Gemini knows what the previous question was about. Injecting map context (coordinates + zoom) grounds the AI's spatial reasoning in what the user is currently looking at. `thinkingBudget: 0` is set on this call to keep latency low for what is effectively a routing decision.

### Market Zone Analysis with Coordinate Generation

The more novel AI application is in `/api/market-analysis`. After GapMap collects up to 60 competitor locations from the Google Places API, the top 20 by rating are sent to Gemini with a carefully engineered prompt that instructs it to perform spatial reasoning over geographic data.

The key innovation is that Gemini does not return text commentary — it returns machine-readable zone objects, each with a `lat`, `lng`, and `radius` in metres. These values drive real Google Maps geometry: circles are drawn, pulsing animations are triggered, and results are grouped by zone using Haversine distance calculations. For Red and Orange zones (areas of high competition), Gemini is instructed to calculate the geographic centroid of the actual competitor cluster — averaging their coordinates to find the true centre of that density. For Green zones (market opportunity areas), Gemini identifies geographic gaps in the distribution and estimates coordinates that represent underserved areas, reasoning about where demand likely exists without supply.

Each zone also includes a target audience analysis (income level, age range, primary lifestyle traits) and a zone-specific strategic recommendation. For certain business types, Gemini proactively includes environmental commentary — noting flood risk for low-elevation sites, or air quality concerns for businesses relying on outdoor footfall.

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

## Challenges Faced During Development

### 1. Making AI Output Drive Map Geometry

The hardest design challenge was getting Gemini to produce geographic coordinates accurate enough to render meaningful map circles — not just plausible-sounding ones. Early versions of the system prompt produced zones that were offset from the actual competitor clusters, or that assigned wildly inconsistent radii.

The fix was to encode explicit coordinate calculation rules directly in the market analysis system prompt: Red and Orange zone coordinates must be derived by averaging the `lat` and `lng` values of the competitors assigned to that cluster; radius must reflect the actual spread of those competitors rather than a fixed default. Green zone coordinates require different reasoning — Gemini is instructed to identify the midpoint of the largest geographic gap in competitor distribution, rather than picking an arbitrary empty area. Iterating on these instructions until the zones landed correctly on real maps took significant prompt engineering effort.

### 2. Intent Disambiguation Between Search and Analyze

Early versions of the intent classifier over-triggered `analyze` for queries that were really just searches. "Find bubble tea shops in Bangsar" should map to `search` (show me what exists), not `analyze` (do a full market gap analysis). The over-classification caused unnecessary Gemini API calls and confused users who just wanted to browse.

The solution was to include explicit trigger-word lists in the system prompt — keywords like "analyze", "market gap", "best location", and "where should I open" map to `analyze`, while "find", "show me", and "nearby" default to `search`. Ambiguous queries default to `search` rather than `analyze`, which is the lower-cost and more recoverable mistake.

### 3. Places API Pagination Race Condition

Google's Places API enforces a mandatory ~2-second delay between paginated result pages. The initial implementation dispatched results to the market analysis pipeline as soon as the first page arrived — meaning Gemini was analysing 20 results when 60 were eventually available, producing incomplete zone coverage.

The fix was to ensure pagination fully completes before the analysis pipeline is triggered. The `searchPlaces()` function now awaits all pages sequentially (up to three pages with enforced 2-second gaps) and only then dispatches the full result set to `/api/market-analysis`. This adds up to 6 seconds of search time for dense areas, but ensures the analysis is based on a complete competitor picture.

### 4. Google Maps InfoWindow Dark Theme

Google Maps InfoWindows render inside a Shadow DOM-like structure that is isolated from the page's global stylesheet. Standard Tailwind classes and CSS selectors do not reach inside them, meaning the default white InfoWindow appeared jarringly out of place against GapMap's dark cyberpunk theme.

The fix required targeting specific internal Google Maps CSS classes — `.gm-style-iw`, `.gm-style-iw-d`, `.gm-style-iw-t`, and the close button `.gm-ui-hover-effect` — with `!important` overrides in `globals.css`. These class names are undocumented and subject to change in Google Maps updates, but they are the only available injection point for InfoWindow theming without building a fully custom overlay from scratch.

### 5. Parallel Environmental API Coordination

Clicking a competitor marker triggers three simultaneous API calls — Elevation, Air Quality, and Timezone — in addition to the Places Details fetch. Early implementations used sequential `await` chaining, which meant a single slow or failing API would block the entire InfoWindow from rendering.

The fix was to switch to `Promise.allSettled()` for all three environmental calls. This means the InfoWindow renders with whatever data is available: if Air Quality returns an error (which happens in areas with no monitoring stations), the elevation and timezone data still appear. Partial data is shown with graceful fallback labels rather than an error state. This pattern is now applied consistently in `infoWindowRenderer.ts`.

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
