import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { PlaceData } from '@/types';
import { getMockPlaces } from './mockData';

let isLoaded = false;
let optionsSet = false;

export async function loadGoogleMaps(): Promise<void> {
  if (isLoaded) return;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Debug logging
  if (!apiKey) {
    console.error('❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set!');
    throw new Error('Google Maps API key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.');
  }

  console.log('✅ Google Maps API key found:', apiKey.substring(0, 10) + '...');

  // Set options only once before loading any library
  if (!optionsSet) {
    setOptions({
      key: apiKey,
      v: 'weekly',
    });
    optionsSet = true;
  }

  try {
    console.log('Loading Google Maps libraries...');
    await importLibrary('maps');
    await importLibrary('places');
    await importLibrary('visualization');
    isLoaded = true;
    console.log('✅ Google Maps loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load Google Maps:', error);
    throw error;
  }
}

export async function searchNearbyPlaces(
  map: google.maps.Map,
  center: google.maps.LatLng,
  type: string
): Promise<PlaceData[]> {
  try {
    // Check if Places API is available
    if (!google.maps.places?.PlacesService) {
      console.warn('Places API not available, using mock data');
      return getMockPlaces(type);
    }

    const service = new google.maps.places.PlacesService(map);

    return new Promise((resolve) => {
      service.nearbySearch(
        {
          location: center,
          radius: 2000,
          type: type,
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const places: PlaceData[] = results
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
            resolve(places);
          } else {
            console.warn('Places search failed, using mock data:', status);
            resolve(getMockPlaces(type));
          }
        }
      );
    });
  } catch (error) {
    console.warn('Places API error, using mock data:', error);
    return getMockPlaces(type);
  }
}

export function createHeatmapData(
  places: PlaceData[],
  gapScores: Map<string, number>
): google.maps.visualization.WeightedLocation[] {
  return places.map((place) => ({
    location: new google.maps.LatLng(place.location.lat, place.location.lng),
    weight: gapScores.get(place.placeId) || 50,
  }));
}
