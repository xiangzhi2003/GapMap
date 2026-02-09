# GapMap - Market Gap Intelligence

AI-powered location strategy tool that helps entrepreneurs identify market gaps and find the best locations to open their businesses using competitor density heatmap analysis.

## Features

- 🗺️ **Interactive Google Maps** with clean white theme and full controls (roadmap, satellite, street view, terrain)
- 🎨 **Adaptive Map Styling** - Automatically switches between light roadmap and satellite-optimized themes
- 🤖 **AI-Powered Analysis** via Gemini 2.5 Flash for intelligent location recommendations
- 🔥 **Competitor Heatmap** visualization showing market saturation
- 📍 **Green Zone Recommendations** highlighting low-competition opportunities
- 📊 **Analysis Cards** with Red/Orange/Green zone breakdowns and strategic advice
- 💬 **Conversational Interface** with quick action buttons (Find, Directions, Analyze)

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **AI:** Google Gemini 2.5 Flash
- **Maps:** Google Maps JavaScript API (Maps, Places, Visualization)
- **UI:** Tailwind CSS v4, Framer Motion, Lucide Icons
- **Language:** TypeScript

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

Copy the example env file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

**Get your API keys:**
- **Google Maps API Key:** https://console.cloud.google.com/apis/credentials
  - Enable: Maps JavaScript API, Places API, Directions API
- **Gemini API Key:** https://aistudio.google.com/app/apikey

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/xiangzhi2003/GapMap)

### Important: Environment Variables

After deploying to Vercel, you **must** add the environment variables:

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add both keys:
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - `GEMINI_API_KEY`
3. Select **Production**, **Preview**, and **Development**
4. Click **Save** and redeploy

### Configure Google Maps API Key

Update your Google Maps API key to allow your Vercel domain:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your API key
3. Under **Application restrictions** → **HTTP referrers**, add:
   - `https://your-app.vercel.app/*`
   - `https://*.vercel.app/*` (for preview deployments)
4. Click **Save**

## Usage Examples

Try these queries in the chat:
- "I want to open a Pet Cafe in Selangor. Where should I set up?"
- "Analyze the market for opening a Coffee Shop in Kuala Lumpur"
- "Show me restaurant gaps in Shah Alam"

The AI will respond with:
- 🔥 **Heatmap** showing competitor density (red = saturated, sparse = opportunity)
- ⭐ **Green Zone Pin** marking the recommended location
- 📊 **Analysis Card** with detailed zone breakdown and strategic advice

## Project Structure

Feature-based architecture for scalability and maintainability:

```
src/
├── app/                              # Next.js App Router
│   ├── api/chat/route.ts             # Gemini AI chat endpoint
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Main page (orchestrates features)
│
├── features/                         # Feature modules (self-contained)
│   ├── chat/                         # Chat feature
│   │   ├── components/               # Chat UI components
│   │   │   ├── ChatSidebar.tsx       # Chat sidebar with history
│   │   │   ├── ChatInput.tsx         # Message input with quick actions
│   │   │   └── ChatMessage.tsx       # Message display with markdown
│   │   ├── hooks/
│   │   │   └── useChat.ts            # Chat state & API communication
│   │   └── index.ts                  # Feature barrel export
│   │
│   └── map/                          # Map feature
│       ├── components/               # Map UI components
│       │   ├── Map.tsx               # Google Maps with controls
│       │   └── SearchBar.tsx         # Location search
│       ├── hooks/
│       │   └── useMapActions.ts      # Map interactions & markers
│       └── index.ts                  # Feature barrel export
│
└── shared/                           # Shared resources
    ├── constants/
    │   └── mapStyles.ts              # Light roadmap & satellite map themes
    ├── types/
    │   ├── index.ts                  # Global type definitions
    │   └── chat.ts                   # Chat & map action types
    └── utils/
        ├── geminiChat.ts             # AI chat logic
        ├── googleMaps.ts             # Maps API loader
        ├── infoWindowRenderer.ts     # Custom info windows
        ├── markerIcons.ts            # Marker styling
        └── mockData.ts               # Fallback data
```

**Architecture Benefits:**
- 🎯 **Feature Isolation**: Each feature is self-contained with its own components and hooks
- 🔧 **Easy Maintenance**: Related code is grouped together
- 📦 **Scalable**: Add new features by creating a new folder in `features/`
- 🔗 **Clear Dependencies**: Features use shared resources, not each other
- 🧪 **Testable**: Features can be tested in isolation

## Map Features

### Adaptive Styling
The map automatically adjusts its styling based on the selected view type:

- **Roadmap View**: Clean white theme with light gray backgrounds, blue water, and green parks - matching Google Maps' signature style
- **Satellite/Hybrid View**: White text with dark strokes for optimal readability against satellite imagery
- **Automatic Switching**: Styles update instantly when changing map types

### Quick Actions
Three convenient buttons for common tasks:
- 🔍 **Find** - Search for places and businesses
- 🧭 **Directions** - Get route planning and navigation
- 📊 **Analyze** - Market analysis for business locations

## How It Works

1. **User Query** → Chat input ("Open a cafe in Selangor")
2. **AI Processing** → Gemini 2.5 Flash analyzes intent and extracts:
   - Search query for Google Places API
   - Location context and business type
   - Strategic recommendations
3. **Map Visualization** → Results displayed with:
   - Place markers with clustering
   - Rich info windows with ratings & reviews
   - Directions and route planning
4. **AI Response** → Strategic insights and market analysis

## License

MIT

## Credits

Built with Claude Sonnet 4.5
