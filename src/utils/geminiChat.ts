import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatMessage, ChatContext } from '@/types/chat';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `You are GapMap Intelligence, an AI assistant specialized in location strategy for businesses.

You must respond with ONLY valid JSON in this exact format:
{
  "intent": "search" | "chat",
  "query": "full search query here" | null,
  "reply": "conversational text to show user"
}

RULES:
- intent: Use "search" if user wants to find/search places. Use "chat" for everything else (greetings, thanks, questions, etc.)
- query: Full search query for Google Places API (e.g., "gyms in Puchong"). Set to null if intent is "chat".
- reply: Conversational message to display in chat UI

INTENT CLASSIFICATION:
- "search": "Find gyms", "Show me restaurants in KL", "Where can I open a coffee shop in Tokyo", "Search for pet cafes"
- "chat": "Thanks", "Hello", "What do you think?", "Tell me about your features", "You're welcome"

OUTPUT ONLY THIS JSON FORMAT. NO OTHER TEXT.`;

function cleanHistoryForGemini(history: ChatMessage[]): Array<{ role: 'user' | 'model'; content: string }> {
  return history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    content: msg.content
  }));
}

export async function chat(
  userMessage: string,
  history: ChatMessage[] = [],
  mapContext?: ChatContext
): Promise<{ intent: 'search' | 'chat'; query: string | null; reply: string }> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' });

    // Clean history - only role and content
    const cleanedHistory = cleanHistoryForGemini(history);

    // Build context message
    let contextMessage = userMessage;
    if (mapContext?.center && mapContext?.zoom) {
      contextMessage += `\n\n[Map Context: Center at ${mapContext.center.lat},${mapContext.center.lng}, Zoom ${mapContext.zoom}]`;
    }

    const chatSession = model.startChat({
      history: [
        { role: 'user', parts: [{ text: `Please follow these instructions:\n\n${SYSTEM_PROMPT}` }] },
        { role: 'model', parts: [{ text: 'Understood! I will respond with only valid JSON in the format { intent, query, reply }.' }] },
        ...cleanedHistory.map(msg => ({ role: msg.role, parts: [{ text: msg.content }] }))
      ]
    });

    const result = await chatSession.sendMessage(contextMessage);
    const responseText = result.response.text().trim();

    // Parse strict JSON
    const parsed = JSON.parse(responseText);

    return {
      intent: parsed.intent,
      query: parsed.query,
      reply: parsed.reply
    };
  } catch (error) {
    console.error('Gemini chat error:', error);
    return {
      intent: 'chat',
      query: null,
      reply: 'I apologize, but I encountered an error processing your request. Please try again.'
    };
  }
}
