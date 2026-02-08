/**
 * Solar API Utility
 * Estimates solar energy potential for a building/location.
 * Useful for energy-intensive businesses considering operating costs.
 */

export interface SolarAnalysis {
  maxSunshineHoursPerYear: number;
  maxArrayPanelsCount: number;
  maxArrayAreaMeters2: number;
  carbonOffsetKg: number;
  estimatedSavings: string;
  suitability: 'excellent' | 'good' | 'moderate' | 'poor';
  description: string;
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/**
 * Get solar potential data for a building at the given coordinates.
 * Uses Google Solar API to estimate panel capacity and energy savings.
 */
export async function getSolarPotential(
  lat: number,
  lng: number
): Promise<SolarAnalysis | null> {
  if (!API_KEY) return null;

  try {
    const response = await fetch(
      `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=HIGH&key=${API_KEY}`
    );

    if (!response.ok) {
      // Try with MEDIUM quality if HIGH not available
      const fallback = await fetch(
        `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=MEDIUM&key=${API_KEY}`
      );
      if (!fallback.ok) {
        console.warn('Solar API error:', response.status);
        return null;
      }
      return parseSolarResponse(await fallback.json());
    }

    return parseSolarResponse(await response.json());
  } catch (error) {
    console.error('Solar API error:', error);
    return null;
  }
}

function parseSolarResponse(data: {
  solarPotential?: {
    maxSunshineHoursPerYear?: number;
    maxArrayPanelsCount?: number;
    maxArrayAreaMeters2?: number;
    carbonOffsetFactorKgPerMwh?: number;
    solarPanelConfigs?: {
      panelsCount?: number;
      yearlyEnergyDcKwh?: number;
    }[];
  };
}): SolarAnalysis | null {
  const solar = data.solarPotential;
  if (!solar) return null;

  const maxSunshine = solar.maxSunshineHoursPerYear || 0;
  const panelCount = solar.maxArrayPanelsCount || 0;
  const areaMeters = solar.maxArrayAreaMeters2 || 0;

  // Estimate energy and savings
  const bestConfig = solar.solarPanelConfigs?.[solar.solarPanelConfigs.length - 1];
  const yearlyKwh = bestConfig?.yearlyEnergyDcKwh || 0;
  const carbonOffset = (yearlyKwh / 1000) * (solar.carbonOffsetFactorKgPerMwh || 400);

  // Malaysia electricity rate: ~RM 0.57/kWh (TNB tariff)
  const yearlyRm = yearlyKwh * 0.57;
  const estimatedSavings = yearlyRm > 0 ? `~RM ${yearlyRm.toFixed(0)}/year` : 'N/A';

  let suitability: SolarAnalysis['suitability'];
  let description: string;

  if (maxSunshine > 1500) {
    suitability = 'excellent';
    description = `Excellent solar potential with ${maxSunshine.toFixed(0)}h of sunshine/year. Up to ${panelCount} panels (${areaMeters.toFixed(0)}m²). Estimated savings: ${estimatedSavings}.`;
  } else if (maxSunshine > 1200) {
    suitability = 'good';
    description = `Good solar potential with ${maxSunshine.toFixed(0)}h of sunshine/year. Could save ${estimatedSavings} on electricity.`;
  } else if (maxSunshine > 900) {
    suitability = 'moderate';
    description = `Moderate solar potential. May be partially shaded. Savings: ${estimatedSavings}.`;
  } else {
    suitability = 'poor';
    description = `Limited solar potential — building may be heavily shaded or poorly oriented.`;
  }

  return {
    maxSunshineHoursPerYear: maxSunshine,
    maxArrayPanelsCount: panelCount,
    maxArrayAreaMeters2: areaMeters,
    carbonOffsetKg: carbonOffset,
    estimatedSavings,
    suitability,
    description,
  };
}
