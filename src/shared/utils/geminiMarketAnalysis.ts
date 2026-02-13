import { GoogleGenerativeAI } from "@google/generative-ai";
import { AnalysisCardData } from "@/shared/types/chat";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
  "targetAudienceAnalysis": {
    "primaryAudience": "description of the ideal customer — tailor age/income to the ACTUAL business type, not default to young professionals",
    "incomeLevel": "low" | "middle" | "upper-middle" | "high",
    "ageRange": "must reflect the REAL target age for this business (e.g. 5-12 for toy stores, 13-19 for bubble tea, 30-55 for fine dining, 0-6 for daycare, 60+ for retirement services)",
    "keyTraits": ["trait1", "trait2", "trait3"],
    "idealAreaTraits": ["near offices", "high foot traffic", "upscale residential"],
    "avoidAreaTraits": ["industrial zones", "low-income housing", "school zones"]
  },
  "redZones": [
    { "name": "specific area/street name", "reason": "why it's saturated", "count": number_of_competitors, "lat": centroid_latitude, "lng": centroid_longitude, "radius": radius_in_meters, "audienceFit": "good|moderate|poor", "audienceNote": "brief note on demographic suitability" }
  ],
  "orangeZones": [
    { "name": "specific area/street name", "reason": "moderate competition details", "count": number_of_competitors, "lat": centroid_latitude, "lng": centroid_longitude, "radius": radius_in_meters, "audienceFit": "good|moderate|poor", "audienceNote": "brief note on demographic suitability" }
  ],
  "greenZones": [
    { "name": "specific area/street name", "reason": "opportunity explanation", "count": number_of_competitors, "lat": estimated_latitude, "lng": estimated_longitude, "radius": radius_in_meters, "audienceFit": "good|moderate|poor", "audienceNote": "brief note on demographic suitability" }
  ],
  "recommendation": "strategic recommendation with actionable insights including target audience considerations (2-3 sentences)"
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

TARGET AUDIENCE ANALYSIS (CRITICAL):
Before analyzing zones, first determine the TARGET AUDIENCE for this business type. Consider:

1. **Demographics**: Who is the ideal customer? Age range, income level, lifestyle.
   - DO NOT default to "young professionals aged 25-35" for every business. The age range MUST match the actual business type.
   - Age range examples by business type:
     * Playgrounds, toy stores, children's education centers → 3-12 (children) / 25-40 (parents who decide)
     * Bubble tea, boba shops, arcade/gaming cafes → 13-25
     * Nightclubs, bars, hookah lounges → 21-35
     * Fine dining, wine bars, luxury spas → 30-55
     * Daycare, nurseries → 0-5 (children) / 25-40 (parents)
     * Retirement homes, elderly care → 60+
     * Tutoring centers, cram schools → 10-18 (students) / 30-50 (parents)
     * Skateparks, youth sports → 8-22
     * Fast food, budget restaurants → all ages (6-60+)
     * Gyms, fitness studios → 18-45
     * Coworking spaces → 22-40
     * Pet stores, grooming → 25-55 (pet owners)
     * Pharmacies, clinics → all ages
   - When in doubt, think about who ACTUALLY walks into this type of business and pays.
