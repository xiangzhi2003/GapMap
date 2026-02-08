/**
 * Routes API Utility
 * Enhanced routing with fuel estimates and multiple route alternatives.
 * Supplements the existing Directions API with richer data.
 */

export interface RouteOption {
  summary: string;
  distance: string;
  duration: string;
  distanceMeters: number;
  durationSeconds: number;
  warnings: string[];
}

export interface AdvancedRouteResult {
  routes: RouteOption[];
  bestRoute: number; // index of recommended route
  analysis: string;
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/**
 * Get advanced route information using the Routes API (REST).
 * Provides multiple alternatives that the JS Directions API doesn't expose.
 */
export async function getAdvancedRoutes(
  origin: string,
  destination: string,
  travelMode: 'DRIVE' | 'WALK' | 'BICYCLE' | 'TRANSIT' = 'DRIVE'
): Promise<AdvancedRouteResult | null> {
  if (!API_KEY) return null;

  try {
    const response = await fetch(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': API_KEY,
          'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline,routes.description,routes.warnings,routes.localizedValues',
        },
        body: JSON.stringify({
          origin: { address: origin },
          destination: { address: destination },
          travelMode,
          computeAlternativeRoutes: true,
          routeModifiers: {
            avoidHighways: false,
          },
          languageCode: 'en',
          units: 'METRIC',
        }),
      }
    );

    if (!response.ok) {
      console.warn('Routes API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) return null;

    const routes: RouteOption[] = data.routes.map((route: {
      description?: string;
      distanceMeters?: number;
      duration?: string;
      localizedValues?: {
        distance?: { text?: string };
        duration?: { text?: string };
      };
      warnings?: string[];
    }) => {
      const durationSeconds = parseInt(route.duration?.replace('s', '') || '0');

      return {
        summary: route.description || 'Route',
        distance: route.localizedValues?.distance?.text || `${((route.distanceMeters || 0) / 1000).toFixed(1)} km`,
        duration: route.localizedValues?.duration?.text || `${Math.round(durationSeconds / 60)} min`,
        distanceMeters: route.distanceMeters || 0,
        durationSeconds,
        warnings: route.warnings || [],
      };
    });

    // Recommend shortest duration route
    const bestRoute = routes.reduce(
      (bestIdx: number, route: RouteOption, idx: number) =>
        route.durationSeconds < routes[bestIdx].durationSeconds ? idx : bestIdx,
      0
    );

    const analysis = generateRouteAnalysis(routes, bestRoute);

    return { routes, bestRoute, analysis };
  } catch (error) {
    console.error('Routes API error:', error);
    return null;
  }
}

function generateRouteAnalysis(routes: RouteOption[], bestIdx: number): string {
  if (routes.length === 1) {
    const r = routes[0];
    return `Route via ${r.summary}: ${r.distance}, ${r.duration}.`;
  }

  const best = routes[bestIdx];
  const parts = [`Fastest route: ${best.summary} (${best.distance}, ${best.duration})`];

  return parts.join('. ') + '.';
}
