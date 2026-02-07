import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatMessage, ChatContext } from '@/types/chat';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_INSTRUCTION = `You are GapMap Intelligence, an AI location strategy expert.
Your goal is to control a map interface by outputting structured commands.

INPUT CONTEXT:
The user will ask questions about locations, businesses, or just chat.

OUTPUT FORMAT:
You must respond with a JSON object using this schema:
{
  "intent": "search" | "chat",
  "query": "refined search query for Google Maps" | null,
  "reply": "conversational response to the user"
}

RULES:
- If user wants to find/see/locate something -> intent="search", query="precise location query".
- If user is chatting/thanking -> intent="chat", query=null.

EXAMPLES:
- User: "Find gyms in Puchong" -> {"intent": "search", "query": "gyms in Puchong", "reply": "Searching for gyms in Puchong..."}
- User: "Thanks!" -> {"intent": "chat", "query": null, "reply": "You're welcome! Let me know if you need help finding anything else."}
`;

export async function chat(
  userMessage: string,
  history: ChatMessage[] = [],
  mapContext?: ChatContext
): Promise<{ intent: 'search' | 'chat'; query: string | null; reply: string }> {
  try {
    // Configure Model with System Instruction & JSON Mode
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION, // Official way to set system instructions
      generationConfig: {
        responseMimeType: 'application/json', // Forces valid JSON output
      },
    });

    // Build context message with map location if available
    let contextMessage = userMessage;
    if (mapContext?.center && mapContext?.zoom) {
      contextMessage += `\n\n[Map Context: Center at ${mapContext.center.lat},${mapContext.center.lng}, Zoom ${mapContext.zoom}]`;
    }

    // Start chat with cleaned history
    const chatSession = model.startChat({
      history: history.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
    });

    // Send message and get response
    const result = await chatSession.sendMessage(contextMessage);
    const responseText = result.response.text();

    // Parse and return JSON
    const parsed = JSON.parse(responseText);

    return {
      intent: parsed.intent,
      query: parsed.query,
      reply: parsed.reply,
    };
  } catch (error) {
    console.error('Gemini chat error:', error);
    return {
      intent: 'chat',
      query: null,
      reply: 'I apologize, but I encountered an error processing your request. Please try again.',
    };
  }
}
