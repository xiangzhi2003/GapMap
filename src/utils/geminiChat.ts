import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatMessage, MapAction, ChatContext } from '@/types/chat';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `You are GapMap Intelligence, an AI assistant specialized in location strategy for businesses, powered by Google Gemini.

PRIMARY ROLE: Help entrepreneurs find the best locations to open their businesses by analyzing competitor density and identifying market gaps.

DUAL CAPABILITIES:
1. **Business Location Strategy** (Your Primary Focus):
   - Analyze market saturation and competitor density
   - Identify RED ZONES (oversaturated), ORANGE ZONES (competitive), GREEN ZONES (opportunity)
   - Provide actionable location recommendations with data-driven reasoning
   - Use real place names and realistic competitor estimates

2. **General Assistant** (Secondary Mode):
   - You can answer general questions politely and helpfully
   - For off-topic queries, provide a brief, friendly response
   - Then naturally guide the conversation back to business strategy
   - Example: "That's an interesting question! [brief answer]. By the way, have you thought about your business location strategy?"

INTERACTION STYLE:
- Professional yet conversational and encouraging
- Use specific real location names whenever possible
- Be data-driven in your reasoning, not vague
- If a question is completely unrelated to business/maps, acknowledge it kindly but redirect naturally

CATEGORY INTELLIGENCE:
When users ask broad queries like "restaurants in [area]" or "businesses in [area]",
suggest multiple related categories:
- "restaurants" → also: cafe, bar, bakery, fast_food
- "shopping" → also: clothing_store, shoe_store, electronics_store
- "services" → also: hair_care, spa, gym

Use the multiSearch action to search multiple categories at once.

Tone: Professional, insightful, and encouraging. Use specific real location names. Be data-driven in your reasoning.

CRITICAL RULE FOR BUSINESS ANALYSIS:
When the user asks about opening a business, market analysis, or competitor density,
you MUST output ALL THREE actions together: heatmap, greenZone, and analysisCard.
Each action in its own JSON code block.

For general map questions (directions, finding places, geography), use the standard map actions as before.

Available actions:

1. Search for places:
\`\`\`json
{"action": "search", "query": "coffee shops", "location": "Tokyo"}
\`\`\`

1b. Multi-category search (for showing different business types):
\`\`\`json
{"action": "multiSearch", "query": "food", "location": "Kuala Lumpur", "types": ["restaurant", "cafe", "bar", "bakery"]}
\`\`\`

2. Get directions:
\`\`\`json
{"action": "directions", "origin": "KLCC", "destination": "Pavilion KL", "travelMode": "DRIVING"}
\`\`\`
Travel modes: DRIVING, WALKING, BICYCLING, TRANSIT

3. Add a marker:
\`\`\`json
{"action": "marker", "lat": 3.1579, "lng": 101.7116, "title": "Petronas Towers"}
\`\`\`

4. Zoom to a level (1-20):
\`\`\`json
{"action": "zoom", "level": 15}
\`\`\`

5. Center on a location:
\`\`\`json
{"action": "center", "lat": 35.6762, "lng": 139.6503}
\`\`\`

6. Show competitor heatmap (use realistic coordinates for the region):
\`\`\`json
{"action": "heatmap", "points": [{"lat": 3.07, "lng": 101.58, "weight": 12, "label": "Subang Jaya"}, {"lat": 3.10, "lng": 101.67, "weight": 8, "label": "Petaling Jaya"}, {"lat": 2.93, "lng": 101.78, "weight": 1, "label": "Semenyih"}]}
\`\`\`

7. Drop a green zone recommendation pin:
\`\`\`json
{"action": "greenZone", "lat": 2.93, "lng": 101.78, "title": "Semenyih", "reason": "Zero competitors, growing residential population with high foot traffic potential"}
\`\`\`

8. Show full market analysis card:
\`\`\`json
{"action": "analysisCard", "businessType": "Pet Cafe", "location": "Selangor", "redZones": [{"name": "Subang Jaya", "reason": "12 existing pet cafes, fully saturated market", "count": 12}], "orangeZones": [{"name": "Petaling Jaya", "reason": "5 competitors but growing demand, needs strong USP", "count": 5}], "greenZones": [{"name": "Semenyih", "reason": "Zero competitors, growing residential population", "count": 0}], "recommendation": "Open in Semenyih. First-mover advantage in an underserved area with a rapidly growing residential population. Capture the entire local pet owner market before competitors move in."}
\`\`\`

CRITICAL RULES:
- When the user asks about opening a business or wants market/competitor analysis, ALWAYS output heatmap + greenZone + analysisCard actions together. Use realistic coordinates for the mentioned region.
- Use real place names and plausible competitor counts based on the area.
- For heatmap points, include at least 4-6 points covering the region with varying weights to show density differences.
- The greenZone pin must be placed at a location that genuinely has low competition potential.
- For general map questions, use only the standard actions (search, directions, marker, zoom, center).
- Always wrap each action in its own \`\`\`json code block.
- Keep your conversational text concise and insightful.
- For off-topic questions: brief friendly answer + natural redirect to business topics.
- Never refuse to answer reasonable questions - just answer briefly and redirect.`;

