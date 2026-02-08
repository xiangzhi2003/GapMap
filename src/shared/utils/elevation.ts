/**
 * Elevation API Utility
 * Fetches terrain elevation data for locations.
 * Used to assess flood risk, foot traffic impact, and venue suitability.
 */

export interface ElevationResult {
  location: { lat: number; lng: number };
  elevation: number; // meters above sea level
  resolution: number; // meters
}

export interface TerrainAnalysis {
  elevation: number;
  terrainType: 'low-lying' | 'flat' | 'gentle-slope' | 'hilly' | 'elevated';
  floodRisk: 'high' | 'moderate' | 'low';
  description: string;
}

const elevationCache = new Map<string, number>();

/**
 * Get elevation for a single location.
 */
export async function getElevation(
  lat: number,
  lng: number
): Promise<number | null> {
  const cacheKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (elevationCache.has(cacheKey)) {
    return elevationCache.get(cacheKey)!;
  }

  const elevator = new google.maps.ElevationService();

  try {
    const response = await elevator.getElevationForLocations({
      locations: [{ lat, lng }],
    });

    if (response.results.length > 0) {
      const elevation = response.results[0].elevation;
      elevationCache.set(cacheKey, elevation);
      return elevation;
    }
    return null;
  } catch (error) {
    console.error('Elevation API error:', error);
    return null;
  }
}

/**
 * Get elevations for multiple locations in a single batch request.
 */
export async function getElevationBatch(
  locations: { lat: number; lng: number }[]
): Promise<ElevationResult[]> {
  if (locations.length === 0) return [];

  const elevator = new google.maps.ElevationService();

  try {
    const response = await elevator.getElevationForLocations({
      locations: locations.map((loc) => ({ lat: loc.lat, lng: loc.lng })),
    });

    return response.results.map((result, index) => {
      const elevation = result.elevation;
      const cacheKey = `${locations[index].lat.toFixed(5)},${locations[index].lng.toFixed(5)}`;
      elevationCache.set(cacheKey, elevation);

      return {
        location: locations[index],
        elevation,
        resolution: result.resolution,
      };
    });
  } catch (error) {
    console.error('Elevation batch error:', error);
    return [];
  }
}

/**
 * Get elevation along a path (useful for route analysis).
 */
export async function getElevationAlongPath(
  path: { lat: number; lng: number }[],
  samples: number = 20
): Promise<ElevationResult[]> {
  if (path.length < 2) return [];

  const elevator = new google.maps.ElevationService();

  try {
    const response = await elevator.getElevationAlongPath({
      path: path.map((p) => ({ lat: p.lat, lng: p.lng })),
      samples,
    });

    return response.results.map((result) => ({
      location: {
        lat: result.location!.lat(),
        lng: result.location!.lng(),
      },
      elevation: result.elevation,
      resolution: result.resolution,
    }));
  } catch (error) {
    console.error('Elevation path error:', error);
    return [];
  }
}

/**
 * Analyze terrain characteristics for a location (Malaysia context).
 * Malaysian average elevation: ~300m, coastal areas: 0-50m, highland: >500m.
 */
export function analyzeTerrain(elevationMeters: number): TerrainAnalysis {
  if (elevationMeters < 10) {
    return {
      elevation: elevationMeters,
      terrainType: 'low-lying',
      floodRisk: 'high',
      description: `Very low elevation (${elevationMeters.toFixed(0)}m). High flood risk during monsoon season. Consider flood mitigation if opening a ground-floor business.`,
    };
  } else if (elevationMeters < 30) {
    return {
      elevation: elevationMeters,
      terrainType: 'flat',
      floodRisk: 'moderate',
      description: `Low elevation (${elevationMeters.toFixed(0)}m). Moderate flood risk. Good for foot traffic — flat terrain encourages walking.`,
    };
  } else if (elevationMeters < 100) {
    return {
      elevation: elevationMeters,
      terrainType: 'gentle-slope',
      floodRisk: 'low',
      description: `Moderate elevation (${elevationMeters.toFixed(0)}m). Low flood risk. Comfortable terrain for most businesses.`,
    };
  } else if (elevationMeters < 300) {
    return {
      elevation: elevationMeters,
      terrainType: 'hilly',
      floodRisk: 'low',
      description: `Hilly area (${elevationMeters.toFixed(0)}m). Low flood risk but may reduce walk-in traffic. Good visibility from elevation.`,
    };
  } else {
    return {
      elevation: elevationMeters,
      terrainType: 'elevated',
      floodRisk: 'low',
      description: `Highland area (${elevationMeters.toFixed(0)}m). No flood risk. Cooler climate — ideal for highland tourism or resort businesses.`,
    };
  }
}
