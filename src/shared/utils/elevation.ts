/**
 * Elevation API Utility
 * Fetches terrain elevation data for locations.
 */

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
