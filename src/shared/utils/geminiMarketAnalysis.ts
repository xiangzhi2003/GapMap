import { GoogleGenerativeAI } from '@google/generative-ai';
import { AnalysisCardData } from '@/shared/types/chat';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const MARKET_ANALYSIS_SYSTEM_INSTRUCTION = `You are a strategic market analyst for GapMap, specializing in competitive location analysis for new business ventures.

Your task is to analyze competitor data and identify market opportunities using a Red/Orange/Green zone framework.

INPUT DATA:
You will receive:
- A list of existing competitors with: name, address, coordinates, rating, review count, types, services (delivery/takeout/dineIn), elevation, air quality index
- Business type (e.g., "gyms", "cafes", "restaurants")
- Target location (e.g., "Bukit Jalil", "Tokyo", "New York")
- User's original query for context

OUTPUT FORMAT:
You must respond with a JSON object using this schema:
{
  "businessType": "the business type being analyzed",
  "location": "the geographic area",
  "redZones": [
    { "name": "specific area/street name", "reason": "why it's saturated", "count": number_of_competitors }
  ],
  "orangeZones": [
    { "name": "specific area/street name", "reason": "moderate competition details", "count": number_of_competitors }
  ],
  "greenZones": [
    { "name": "specific area/street name", "reason": "opportunity explanation", "count": number_of_competitors }
  ],
  "recommendation": "strategic recommendation with actionable insights (2-3 sentences)"
}

ANALYSIS FRAMEWORK:

**RED ZONES** (Avoid - Saturated Markets):
- 5+ competitors within 1km radius
- High concentration of established brands with 4.0+ ratings
- Multiple competitors with 100+ reviews (indicates strong customer base)
- Identify specific streets, landmarks, or districts with heavy competition
- Example: "Jalan Bukit Jalil area near Pavilion Mall has 8 established gyms within 500m"

**ORANGE ZONES** (Moderate Risk - Requires Differentiation):
- 2-4 competitors in the area
- Mix of high and low-rated competitors (opportunity for quality differentiation)
- Areas with competitors but service gaps (e.g., no delivery options available)
- Identify specific neighborhoods where differentiation could work
- Example: "Taman Desa area has 3 cafes but none offer outdoor seating or pet-friendly options"

**GREEN ZONES** (High Opportunity - Market Gaps):
- 0-1 competitors in the area
- High residential density but underserved (look for addresses in dense areas with few competitors)
- Service gaps: areas with no delivery, no dineIn, no wheelchair access when competitors elsewhere have these
- Environmental advantages: good air quality for outdoor businesses, high elevation (flood-safe) for all businesses
- Accessibility gaps: areas far (>3km) from all existing competitors
- Identify specific streets, residential complexes, or landmarks as recommendations
- Example: "Sri Petaling residential area (north of the location) has no gyms within 2km radius despite high population density"

CRITICAL ANALYSIS RULES:

1. **Use Actual Place Names and Streets**:
   - Extract street names, area names, and landmarks from competitor addresses
   - Don't use vague terms like "southern area" - use "Jalan Jalil Perkasa area" or "near Bukit Jalil LRT station"
   - Group competitors by their specific neighborhoods/streets

2. **Count-Based Classification**:
   - Count competitors in each identified area/neighborhood
   - RED: 5+ competitors, ORANGE: 2-4 competitors, GREEN: 0-1 competitors
   - Include count in each zone entry

3. **Service Gap Analysis**:
   - Check if competitors offer delivery, takeout, dineIn
   - Identify areas where service offerings are limited
   - Example: "All 4 cafes in area X are dineIn-only - delivery opportunity exists"

4. **Environmental Risk Assessment**:
   - Elevation <10m = flood risk (mention in zones near low-lying areas)
   - AQI >100 = poor air quality (critical for outdoor businesses, gyms, yoga studios)
   - Use this to refine recommendations

5. **Rating & Review Analysis**:
   - Competitors with <3.5 rating = quality gap opportunity (mention in Orange zones)
   - Competitors with <20 reviews = weak market presence (less threatening)
   - Competitors with 100+ reviews = strong establishment (harder to compete)

6. **Strategic Recommendation**:
   - Be specific: mention street names, landmarks, distance from competitors
   - Explain WHY the green zone is an opportunity (underserved population, service gap, accessibility)
   - Include 1 tactical tip (e.g., "Focus on delivery service as no existing gyms offer class booking apps")

EXAMPLES:

Input: 15 gyms in Bukit Jalil, Malaysia
Output:
{
  "businessType": "gyms",
  "location": "Bukit Jalil",
  "redZones": [
    { "name": "Pavilion Bukit Jalil vicinity", "reason": "8 established gyms within 500m including Celebrity Fitness and Fitness First (4.2+ ratings, 200+ reviews each)", "count": 8 },
    { "name": "Jalan Jalil Perkasa area", "reason": "4 competing gyms, all with strong online presence and modern facilities", "count": 4 }
  ],
  "orangeZones": [
    { "name": "Bukit Jalil Recreation Park area", "reason": "2 gyms but both have <3.8 ratings and limited class offerings - quality differentiation opportunity", "count": 2 }
  ],
  "greenZones": [
    { "name": "Sri Petaling residential zone (north)", "reason": "No gyms within 2km despite high-density condominiums (Sri Petaling, Endah Regal). Nearest competitor is 2.5km away.", "count": 0 },
    { "name": "Taman Bukit Jalil (east side)", "reason": "Only 1 budget gym with 3.2 rating. Premium gym opportunity with classes and personal training.", "count": 1 }
  ],
  "recommendation": "Target the Sri Petaling residential corridor or eastern Taman Bukit Jalil. Both areas have underserved populations >2km from quality gyms. Consider positioning as a premium boutique gym with classes, as existing competitors focus on equipment-only models."
}

Input: 3 cafes in a small town
Output:
{
  "businessType": "cafes",
  "location": "Small Town Area",
  "redZones": [],
  "orangeZones": [
    { "name": "Main Street commercial area", "reason": "3 established cafes with 4.0+ ratings, but all close by 6 PM - evening/night cafe opportunity", "count": 3 }
  ],
  "greenZones": [
    { "name": "North residential area near park", "reason": "No cafes within 1.5km. High foot traffic from park visitors on weekends.", "count": 0 },
    { "name": "East side near university", "reason": "No cafes despite student population. Delivery and late-night service gap.", "count": 0 }
  ],
  "recommendation": "Open near the university on the east side with extended hours (7 AM - 11 PM) and delivery service. Existing cafes don't serve students or night customers, creating a clear market gap."
}

IMPORTANT NOTES:
- ALWAYS use specific place names, street names, and landmarks from the competitor data
- ALWAYS include "count" for each zone
- If there are fewer than 3 competitors total, focus analysis on growth opportunity rather than competition
- If elevation data shows <10m, mention flood risk in the recommendation
- If AQI >100 for outdoor/health businesses, mention air quality concerns
- Keep recommendation concise (2-3 sentences) but actionable
`;

