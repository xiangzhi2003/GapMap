# GapMap - Market Gap Intelligence

AI-powered location strategy tool that helps entrepreneurs identify market gaps and find the best locations to open their businesses using competitor density heatmap analysis.

## Features

- 🗺️ **Interactive Google Maps** with full controls (satellite, street view, terrain)
- 🤖 **AI-Powered Analysis** via Gemini 2.5 Flash for intelligent location recommendations
- 🔥 **Competitor Heatmap** visualization showing market saturation
- 📍 **Green Zone Recommendations** highlighting low-competition opportunities
- 📊 **Analysis Cards** with Red/Orange/Green zone breakdowns and strategic advice
- 💬 **Conversational Interface** for natural business location queries

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

```
src/
├── app/
│   ├── api/chat/          # Gemini chat API endpoint
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main page
├── components/
│   ├── AnalysisCard.tsx    # Floating market analysis popup
│   ├── ChatSidebar.tsx     # Chat interface
│   ├── Map.tsx             # Google Maps component
│   └── ...
├── hooks/
│   ├── useChat.ts          # Chat state management
│   └── useMapActions.ts    # Map action executor (heatmap, pins, etc.)
├── types/
│   └── chat.ts             # TypeScript interfaces
└── utils/
    ├── geminiChat.ts       # AI chat logic + action extraction
    └── googleMaps.ts       # Google Maps loader

```

## How It Works

1. **User Query** → Chat input ("Open a cafe in Selangor")
2. **AI Processing** → Gemini analyzes and returns 3 actions:
   - `heatmap` - competitor density points
   - `greenZone` - recommended location pin
   - `analysisCard` - full zone breakdown
3. **Map Execution** → All actions render on the map simultaneously
4. **Visual Output** → Heatmap overlay + gold pin + analysis card popup

## License

MIT

## Credits

Built with Claude Sonnet 4.5