2. **Area-Audience Fit**: For each zone, assess whether the local demographics match the target audience:
   - "good": Area demographics strongly match the target audience (e.g., upscale residential for premium restaurants)
   - "moderate": Partial match, could work with adjustments (e.g., mixed-income area for mid-range cafe)
   - "poor": Demographics mismatch (e.g., industrial zone for a children's playground, low-income area for luxury spa)

3. **Audience-Mismatch Examples**:
   - Luxury bars/fine dining → poor fit in low-income residential areas or industrial zones
   - Children's playgrounds/toy stores → poor fit in corporate/office districts or nightlife areas; good fit near family housing and schools
   - Budget eateries/food stalls → poor fit in exclusive gated communities
   - Gyms/fitness studios → good fit near offices or young professional housing, poor fit near retirement homes
   - Nightclubs/bars → poor fit near schools, mosques/temples, family residential areas
   - Coworking spaces → good fit near universities and startup hubs, poor fit in suburban family neighborhoods
   - Pet stores/grooming → good fit in pet-friendly residential areas, poor fit in dense commercial zones
   - Organic/health food stores → good fit in upper-middle-class neighborhoods, poor fit in budget-conscious areas
   - Bubble tea/boba shops → good fit near schools, universities, teen hangout areas; poor fit in elderly neighborhoods
   - Daycare/nurseries → good fit in young family suburbs; poor fit in nightlife districts or industrial zones
   - Skateparks/youth recreation → good fit in suburban areas with teens; poor fit in corporate business districts
   - Elderly care/retirement services → good fit in mature residential neighborhoods; poor fit near universities

4. **Green Zone Audience Validation**: A green zone with low competition but POOR audience fit should be flagged — low competition might exist because there's no demand from the local population.

5. Include "audienceFit" and "audienceNote" for EVERY zone (red, orange, green).

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
  "targetAudienceAnalysis": {
    "primaryAudience": "Health-conscious young professionals and fitness enthusiasts aged 20-40",
    "incomeLevel": "middle",
    "ageRange": "20-40",
    "keyTraits": ["health-conscious", "active lifestyle", "willing to pay for convenience", "social media active"],
    "idealAreaTraits": ["near offices or condominiums", "young professional housing", "good public transport access", "high foot traffic"],
    "avoidAreaTraits": ["elderly-dominated residential areas", "industrial zones", "areas far from public transport"]
  },
  "redZones": [
    { "name": "Pavilion Bukit Jalil vicinity", "reason": "8 established gyms within 500m including Celebrity Fitness and Fitness First (4.2+ ratings, 200+ reviews each)", "count": 8, "lat": 3.063872, "lng": 101.682956, "radius": 600, "audienceFit": "good", "audienceNote": "Mall area attracts young professionals — high gym demand but oversaturated" },
    { "name": "Jalan Jalil Perkasa area", "reason": "4 competing gyms, all with strong online presence and modern facilities", "count": 4, "lat": 3.057234, "lng": 101.678123, "radius": 500, "audienceFit": "good", "audienceNote": "Mixed residential with young families and professionals" }
  ],
  "orangeZones": [
    { "name": "Bukit Jalil Recreation Park area", "reason": "2 gyms but both have <3.8 ratings and limited class offerings - quality differentiation opportunity", "count": 2, "lat": 3.065123, "lng": 101.675456, "radius": 550, "audienceFit": "moderate", "audienceNote": "Park visitors are fitness-oriented but area skews toward older residents" }
  ],
  "greenZones": [
    { "name": "Sri Petaling residential zone", "reason": "No gyms within 2km despite high-density condominiums (Sri Petaling, Endah Regal). Nearest competitor is 2.5km away.", "count": 0, "lat": 3.078500, "lng": 101.681234, "radius": 700, "audienceFit": "good", "audienceNote": "Dense condos with young renters and professionals — strong target audience match" },
    { "name": "Taman Bukit Jalil (east)", "reason": "Only 1 budget gym with 3.2 rating. Premium gym opportunity with classes and personal training.", "count": 1, "lat": 3.061234, "lng": 101.695678, "radius": 650, "audienceFit": "moderate", "audienceNote": "Mostly family housing — moderate demand for premium fitness" }
  ],
  "recommendation": "Target the Sri Petaling residential corridor where young condo residents match the gym's target audience perfectly. Eastern Taman Bukit Jalil is viable but skews family-oriented, so consider family-friendly fitness classes to match the local demographics."
}

Input: 3 cafes in a small town (competitors centered around 5.320, 103.130)
Output:
{
  "businessType": "cafes",
  "location": "Small Town Area",
  "targetAudienceAnalysis": {
    "primaryAudience": "Students, remote workers, and casual socializers aged 18-35",
    "incomeLevel": "low",
    "ageRange": "18-35",
    "keyTraits": ["budget-conscious", "social", "need WiFi and workspace", "value ambiance"],
    "idealAreaTraits": ["near university or college", "walkable neighborhoods", "areas with young renters"],
    "avoidAreaTraits": ["luxury residential enclaves", "industrial parks", "highway-adjacent locations"]
  },
  "redZones": [],
  "orangeZones": [
    { "name": "Main Street commercial area", "reason": "3 established cafes with 4.0+ ratings, but all close by 6 PM - evening/night cafe opportunity", "count": 3, "lat": 5.320100, "lng": 103.130200, "radius": 500, "audienceFit": "moderate", "audienceNote": "Commercial foot traffic during day but limited evening crowd" }
  ],
  "greenZones": [
    { "name": "North residential area near park", "reason": "No cafes within 1.5km. High foot traffic from park visitors on weekends.", "count": 0, "lat": 5.333500, "lng": 103.130000, "radius": 600, "audienceFit": "moderate", "audienceNote": "Family-oriented park area — weekend traffic but may not sustain weekday sales" },
    { "name": "East side near university", "reason": "No cafes despite student population. Delivery and late-night service gap.", "count": 0, "lat": 5.319800, "lng": 103.143000, "radius": 650, "audienceFit": "good", "audienceNote": "Student population perfectly matches cafe target audience — high demand for affordable hangout spots" }
  ],
  "recommendation": "Open near the university on the east side where the student demographic is an ideal match for a cafe. Offer extended hours (7 AM - 11 PM), WiFi, and delivery to capture the underserved student market that existing cafes ignore."
}

