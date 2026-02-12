import { PlaceResult } from '@/shared/types/chat';

export interface GridZone {
  bounds: google.maps.LatLngBounds;
  count: number;
  status: 'red' | 'orange' | 'green';
  places: PlaceResult[]; // Places in this zone
  center: google.maps.LatLng;
}

/**
 * Divide map viewport into 4x4 grid and analyze competitor density
 */
export function calculateGridZones(
  mapBounds: google.maps.LatLngBounds,
  places: PlaceResult[]
): GridZone[] {
  const zones: GridZone[] = [];

  const ne = mapBounds.getNorthEast();
  const sw = mapBounds.getSouthWest();

  const latStep = (ne.lat() - sw.lat()) / 4;
  const lngStep = (ne.lng() - sw.lng()) / 4;

  // Create 16 grid cells
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const cellSW = new google.maps.LatLng(
        sw.lat() + row * latStep,
        sw.lng() + col * lngStep
      );
      const cellNE = new google.maps.LatLng(
        sw.lat() + (row + 1) * latStep,
        sw.lng() + (col + 1) * lngStep
      );

      const cellBounds = new google.maps.LatLngBounds(cellSW, cellNE);

      // Count places in this cell
      const placesInZone = places.filter(place =>
        cellBounds.contains(place.location)
      );

      const count = placesInZone.length;

      // Determine zone status
      let status: 'red' | 'orange' | 'green';
      if (count >= 5) status = 'red';
      else if (count >= 2) status = 'orange';
      else status = 'green';

      zones.push({
        bounds: cellBounds,
        count,
        status,
        places: placesInZone,
        center: cellBounds.getCenter(),
      });
    }
  }

  return zones;
}

/**
 * Get color for zone status
 */
export function getZoneColor(status: 'red' | 'orange' | 'green'): string {
  switch (status) {
    case 'red': return '#ef4444';
    case 'orange': return '#f59e0b';
    case 'green': return '#22c55e';
  }
}
