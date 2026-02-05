export interface PlaceData {
  placeId: string;
  name: string;
  location: { lat: number; lng: number };
  rating: number;
  userRatingCount: number;
  types: string[];
}

// Re-export chat types
export * from './chat';