function convertHistoryToGemini(history: ChatMessage[]): Array<{ role: string; parts: Array<{ text: string }> }> {
  return history.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));
}

function extractMapActions(text: string): MapAction[] {
  const actions: MapAction[] = [];

  // Look for JSON code blocks
  const jsonBlockRegex = /```json\s*\n?\s*(\{[\s\S]*?\})\s*\n?\s*```/g;
  const matches = [...text.matchAll(jsonBlockRegex)];

  if (matches.length > 0) {
    for (const match of matches) {
      try {
        const parsed = JSON.parse(match[1]);
        const action = parseActionObject(parsed);
        if (action) actions.push(action);
      } catch {
        // skip unparseable blocks
      }
    }
  }

  if (actions.length === 0) {
    // Fallback: try to find raw JSON that looks like an action
    const rawJsonRegex = /\{"action"\s*:\s*"(search|directions|marker|zoom|center|heatmap|greenZone|analysisCard|multiSearch)"[\s\S]*?\}/g;
    const rawMatches = [...text.matchAll(rawJsonRegex)];
    for (const match of rawMatches) {
      try {
        const parsed = JSON.parse(match[0]);
        const action = parseActionObject(parsed);
        if (action) actions.push(action);
      } catch {
        // skip
      }
    }
  }

  return actions;
}

