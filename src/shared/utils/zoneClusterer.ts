import type { PlaceResult } from '../types/chat';
import { reverseGeocode } from './geocoding';

export interface ServiceGaps {
  deliveryCount: number;
  takeoutCount: number;
  dineInCount: number;
  wheelchairCount: number;
}

export interface ZoneCluster {
  id: string;
  places: PlaceResult[];
  centroid: { lat: number; lng: number };
  areaName: string;
  placeCount: number;
  level: 'red' | 'orange' | 'green';
  radius: number; // meters (dynamic)
  averageRating: number;
  totalReviews: number;
  serviceGaps: ServiceGaps;
  competitionDensity: number; // 0-100
  competitorStrength: number; // 0-100 — weighted by rating × log(reviews)
  topCompetitors: PlaceResult[]; // top 3 by reviews
}

export interface NearbyAmenity {
  type: 'school' | 'mall' | 'transit' | 'residential' | 'hospital';
  count: number;
  names: string[];
}

export interface GreenZone {
  id: string;
  location: { lat: number; lng: number };
  areaName: string;
  nearestClusterDistance: number; // meters
  radius: number;
  nearestCompetitorName?: string;
  opportunityScore: number; // 0-100
  nearbyAmenities?: NearbyAmenity[];
}

/**
 * Haversine distance between two points in meters
 */
function haversineDistance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const aVal =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinDLng * sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
}

/**
 * Compute centroid (average lat/lng) of a group of places
 */
function computeCentroid(places: PlaceResult[]): { lat: number; lng: number } {
  const sum = places.reduce(
    (acc, p) => ({ lat: acc.lat + p.location.lat, lng: acc.lng + p.location.lng }),
    { lat: 0, lng: 0 }
  );
  return { lat: sum.lat / places.length, lng: sum.lng / places.length };
}

/**
 * Extract area/neighborhood name from a Malaysian address string.
 */
export function extractAreaName(address: string): string {
  const parts = address.split(',').map((s) => s.trim());

  for (let i = 1; i < Math.min(parts.length, 4); i++) {
    const part = parts[i];
    if (/^\d{5}/.test(part)) continue;
    if (/malaysia/i.test(part)) continue;
    if (/^(selangor|kuala lumpur|johor|penang|perak|sabah|sarawak|kedah|kelantan|melaka|negeri sembilan|pahang|perlis|terengganu|putrajaya|labuan)/i.test(part)) continue;
    return part;
  }

  return parts[0] || 'Unknown Area';
}

/**
 * Find the most common area name among a cluster's places
 */
function findClusterAreaName(places: PlaceResult[]): string {
  const nameCounts = new Map<string, number>();

  for (const place of places) {
    const name = extractAreaName(place.address);
    nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
  }

  let bestName = 'Unknown Area';
  let bestCount = 0;
  for (const [name, count] of nameCounts) {
    if (count > bestCount) {
      bestCount = count;
      bestName = name;
    }
  }

  return bestName;
}

function calculateAverageRating(places: PlaceResult[]): number {
  const rated = places.filter((p) => p.rating !== undefined && p.rating > 0);
  if (rated.length === 0) return 0;
  return rated.reduce((sum, p) => sum + (p.rating || 0), 0) / rated.length;
}

function calculateServiceGaps(places: PlaceResult[]): ServiceGaps {
  return {
    deliveryCount: places.filter((p) => p.delivery).length,
    takeoutCount: places.filter((p) => p.takeout).length,
    dineInCount: places.filter((p) => p.dineIn).length,
    wheelchairCount: places.filter((p) => p.wheelchairAccessible).length,
  };
}

/**
 * Competitor strength: weighted score based on rating × log(reviews).
 * High score = strong incumbents that are hard to compete against.
 */
function calculateCompetitorStrength(places: PlaceResult[]): number {
  if (places.length === 0) return 0;
  const scores = places.map((p) => {
    const rating = p.rating || 0;
    const reviews = p.userRatingsTotal || 0;
    return rating * Math.log10(Math.max(reviews, 1) + 1);
  });
  const maxPossible = 5 * Math.log10(10001); // 5-star with 10k reviews
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.min(100, Math.round((avgScore / maxPossible) * 100));
}

function calculateDensityScore(count: number, radiusMeters: number): number {
  const areaKm2 = Math.PI * Math.pow(radiusMeters / 1000, 2);
  if (areaKm2 === 0) return 100;
  const density = count / areaKm2;
  return Math.min(100, Math.round(density * 20));
}

/**
 * Cluster places by proximity using a distance threshold (BFS flood fill).
 * 4-tier system: red (5+), orange (3-4), yellow (1-2).
 * Dynamic radius based on actual geographic spread.
 */
