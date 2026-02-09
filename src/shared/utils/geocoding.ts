/**
 * Geocoding API Utility
 * Converts coordinates to addresses.
 */

let geocoder: google.maps.Geocoder | null = null;

function getGeocoder(): google.maps.Geocoder {
  if (!geocoder) {
    geocoder = new google.maps.Geocoder();
  }
  return geocoder;
}

const reverseGeocodeCache = new Map<string, string>();
const forwardGeocodeCache = new Map<string, google.maps.GeocoderResult | null>();

/**
 * Reverse geocode coordinates to a human-readable address.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string> {
  const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  if (reverseGeocodeCache.has(cacheKey)) {
    return reverseGeocodeCache.get(cacheKey)!;
  }

  try {
    const result = await getGeocoder().geocode({
      location: { lat, lng },
    });

    if (result.results.length > 0) {
      const address = result.results[0].formatted_address;
      reverseGeocodeCache.set(cacheKey, address);
      return address;
    }
    return '';
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return '';
  }
}

/**
 * Forward geocode an address/location to get coordinates and bounds.
 * Returns the first matching result with geometry information.
 */
export async function forwardGeocode(
  address: string
): Promise<google.maps.GeocoderResult | null> {
  const cacheKey = address.toLowerCase().trim();
  if (forwardGeocodeCache.has(cacheKey)) {
    return forwardGeocodeCache.get(cacheKey)!;
  }

  try {
    const result = await getGeocoder().geocode({ address });

    if (result.results.length > 0) {
      const geocodeResult = result.results[0];
      forwardGeocodeCache.set(cacheKey, geocodeResult);
      return geocodeResult;
    }
    forwardGeocodeCache.set(cacheKey, null);
    return null;
  } catch (error) {
    console.error('Forward geocoding error:', error);
    forwardGeocodeCache.set(cacheKey, null);
    return null;
  }
}

/**
 * Extract location name from a search query.
 * Examples:
 * - "pet cafe in Bukit Jalil" → "Bukit Jalil"
 * - "gyms near KLCC" → "KLCC"
 * - "coffee shop Puchong" → "Puchong"
 */
export function extractLocationFromQuery(query: string): string | null {
  const patterns = [
    /\b(?:in|at)\s+([A-Z][A-Za-z\s]+?)(?:\s+Malaysia)?$/i,
    /\b(?:near|around)\s+([A-Z][A-Za-z\s]+?)(?:\s+Malaysia)?$/i,
    /([A-Z][A-Za-z\s]+?)(?:\s+Malaysia)$/i,
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}
