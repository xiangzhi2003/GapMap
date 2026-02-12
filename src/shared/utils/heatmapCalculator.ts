import type { PlaceResult } from '../types/chat';
import type { WeightedPoint, HeatmapMode, HeatmapZoneAnalysis } from '../types/heatmap';

/**
 * Calculate competition density weights (higher = more competition)
 * Used for "Competition Density" heatmap mode
 */
export function calculateCompetitionWeights(places: PlaceResult[]): WeightedPoint[] {
  const rawWeights = places.map(place => {
    const rating = place.rating || 3;
    const reviews = place.userRatingsTotal || 1;
    return rating * reviews;  // Stronger competitor = higher weight
  });

  // Normalize to 0-100 scale
  return normalizeWeights(places, rawWeights);
}

/**
 * Calculate opportunity weights (higher = better opportunity)
 * Used for "Opportunity" heatmap mode (PRIMARY FEATURE)
 */
export function calculateOpportunityWeights(places: PlaceResult[]): WeightedPoint[] {
  const rawWeights = places.map(place => {
    const rating = place.rating || 3;
    const reviews = place.userRatingsTotal || 1;
    const competitionStrength = rating * reviews;
    return 1 / (competitionStrength + 1);  // Inverse = gaps are valuable
  });

  return normalizeWeights(places, rawWeights);
}

/**
 * Calculate environment risk weights (elevation + AQI)
 * Used for "Environment Risk" heatmap mode
 */
export function calculateEnvironmentWeights(places: PlaceResult[]): WeightedPoint[] {
  const rawWeights = places.map(place => {
    let risk = 0;

    // Flood risk: Low elevation = high risk
    if (place.elevation !== undefined) {
      risk += place.elevation < 10 ? 50 : 0;
    }

    // Air quality risk: High AQI = high risk
    if (place.airQualityIndex !== undefined) {
      risk += place.airQualityIndex > 100 ? 50 : 0;
    }

    return risk;
  });

  return normalizeWeights(places, rawWeights);
}

/**
 * Normalize weights to 0-100 scale
 */
function normalizeWeights(places: PlaceResult[], rawWeights: number[]): WeightedPoint[] {
  const maxWeight = Math.max(...rawWeights);
  const minWeight = Math.min(...rawWeights);
  const range = maxWeight - minWeight || 1;

  return places.map((place, i) => ({
    location: new google.maps.LatLng(place.location.lat, place.location.lng),
    weight: ((rawWeights[i] - minWeight) / range) * 100
  }));
}

/**
 * Get adaptive radius based on zoom level
 */
export function getZoomBasedRadius(zoom: number): number {
  if (zoom >= 15) return 20;  // Street level - tight radius
  if (zoom >= 12) return 30;  // District level - medium radius
  return 40;                  // City level - broad radius
}

/**
 * Analyze heatmap zone when user clicks
 */
export function analyzeHeatmapZone(
  clickLatLng: google.maps.LatLng,
  places: PlaceResult[],
  mode: HeatmapMode
): HeatmapZoneAnalysis {
  // Calculate distances from click point
  const distances = places.map(place => ({
    place,
    distance: google.maps.geometry.spherical.computeDistanceBetween(
      clickLatLng,
      new google.maps.LatLng(place.location.lat, place.location.lng)
    )
  }));

  // Sort by distance, get nearest 5
  distances.sort((a, b) => a.distance - b.distance);
  const nearest = distances.slice(0, 5);

  // Calculate competition score in 500m radius
  const nearby = distances.filter(d => d.distance < 500);
  const competitionScore = Math.min((nearby.length / 10) * 100, 100);

  let level: 'low' | 'medium' | 'high';
  if (competitionScore < 30) level = 'low';
  else if (competitionScore < 70) level = 'medium';
  else level = 'high';

  // Generate recommendation based on mode
  let recommendation = '';
  if (mode === 'opportunity') {
    if (level === 'low') {
      recommendation = '🟢 High opportunity zone! Limited competition nearby. Strong potential for market entry.';
    } else if (level === 'medium') {
      recommendation = '🟡 Moderate opportunity. Focus on differentiation and unique value proposition.';
    } else {
      recommendation = '🔴 Saturated area. Requires strong competitive advantage to succeed.';
    }
  } else if (mode === 'competition') {
    if (level === 'high') {
      recommendation = '🔴 High competition density. Multiple established competitors in close proximity.';
    } else if (level === 'medium') {
      recommendation = '🟡 Moderate competition. Room for differentiation.';
    } else {
      recommendation = '🟢 Low competition density. Fewer competitors in the area.';
    }
  }

  return {
    location: clickLatLng,
    competitionLevel: level,
    competitionScore,
    nearestCompetitors: nearest.map(({ place, distance }) => ({
      name: place.name,
      distance: Math.round(distance),
      rating: place.rating,
      reviews: place.userRatingsTotal,
    })),
    environmentData: nearest[0]?.place.elevation !== undefined ? {
      elevation: nearest[0].place.elevation,
      aqi: nearest[0].place.airQualityIndex,
      floodRisk: (nearest[0].place.elevation || 0) < 10 ? 'high' : 'low',
    } : undefined,
    recommendation,
  };
}
