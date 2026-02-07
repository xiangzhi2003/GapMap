import { NextRequest, NextResponse } from 'next/server';
import { chat } from '@/utils/geminiChat';
import { ChatApiRequest, ChatApiResponse } from '@/types/chat';

export async function POST(request: NextRequest): Promise<NextResponse<ChatApiResponse | { error: string }>> {
  try {
    const body: ChatApiRequest = await request.json();
    const { message, history, mapContext } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const result = await chat(message, history || [], mapContext);

    return NextResponse.json({
      intent: result.intent,
      query: result.query,
      reply: result.reply
    });
  } catch (error) {
    console.error('Chat API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process chat request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
