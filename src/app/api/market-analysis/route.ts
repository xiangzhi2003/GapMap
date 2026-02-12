import { NextRequest, NextResponse } from 'next/server';
import { analyzeMarket } from '@/shared/utils/geminiMarketAnalysis';
import { AnalysisCardData } from '@/shared/types/chat';

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

interface MarketAnalysisApiRequest {
  competitors: CompetitorSummary[];
  businessType: string;
  location: string;
  userQuery: string;
}

interface MarketAnalysisApiResponse {
  analysis: AnalysisCardData;
  insights: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<MarketAnalysisApiResponse | { error: string }>> {
  try {
    const body: MarketAnalysisApiRequest = await request.json();
    const { competitors, businessType, location, userQuery } = body;

    // Validate request
    if (!competitors || !Array.isArray(competitors)) {
      return NextResponse.json(
        { error: 'Competitors array is required' },
        { status: 400 }
      );
    }

    if (!businessType || typeof businessType !== 'string') {
      return NextResponse.json(
        { error: 'Business type is required' },
        { status: 400 }
      );
    }

    if (!location || typeof location !== 'string') {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      );
    }

    // Limit competitors to top 20 by rating to control costs
    const limitedCompetitors = competitors
      .sort((a, b) => {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingB - ratingA;
      })
      .slice(0, 20);

    // Call market analysis
    const result = await analyzeMarket({
      competitors: limitedCompetitors,
      businessType,
      location,
      userQuery: userQuery || `Analyze market for ${businessType} in ${location}`,
    });

    return NextResponse.json({
      analysis: result.analysis,
      insights: result.insights,
    });
  } catch (error) {
    console.error('Market analysis API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to analyze market';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