export function clusterPlaces(
  places: PlaceResult[],
  thresholdMeters: number = 1000
): ZoneCluster[] {
  const visited = new Set<number>();
  const clusters: ZoneCluster[] = [];

  for (let i = 0; i < places.length; i++) {
    if (visited.has(i)) continue;

    const queue = [i];
    const clusterIndices: number[] = [];
    visited.add(i);

    while (queue.length > 0) {
      const current = queue.shift()!;
      clusterIndices.push(current);

      for (let j = 0; j < places.length; j++) {
        if (visited.has(j)) continue;
        const dist = haversineDistance(places[current].location, places[j].location);
        if (dist <= thresholdMeters) {
          visited.add(j);
          queue.push(j);
        }
      }
    }

    const clusterPlacesList = clusterIndices.map((idx) => places[idx]);
    const centroid = computeCentroid(clusterPlacesList);
    const areaName = findClusterAreaName(clusterPlacesList);
    const count = clusterPlacesList.length;

    // 3-tier classification: 1 = green (opportunity), 2-3 = orange, 4+ = red
    const level: 'red' | 'orange' | 'green' =
      count >= 4 ? 'red' : count >= 2 ? 'orange' : 'green';

    // Dynamic radius: based on actual spread of places, minimum 400m
    const maxSpread =
      clusterPlacesList.length > 1
        ? Math.max(
            ...clusterPlacesList.map((p) => haversineDistance(centroid, p.location))
          )
        : 300;
    const radius = Math.max(400, maxSpread * 1.3);

    // Rich metadata
    const averageRating = calculateAverageRating(clusterPlacesList);
    const totalReviews = clusterPlacesList.reduce(
      (sum, p) => sum + (p.userRatingsTotal || 0),
      0
    );
    const serviceGaps = calculateServiceGaps(clusterPlacesList);
    const competitionDensity = calculateDensityScore(count, radius);
    const competitorStrength = calculateCompetitorStrength(clusterPlacesList);
    const topCompetitors = [...clusterPlacesList]
      .sort((a, b) => (b.userRatingsTotal || 0) - (a.userRatingsTotal || 0))
      .slice(0, 3);

    clusters.push({
      id: `zone-${i}`,
      places: clusterPlacesList,
      centroid,
      areaName,
      placeCount: count,
      level,
      radius,
      averageRating,
      totalReviews,
      serviceGaps,
      competitionDensity,
      competitorStrength,
      topCompetitors,
    });
  }

  return clusters;
}

/**
 * Find the top N gap zones using 30x30 grid sampling.
 * Returns points farthest from all competitors, reverse geocoded.
 */
export async function findTopGaps(
  clusters: ZoneCluster[],
  bounds: google.maps.LatLngBounds,
  topN: number = 3
): Promise<GreenZone[]> {
  if (clusters.length === 0) return [];

  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const gridSize = 30;
  const latStep = (ne.lat() - sw.lat()) / gridSize;
  const lngStep = (ne.lng() - sw.lng()) / gridSize;

  const allPlaces = clusters.flatMap((c) => c.places);

  const candidates: Array<{
    point: { lat: number; lng: number };
    minDist: number;
    nearestPlace: PlaceResult | null;
  }> = [];

  for (let row = 1; row < gridSize; row++) {
    for (let col = 1; col < gridSize; col++) {
      const point = {
        lat: sw.lat() + row * latStep,
        lng: sw.lng() + col * lngStep,
      };

      let minDist = Infinity;
      let nearestPlace: PlaceResult | null = null;

      for (const place of allPlaces) {
        const dist = haversineDistance(point, place.location);
        if (dist < minDist) {
          minDist = dist;
          nearestPlace = place;
        }
      }

      if (minDist >= 300) {
        candidates.push({ point, minDist, nearestPlace });
      }
    }
  }

  // Sort by distance descending, take top N
  candidates.sort((a, b) => b.minDist - a.minDist);

  // Filter out candidates too close to each other (at least 500m apart)
  const selected: typeof candidates = [];
  for (const c of candidates) {
    if (selected.length >= topN) break;
    const tooClose = selected.some(
      (s) => haversineDistance(c.point, s.point) < 500
    );
    if (!tooClose) {
      selected.push(c);
    }
  }

  // Reverse geocode and build GreenZone objects
  const greenZones: GreenZone[] = [];
  for (let i = 0; i < selected.length; i++) {
    const candidate = selected[i];
    let areaName: string;
    try {
      const address = await reverseGeocode(candidate.point.lat, candidate.point.lng);
      areaName = extractAreaName(address);
    } catch {
      areaName = `Opportunity Zone ${i + 1}`;
    }

    greenZones.push({
      id: `green-zone-${i}`,
      location: candidate.point,
      areaName,
      nearestClusterDistance: Math.round(candidate.minDist),
      radius: Math.min(500, candidate.minDist * 0.4),
      nearestCompetitorName: candidate.nearestPlace?.name,
      opportunityScore: Math.min(100, Math.round((candidate.minDist / 1000) * 20)),
    });
  }

  return greenZones;
}
