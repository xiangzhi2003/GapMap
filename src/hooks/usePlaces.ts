'use client';

import { useState, useCallback } from 'react';
import { PlaceData } from '@/types';
import { getMockPlaces } from '@/utils/mockData';

interface UsePlacesResult {
  places: PlaceData[];
  isLoading: boolean;
  error: string | null;
  isUsingMockData: boolean;
  searchPlaces: (map: google.maps.Map, center: google.maps.LatLng, type: string) => Promise<PlaceData[]>;
}

/**
 * Custom hook with smart API fallback:
 * 1. Attempts real Google Places API first
 * 2. On ANY error (quota, network, restricted key), returns mock data
 * 3. Never crashes - always returns usable data
 */
export function usePlaces(): UsePlacesResult {
  const [places, setPlaces] = useState<PlaceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  const searchPlaces = useCallback(async (
    map: google.maps.Map,
    center: google.maps.LatLng,
    type: string
  ): Promise<PlaceData[]> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if Places API is available
      if (!google.maps.places?.PlacesService) {
        console.warn('Places API not available, using mock data');
        setIsUsingMockData(true);
        const mockData = getMockPlaces(type);
        setPlaces(mockData);
        return mockData;
      }

      const service = new google.maps.places.PlacesService(map);

      const result = await new Promise<PlaceData[]>((resolve, reject) => {
        service.nearbySearch(
          {
            location: center,
            radius: 2000,
            type: type,
          },
          (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              const placesData: PlaceData[] = results
                .filter((place) => place.place_id && place.geometry?.location)
                .map((place) => ({
                  placeId: place.place_id!,
                  name: place.name || 'Unknown',
                  location: {
                    lat: place.geometry!.location!.lat(),
                    lng: place.geometry!.location!.lng(),
                  },
                  rating: place.rating || 3.5,
                  userRatingCount: place.user_ratings_total || 0,
                  types: place.types || [],
                }));
              setIsUsingMockData(false);
              resolve(placesData);
            } else {
              // Any error status - use mock data
              reject(new Error(`Places API error: ${status}`));
            }
          }
        );
      });

      setPlaces(result);
      return result;
    } catch (err) {
      // On ANY error, fall back to mock data silently
      console.warn('Places API error, using mock data:', err);
      setIsUsingMockData(true);
      setError(null); // Don't show error to user since we have fallback
      const mockData = getMockPlaces(type);
      setPlaces(mockData);
      return mockData;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    places,
    isLoading,
    error,
    isUsingMockData,
    searchPlaces,
  };
}
