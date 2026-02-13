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
    { "name": "specific area/street name", "reason": "why it's saturated", "count": number_of_competitors, "lat": centroid_latitude, "lng": centroid_longitude, "radius": radius_in_meters }
  ],
  "orangeZones": [
    { "name": "specific area/street name", "reason": "moderate competition details", "count": number_of_competitors, "lat": centroid_latitude, "lng": centroid_longitude, "radius": radius_in_meters }
  ],
  "greenZones": [
    { "name": "specific area/street name", "reason": "opportunity explanation", "count": number_of_competitors, "lat": estimated_latitude, "lng": estimated_longitude, "radius": radius_in_meters }
  ],
  "recommendation": "strategic recommendation with actionable insights (2-3 sentences)"
}

ZONE COORDINATE REQUIREMENTS (CRITICAL):
Every zone MUST include "lat", "lng", and "radius" fields. These are used to draw circles on the map.

For RED/ORANGE zones (where competitors exist):
- Calculate the centroid (average lat/lng) of all competitors you grouped into that zone.
- Set radius to encompass those competitors (use the max distance from centroid to any competitor × 1.3). Minimum 400m, maximum 1200m.

For GREEN zones (market gaps with 0-1 competitors):
- Estimate the coordinates based on the described location relative to known competitor positions.
- Use geographic reasoning: 1 degree of latitude ≈ 111km, so 1km north ≈ +0.009 latitude.
- Example: If competitors cluster around (3.05, 101.67) and the green zone is "2km north", use lat ≈ 3.068, lng ≈ 101.67.
- Radius: 500-800m for green zones.

Coordinate precision: Use 6 decimal places (e.g., 3.063872). Radius in whole meters (e.g., 650).
Ensure zones do NOT overlap each other significantly — space them apart.

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

Input: 15 gyms in Bukit Jalil, Malaysia (competitors centered around 3.058, 101.680)
Output:
{
  "businessType": "gyms",
  "location": "Bukit Jalil",
  "redZones": [
    { "name": "Pavilion Bukit Jalil vicinity", "reason": "8 established gyms within 500m including Celebrity Fitness and Fitness First (4.2+ ratings, 200+ reviews each)", "count": 8, "lat": 3.063872, "lng": 101.682956, "radius": 600 },
    { "name": "Jalan Jalil Perkasa area", "reason": "4 competing gyms, all with strong online presence and modern facilities", "count": 4, "lat": 3.057234, "lng": 101.678123, "radius": 500 }
  ],
  "orangeZones": [
    { "name": "Bukit Jalil Recreation Park area", "reason": "2 gyms but both have <3.8 ratings and limited class offerings - quality differentiation opportunity", "count": 2, "lat": 3.065123, "lng": 101.675456, "radius": 550 }
  ],
  "greenZones": [
    { "name": "Sri Petaling residential zone", "reason": "No gyms within 2km despite high-density condominiums (Sri Petaling, Endah Regal). Nearest competitor is 2.5km away.", "count": 0, "lat": 3.078500, "lng": 101.681234, "radius": 700 },
    { "name": "Taman Bukit Jalil (east)", "reason": "Only 1 budget gym with 3.2 rating. Premium gym opportunity with classes and personal training.", "count": 1, "lat": 3.061234, "lng": 101.695678, "radius": 650 }
  ],
  "recommendation": "Target the Sri Petaling residential corridor or eastern Taman Bukit Jalil. Both areas have underserved populations >2km from quality gyms. Consider positioning as a premium boutique gym with classes, as existing competitors focus on equipment-only models."
}

Input: 3 cafes in a small town (competitors centered around 5.320, 103.130)
Output:
{
  "businessType": "cafes",
  "location": "Small Town Area",
  "redZones": [],
  "orangeZones": [
    { "name": "Main Street commercial area", "reason": "3 established cafes with 4.0+ ratings, but all close by 6 PM - evening/night cafe opportunity", "count": 3, "lat": 5.320100, "lng": 103.130200, "radius": 500 }
  ],
  "greenZones": [
    { "name": "North residential area near park", "reason": "No cafes within 1.5km. High foot traffic from park visitors on weekends.", "count": 0, "lat": 5.333500, "lng": 103.130000, "radius": 600 },
    { "name": "East side near university", "reason": "No cafes despite student population. Delivery and late-night service gap.", "count": 0, "lat": 5.319800, "lng": 103.143000, "radius": 650 }
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
        // @ts-expect-error - thinkingConfig supported by Gemini 2.5 Flash
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    // Build compact analysis prompt — minimize token count for speed
    const competitorList = request.competitors.map((c, i) => {
      const parts = [`${i + 1}. ${c.name} | ${c.address} | (${c.lat},${c.lng})`];
      if (c.rating) parts.push(`${c.rating}★ ${c.reviewCount || 0}r`);
      const services = [c.delivery && 'D', c.takeout && 'T', c.dineIn && 'DI'].filter(Boolean);
      if (services.length) parts.push(services.join('/'));
      return parts.join(' | ');
    }).join('\n');

    const prompt = `Analyze ${request.businessType} market in ${request.location}. Query: "${request.userQuery}"

${request.competitors.length} competitors:
${competitorList}

Calculate lat/lng/radius for each zone. Centroid for red/orange, geographic gaps for green. Every zone MUST have lat, lng, radius.`;

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
