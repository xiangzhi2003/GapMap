'use client';

import { useState } from 'react';
import { AnalysisCardData, PlaceResult } from '@/shared/types/chat';

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

interface MarketAnalysisResult {
  analysis: AnalysisCardData;
  insights: string;
}

interface UseMarketAnalysisResult {
  isAnalyzing: boolean;
  error: string | null;
  analyzeMarket: (
    competitors: PlaceResult[],
    businessType: string,
    location: string,
    userQuery?: string
  ) => Promise<MarketAnalysisResult | null>;
}

export function useMarketAnalysis(): UseMarketAnalysisResult {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeMarket = async (
    competitors: PlaceResult[],
    businessType: string,
    location: string,
    userQuery?: string
  ): Promise<MarketAnalysisResult | null> => {
    if (competitors.length === 0) {
      setError('No competitors found to analyze');
      return null;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Serialize PlaceResult[] to CompetitorSummary[]
      const competitorSummaries: CompetitorSummary[] = competitors.map((place) => ({
        name: place.name,
        address: place.address,
        lat: place.location.lat,
        lng: place.location.lng,
        rating: place.rating,
        reviewCount: place.userRatingsTotal,
        types: place.types,
        delivery: place.delivery,
        takeout: place.takeout,
        dineIn: place.dineIn,
        elevation: place.elevation,
        aqi: place.airQualityIndex,
      }));

      // Call the market analysis API
      const response = await fetch('/api/market-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          competitors: competitorSummaries,
          businessType,
          location,
          userQuery: userQuery || `Analyze market for ${businessType} in ${location}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze market');
      }

      const data: MarketAnalysisResult = await response.json();

      setIsAnalyzing(false);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsAnalyzing(false);
      console.error('Market analysis error:', err);
      return null;
    }
  };

  return {
    isAnalyzing,
    error,
    analyzeMarket,
  };
}