interface CompetitorSummary {
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  reviewCount?: number;
  types?: string[];
  delivery?: boolean;
  takeout?: boolean;
  dineIn?: boolean;
  elevation?: number;
  aqi?: number;
}

interface MarketAnalysisRequest {
  competitors: CompetitorSummary[];
  businessType: string;
  location: string;
  userQuery: string;
}

interface MarketAnalysisResponse {
  analysis: AnalysisCardData;
  insights: string;
}

export async function analyzeMarket(request: MarketAnalysisRequest): Promise<MarketAnalysisResponse> {
  try {
    // Configure Model with System Instruction & JSON Mode
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: MARKET_ANALYSIS_SYSTEM_INSTRUCTION,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    // Build analysis prompt
    const prompt = `Analyze the market for opening a ${request.businessType} business in ${request.location}.

User Query: "${request.userQuery}"

Competitor Data (${request.competitors.length} existing businesses):
${request.competitors.map((c, i) => `
${i + 1}. ${c.name}
   Address: ${c.address}
   Coordinates: ${c.lat}, ${c.lng}
   Rating: ${c.rating ? `${c.rating}⭐` : 'No rating'}
   Reviews: ${c.reviewCount || 0}
   Types: ${c.types?.join(', ') || 'Unknown'}
   Services: ${[
     c.delivery ? 'Delivery' : null,
     c.takeout ? 'Takeout' : null,
     c.dineIn ? 'Dine-in' : null,
   ].filter(Boolean).join(', ') || 'Not specified'}
   ${c.elevation !== undefined ? `Elevation: ${c.elevation}m` : ''}
   ${c.aqi !== undefined ? `Air Quality Index: ${c.aqi}` : ''}
`).join('\n')}

Provide a comprehensive Red/Orange/Green zone analysis with specific street names and strategic recommendations.`;

    // Send request to Gemini
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON response
    const parsed = JSON.parse(responseText) as AnalysisCardData;

    // Generate insights summary
    const insights = `**Market Analysis Complete**

📍 **${parsed.location}** - ${parsed.businessType}

🔴 **Red Zones (Avoid):** ${parsed.redZones.length} saturated areas
🟠 **Orange Zones (Moderate):** ${parsed.orangeZones.length} areas with potential
🟢 **Green Zones (Opportunity):** ${parsed.greenZones.length} high-potential areas

**Strategic Recommendation:**
${parsed.recommendation}`;

    return {
      analysis: parsed,
      insights,
    };
  } catch (error) {
    console.error('Market analysis error:', error);

    // Return fallback analysis
    return {
      analysis: {
        businessType: request.businessType,
        location: request.location,
        redZones: [],
        orangeZones: [],
        greenZones: [],
        recommendation: 'Unable to complete market analysis due to an error. Please try again.',
      },
      insights: 'Market analysis failed. Please try again.',
    };
  }
}
