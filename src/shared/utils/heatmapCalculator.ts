import type { PlaceResult } from '../types/chat';
import type { WeightedPoint, HeatmapMode, HeatmapZoneAnalysis, GridConfig } from '../types/heatmap';
import { DEFAULT_GRID_CONFIG } from '../types/heatmap';

/**
 * Generate a dense grid of weighted points across the map bounds
 * Uses Inverse Distance Weighting (IDW) for smooth interpolation
 *
 * @param bounds - Visible map bounds
 * @param places - Competitor locations
 * @param mode - Heatmap mode (competition/opportunity/environment)
 * @param gridConfig - Grid sampling configuration
 * @returns Dense array of WeightedPoints (400-900 points typically)
 */
export function generateDenseHeatmapGrid(
  bounds: google.maps.LatLngBounds,
  places: PlaceResult[],
  mode: HeatmapMode,
  gridConfig: GridConfig = DEFAULT_GRID_CONFIG
): WeightedPoint[] {
  if (places.length === 0) return [];

  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();

  // Calculate grid cell size based on bounds and zoom
  const latRange = ne.lat() - sw.lat();
  const lngRange = ne.lng() - sw.lng();

  // Adaptive grid resolution
  const cellsPerSide = gridConfig.cellsPerSide;
  const latStep = latRange / cellsPerSide;
  const lngStep = lngRange / cellsPerSide;

  const gridPoints: WeightedPoint[] = [];

  // Pre-calculate competition scores for all places (for IDW)
  const competitionScores = places.map(place => {
    const rating = place.rating || 3;
    const reviews = place.userRatingsTotal || 1;
    if (mode === 'opportunity') {
      // For opportunity mode, lower competition = higher value
      return 1 / (rating * reviews + 1);
    } else {
      // For competition mode, higher competition = higher value
      return rating * reviews;
    }
  });

  // Generate grid cells
  for (let latIdx = 0; latIdx < cellsPerSide; latIdx++) {
    for (let lngIdx = 0; lngIdx < cellsPerSide; lngIdx++) {
      const lat = sw.lat() + (latIdx + 0.5) * latStep;  // Center of cell
      const lng = sw.lng() + (lngIdx + 0.5) * lngStep;
      const gridPoint = new google.maps.LatLng(lat, lng);

      // Calculate IDW weight for this grid cell
      let idwNumerator = 0;
      let idwDenominator = 0;

      places.forEach((place, idx) => {
        const placeLatLng = new google.maps.LatLng(place.location.lat, place.location.lng);
        const distance = google.maps.geometry.spherical.computeDistanceBetween(gridPoint, placeLatLng);

        // Apply smoothing to prevent division by zero for very close points
        const smoothedDistance = Math.max(distance, gridConfig.idwSmoothing);
        const weightFactor = 1 / Math.pow(smoothedDistance, gridConfig.idwPower);

        idwNumerator += competitionScores[idx] * weightFactor;
        idwDenominator += weightFactor;
      });

      const idwWeight = idwDenominator > 0 ? idwNumerator / idwDenominator : 0;

      gridPoints.push({
        location: gridPoint,
        weight: idwWeight  // Will be normalized later
      });
    }
  }

  // Normalize all weights to 0-100 scale
  const weights = gridPoints.map(p => p.weight);
  const maxWeight = Math.max(...weights);
  const minWeight = Math.min(...weights);
  const range = maxWeight - minWeight || 1;

  return gridPoints.map(p => ({
    location: p.location,
    weight: ((p.weight - minWeight) / range) * 100
  }));
}

/**
 * DEPRECATED: Calculate competition density weights (point-based)
 * Replaced by generateDenseHeatmapGrid() for better area coverage
 * Kept for backward compatibility
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
 * Updated for dense grid heatmap with full area coverage
 */
export function getZoomBasedRadius(zoom: number): number {
  if (zoom >= 15) return 80;   // Street level - large radius
  if (zoom >= 12) return 120;  // District level - very large radius
  return 150;                  // City level - maximum radius for full coverage
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
