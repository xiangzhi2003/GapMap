/**
 * Distance Matrix API Utility
 * Calculates travel times from multiple origins to a target location.
 * Powers the accessibility scoring feature for location intelligence.
 */

export interface AccessibilityResult {
  origin: string;
  destination: string;
  distance: string;
  duration: string;
  durationValue: number; // seconds
  status: string;
}

export interface AccessibilityAnalysis {
  targetLocation: { lat: number; lng: number };
  targetAddress: string;
  results: AccessibilityResult[];
  averageTravelTimeMinutes: number;
  accessibilityScore: number; // 0-100, higher = more accessible
  summary: string;
}

/**
 * Generate surrounding residential reference points around a target location.
 * Creates 8 points in cardinal and intercardinal directions at ~2km radius.
 */
function generateSurroundingPoints(
  center: { lat: number; lng: number },
  radiusKm: number = 2
): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  const latOffset = radiusKm / 111; // ~111km per degree latitude
  const lngOffset = radiusKm / (111 * Math.cos((center.lat * Math.PI) / 180));

  // 8 directions: N, NE, E, SE, S, SW, W, NW
  const directions = [
    { lat: latOffset, lng: 0 },
    { lat: latOffset * 0.707, lng: lngOffset * 0.707 },
    { lat: 0, lng: lngOffset },
    { lat: -latOffset * 0.707, lng: lngOffset * 0.707 },
    { lat: -latOffset, lng: 0 },
    { lat: -latOffset * 0.707, lng: -lngOffset * 0.707 },
    { lat: 0, lng: -lngOffset },
    { lat: latOffset * 0.707, lng: -lngOffset * 0.707 },
  ];

  for (const dir of directions) {
    points.push({
      lat: center.lat + dir.lat,
      lng: center.lng + dir.lng,
    });
  }

  return points;
}

/**
 * Calculate accessibility score for a target location.
 * Measures travel times from surrounding residential areas using Distance Matrix API.
 */
export async function calculateAccessibility(
  targetLocation: { lat: number; lng: number },
  targetAddress: string,
  travelMode: google.maps.TravelMode = google.maps.TravelMode.DRIVING,
  radiusKm: number = 3
): Promise<AccessibilityAnalysis> {
  const service = new google.maps.DistanceMatrixService();
  const surroundingPoints = generateSurroundingPoints(targetLocation, radiusKm);

  const origins = surroundingPoints.map(
    (p) => new google.maps.LatLng(p.lat, p.lng)
  );
  const destination = new google.maps.LatLng(
    targetLocation.lat,
    targetLocation.lng
  );

  try {
    const response = await service.getDistanceMatrix({
      origins,
      destinations: [destination],
      travelMode,
      unitSystem: google.maps.UnitSystem.METRIC,
    });

    const results: AccessibilityResult[] = [];
    let totalDuration = 0;
    let validCount = 0;

    const directionLabels = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];

    response.rows.forEach((row, index) => {
      const element = row.elements[0];
      if (element.status === 'OK') {
        results.push({
          origin: `${directionLabels[index]} (~${radiusKm}km)`,
          destination: targetAddress,
          distance: element.distance.text,
          duration: element.duration.text,
          durationValue: element.duration.value,
          status: element.status,
        });
        totalDuration += element.duration.value;
        validCount++;
      } else {
        results.push({
          origin: `${directionLabels[index]} (~${radiusKm}km)`,
          destination: targetAddress,
          distance: 'N/A',
          duration: 'N/A',
          durationValue: 0,
          status: element.status,
        });
      }
    });

    const averageSeconds = validCount > 0 ? totalDuration / validCount : 0;
    const averageMinutes = Math.round(averageSeconds / 60);

    // Score: 100 = all directions < 5min, 0 = all directions > 30min
    const score = Math.max(0, Math.min(100, Math.round(100 - ((averageMinutes - 5) / 25) * 100)));

    let summary: string;
    if (score >= 80) {
      summary = 'Excellent accessibility — most surrounding areas can reach this location within minutes.';
    } else if (score >= 60) {
      summary = 'Good accessibility — reasonable travel times from most directions.';
    } else if (score >= 40) {
      summary = 'Moderate accessibility — some areas may find it inconvenient to reach.';
    } else {
      summary = 'Poor accessibility — difficult to reach from many surrounding areas.';
    }

    return {
      targetLocation,
      targetAddress,
      results,
      averageTravelTimeMinutes: averageMinutes,
      accessibilityScore: score,
      summary,
    };
  } catch (error) {
    console.error('Distance Matrix error:', error);
    return {
      targetLocation,
      targetAddress,
      results: [],
      averageTravelTimeMinutes: 0,
      accessibilityScore: 0,
      summary: 'Unable to calculate accessibility — Distance Matrix API error.',
    };
  }
}