Input: 5 indoor playgrounds in Subang Jaya, Malaysia (competitors centered around 3.05, 101.58)
Output:
{
  "businessType": "indoor playgrounds",
  "location": "Subang Jaya",
  "targetAudienceAnalysis": {
    "primaryAudience": "Families with young children aged 2-10, driven by parents aged 28-42",
    "incomeLevel": "middle",
    "ageRange": "2-10",
    "keyTraits": ["family-oriented", "safety-conscious parents", "looking for weekend activities", "willing to pay for child entertainment"],
    "idealAreaTraits": ["near family housing and condos", "close to schools and kindergartens", "shopping malls with family traffic", "safe residential suburbs"],
    "avoidAreaTraits": ["nightlife districts", "industrial zones", "office-only commercial areas", "areas dominated by elderly residents"]
  },
  "redZones": [
    { "name": "Sunway Pyramid area", "reason": "3 indoor playgrounds within 800m including established brands with 4.5+ ratings", "count": 3, "lat": 3.073200, "lng": 101.607300, "radius": 500, "audienceFit": "good", "audienceNote": "High family foot traffic from mall visitors but already saturated with play centers" }
  ],
  "orangeZones": [
    { "name": "SS15 commercial district", "reason": "2 small play areas but both lack modern equipment — quality upgrade opportunity", "count": 2, "lat": 3.078100, "lng": 101.587600, "radius": 450, "audienceFit": "moderate", "audienceNote": "Mix of student rentals and young families — moderate child density" }
  ],
  "greenZones": [
    { "name": "USJ 1-6 residential zone", "reason": "No indoor playgrounds despite being a dense family suburb with multiple kindergartens.", "count": 0, "lat": 3.044500, "lng": 101.575800, "radius": 700, "audienceFit": "good", "audienceNote": "Dense terrace housing with young families — ideal demographic for children's entertainment" }
  ],
  "recommendation": "Target USJ 1-6 residential area where young families with children perfectly match the playground's audience. The area has kindergartens and family housing but zero indoor play options within 2km."
}

IMPORTANT NOTES:
- ALWAYS use specific place names, street names, and landmarks from the competitor data
- ALWAYS include "count" for each zone
- ALWAYS include "audienceFit" and "audienceNote" for each zone
- ALWAYS include "targetAudienceAnalysis" with all fields populated
- If there are fewer than 3 competitors total, focus analysis on growth opportunity rather than competition
- If elevation data shows <10m, mention flood risk in the recommendation
- If AQI >100 for outdoor/health businesses, mention air quality concerns
- Keep recommendation concise (2-3 sentences) but actionable and include target audience considerations
- Flag green zones where low competition may be due to demographic mismatch rather than true opportunity
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

export async function analyzeMarket(
    request: MarketAnalysisRequest
): Promise<MarketAnalysisResponse> {
    try {
        // Configure Model with System Instruction & JSON Mode
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: MARKET_ANALYSIS_SYSTEM_INSTRUCTION,
            generationConfig: {
                responseMimeType: "application/json",
                // @ts-expect-error - thinkingConfig supported by Gemini 2.5 Flash
                thinkingConfig: { thinkingBudget: 0 },
            },
        });

        // Build compact analysis prompt — minimize token count for speed
        const competitorList = request.competitors
            .map((c, i) => {
                const parts = [
                    `${i + 1}. ${c.name} | ${c.address} | (${c.lat},${c.lng})`,
                ];
                if (c.rating) parts.push(`${c.rating}★ ${c.reviewCount || 0}r`);
                const services = [
                    c.delivery && "D",
                    c.takeout && "T",
                    c.dineIn && "DI",
                ].filter(Boolean);
                if (services.length) parts.push(services.join("/"));
                return parts.join(" | ");
            })
            .join("\n");

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
        const audienceSection = parsed.targetAudienceAnalysis
            ? `\n🎯 **Target Audience:** ${parsed.targetAudienceAnalysis.primaryAudience} (${parsed.targetAudienceAnalysis.incomeLevel} income, age ${parsed.targetAudienceAnalysis.ageRange})\n`
            : "";

        const insights = `**Market Analysis Complete**

📍 **${parsed.location}** - ${parsed.businessType}
${audienceSection}
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
        console.error("Market analysis error:", error);

        // Return fallback analysis
        return {
            analysis: {
                businessType: request.businessType,
                location: request.location,
                redZones: [],
                orangeZones: [],
                greenZones: [],
                recommendation:
                    "Unable to complete market analysis due to an error. Please try again.",
            },
            insights: "Market analysis failed. Please try again.",
        };
    }
}
