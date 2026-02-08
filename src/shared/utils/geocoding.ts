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
