/**
 * Air Quality API Utility
 * Fetches air quality data for locations.
 * Relevant for health-focused businesses and outdoor venues in Malaysia (haze season).
 */

export interface AirQualityData {
  aqi: number; // Air Quality Index (1-5 scale for Google, or raw index)
  category: string;
  dominantPollutant: string;
  color: string; // hex color for UI display
  healthRecommendation: string;
  businessImpact: string;
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/**
 * Fetch current air quality for a location using Google Air Quality API.
 * Falls back to a simplified assessment if the API is unavailable.
 */
export async function getAirQuality(
  lat: number,
  lng: number
): Promise<AirQualityData | null> {
  if (!API_KEY) return null;

  try {
    const response = await fetch(
      `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: { latitude: lat, longitude: lng },
          extraComputations: ['DOMINANT_POLLUTANT_CONCENTRATION', 'HEALTH_RECOMMENDATIONS'],
          languageCode: 'en',
        }),
      }
    );

    if (!response.ok) {
      console.warn('Air Quality API error:', response.status);
      return null;
    }

    const data = await response.json();
    const index = data.indexes?.[0];

    if (!index) return null;

    const aqi = index.aqi || 0;
    const category = index.category || 'Unknown';
    const dominantPollutant = index.dominantPollutant || 'Unknown';

    return {
      aqi,
      category,
      dominantPollutant,
      color: getAqiColor(aqi),
      healthRecommendation: getHealthRecommendation(aqi),
      businessImpact: getBusinessImpact(aqi),
    };
  } catch (error) {
    console.error('Air Quality API error:', error);
    return null;
  }
}

function getAqiColor(aqi: number): string {
  if (aqi <= 50) return '#22c55e'; // Green - Good
  if (aqi <= 100) return '#eab308'; // Yellow - Moderate
  if (aqi <= 150) return '#f97316'; // Orange - Unhealthy for sensitive
  if (aqi <= 200) return '#ef4444'; // Red - Unhealthy
  if (aqi <= 300) return '#a855f7'; // Purple - Very Unhealthy
  return '#7f1d1d'; // Maroon - Hazardous
}

function getHealthRecommendation(aqi: number): string {
  if (aqi <= 50) return 'Air quality is good. Ideal for outdoor activities and businesses.';
  if (aqi <= 100) return 'Moderate air quality. Acceptable for most outdoor activities.';
  if (aqi <= 150) return 'Unhealthy for sensitive groups. Consider indoor ventilation for health businesses.';
  if (aqi <= 200) return 'Unhealthy. Outdoor businesses may see reduced foot traffic.';
  return 'Very unhealthy. Strongly affects outdoor businesses. Indoor air purification recommended.';
}

function getBusinessImpact(aqi: number): string {
  if (aqi <= 50) return 'No impact — great for outdoor cafes, gyms, and wellness businesses.';
  if (aqi <= 100) return 'Minimal impact. Outdoor businesses can operate normally.';
  if (aqi <= 150) return 'Moderate impact. Health-conscious customers may avoid outdoor venues.';
  if (aqi <= 200) return 'Significant impact. Outdoor businesses should have indoor alternatives.';
  return 'Severe impact. Haze conditions — expect major reduction in foot traffic.';
}