function parseActionObject(obj: Record<string, unknown>): MapAction | undefined {
  const action = obj.action as string;

  switch (action) {
    case 'search':
      return {
        type: 'search',
        data: {
          query: obj.query as string,
          location: obj.location as string | undefined,
        },
      };
    case 'directions':
      return {
        type: 'directions',
        data: {
          origin: obj.origin as string,
          destination: obj.destination as string,
          travelMode: (obj.travelMode as 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT') || 'DRIVING',
        },
      };
    case 'marker':
      return {
        type: 'marker',
        data: {
          lat: obj.lat as number,
          lng: obj.lng as number,
          title: obj.title as string | undefined,
        },
      };
    case 'zoom':
      return {
        type: 'zoom',
        data: {
          level: obj.level as number,
        },
      };
    case 'center':
      return {
        type: 'center',
        data: {
          lat: obj.lat as number,
          lng: obj.lng as number,
        },
      };
    case 'heatmap':
      return {
        type: 'heatmap',
        data: {
          points: (obj.points as Array<{ lat: number; lng: number; weight: number; label?: string }>),
        },
      };
    case 'greenZone':
      return {
        type: 'greenZone',
        data: {
          lat: obj.lat as number,
          lng: obj.lng as number,
          title: obj.title as string,
          reason: obj.reason as string,
        },
      };
    case 'analysisCard':
      return {
        type: 'analysisCard',
        data: {
          businessType: obj.businessType as string,
          location: obj.location as string,
          redZones: (obj.redZones as Array<{ name: string; reason: string; count?: number }>),
          orangeZones: (obj.orangeZones as Array<{ name: string; reason: string; count?: number }>),
          greenZones: (obj.greenZones as Array<{ name: string; reason: string; count?: number }>),
          recommendation: obj.recommendation as string,
        },
      };
    case 'multiSearch':
      return {
        type: 'multiSearch',
        data: {
          query: obj.query as string,
          location: obj.location as string | undefined,
          types: obj.types as string[],
        },
      };
    default:
      return undefined;
  }
}

function cleanResponseText(text: string): string {
  // Remove JSON code blocks from the visible response
  let cleaned = text;

  // Remove all ```json...``` blocks (handles multiple blocks and various whitespace)
  cleaned = cleaned.replace(/```json[\s\S]*?```/g, '');

  // Remove any remaining raw JSON action objects
  cleaned = cleaned.replace(/\{"action"\s*:\s*"[^"]+"\s*,[\s\S]*?\}/g, '');

  // Remove extra blank lines and trim
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}

export async function chat(
  message: string,
  history: ChatMessage[],
  mapContext?: ChatContext
): Promise<{ reply: string; mapAction?: MapAction; mapActions?: MapAction[] }> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    },
  });

  // Build context message
  let contextInfo = '';
  if (mapContext) {
    if (mapContext.center) {
      contextInfo += `\nUser's current map view is centered at: ${mapContext.center.lat.toFixed(4)}, ${mapContext.center.lng.toFixed(4)}`;
    }
    if (mapContext.zoom) {
      contextInfo += `\nCurrent zoom level: ${mapContext.zoom}`;
    }
    if (mapContext.lastSearchQuery) {
      contextInfo += `\nLast search: "${mapContext.lastSearchQuery}"`;
    }
  }

  const fullSystemPrompt = SYSTEM_PROMPT + contextInfo;

  try {
    const chatSession = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'Please follow these instructions for our conversation: ' + fullSystemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: 'Understood! I\'m GapMap Intelligence, your location strategy consultant. I can help you find market gaps, analyze competitor density, and identify the best locations to open your business. I can also help with general map navigation. How can I assist you today?' }],
        },
        ...convertHistoryToGemini(history),
      ],
    });

    const result = await chatSession.sendMessage(message);
    const response = result.response;
    const text = response.text();

    // Extract all map actions from the response
    const mapActions = extractMapActions(text);

    // Clean the response text (remove JSON blocks)
    const cleanedReply = cleanResponseText(text);

    // If the entire response was just JSON blocks (no text), provide a friendly default
    const finalReply = cleanedReply || (mapActions.length > 0 ? '✓ Executing action...' : text);

    return {
      reply: finalReply,
      mapAction: mapActions[0],
      mapActions: mapActions.length > 0 ? mapActions : undefined,
    };
  } catch (error) {
    console.error('Gemini Chat API error:', error);
    const message = error instanceof Error ? error.message : String(error);

    // Enhanced error messages with helpful context
    if (message.includes('429') || message.includes('Too Many Requests')) {
      throw new Error('Rate limit reached. Our AI is very popular right now! Please wait 30 seconds and try again.');
    }
    if (message.includes('404') || message.includes('not found')) {
      throw new Error('AI model temporarily unavailable. Google is updating the service. Try again in a moment.');
    }
    if (message.includes('400') || message.includes('Bad Request')) {
      throw new Error('Your question couldn\'t be processed. Try rephrasing or ask something like "Analyze coffee shops in Kuala Lumpur".');
    }
    if (message.includes('SAFETY') || message.includes('blocked')) {
      throw new Error('Your message was blocked by safety filters. Please rephrase your business query and try again.');
    }

    // Generic fallback with helpful suggestion
    throw new Error('Failed to get AI response. Check your internet connection or try a simpler query like "Show restaurants in [your city]".');
  }
}
