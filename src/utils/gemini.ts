import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function analyzeMarketGap(reviews: string[]): Promise<{
  analysis: string;
  strategies: string[];
}> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are a business consultant analyzing customer reviews to identify market opportunities in Malaysia.

Analyze these customer complaints and reviews:
${reviews.map((r, i) => `${i + 1}. "${r}"`).join('\n')}

Based on these reviews, provide:
1. A brief analysis (2-3 sentences) of what customers are unhappy about
2. 3-5 specific business strategies to win this market by addressing these pain points

Format your response as JSON:
{
  "analysis": "Your analysis here",
  "strategies": ["Strategy 1", "Strategy 2", "Strategy 3"]
}

Focus on actionable, Malaysia-specific insights. Consider local market conditions and consumer preferences.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback if JSON parsing fails
    return {
      analysis: text,
      strategies: ['Unable to parse strategies. Please try again.'],
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to analyze market gap');
  }
}
