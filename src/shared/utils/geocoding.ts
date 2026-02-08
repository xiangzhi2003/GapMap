/**
 * Geocoding API Utility
 * Converts addresses to coordinates and coordinates to addresses.
 * Used for address-based searches and enriching AI recommendations with street names.
 */

let geocoder: google.maps.Geocoder | null = null;

function getGeocoder(): google.maps.Geocoder {
  if (!geocoder) {
    geocoder = new google.maps.Geocoder();
  }
  return geocoder;
}

// Simple cache to avoid redundant geocoding requests
const geocodeCache = new Map<string, google.maps.GeocoderResult>();
const reverseGeocodeCache = new Map<string, string>();

/**
 * Geocode an address string to coordinates.
 * Returns the first matching result with full location data.
 */
export async function geocodeAddress(
  address: string
): Promise<google.maps.GeocoderResult | null> {
  const cacheKey = address.toLowerCase().trim();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  try {
    const result = await getGeocoder().geocode({ address });

    if (result.results.length > 0) {
      geocodeCache.set(cacheKey, result.results[0]);
      return result.results[0];
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

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
 * Extract specific address components from a geocoder result.
 * Useful for getting just the street name, neighborhood, or city.
 */
export function extractAddressComponent(
  result: google.maps.GeocoderResult,
  type: string
): string {
  const component = result.address_components.find((c) =>
    c.types.includes(type)
  );
  return component?.long_name || '';
}
