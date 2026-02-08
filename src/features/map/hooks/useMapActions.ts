'use client';

import { useState, useCallback, useRef } from 'react';
import { AnalysisCardData, PlaceResult } from '@/shared/types/chat';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { renderRichInfoWindow } from '@/shared/utils/infoWindowRenderer';
import { getCategoryColor } from '@/shared/utils/markerIcons';

interface UseMapActionsResult {
  searchResults: PlaceResult[];
  isSearching: boolean;
  directionsResult: google.maps.DirectionsResult | null;
  recentSearches: string[];
  analysisCard: AnalysisCardData | null;
  isAnalysisCardVisible: boolean;
  nextPageToken: string | null;
  hasMoreResults: boolean;
  searchPlaces: (query: string, map: google.maps.Map) => Promise<void>;
  getDirections: (origin: string, destination: string, map: google.maps.Map, travelMode?: google.maps.TravelMode) => Promise<void>;
  clearSearchResults: () => void;
  clearDirections: () => void;
  toggleAnalysisCard: () => void;
  addMarker: (lat: number, lng: number, title: string, map: google.maps.Map) => google.maps.Marker;
  clearMarkers: () => void;
  loadMoreResults: (map: google.maps.Map) => Promise<void>;
}

export function useMapActions(): UseMapActionsResult {
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [analysisCard] = useState<AnalysisCardData | null>(null);
  const [isAnalysisCardVisible, setIsAnalysisCardVisible] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [placeDetailsCache, setPlaceDetailsCache] = useState<Record<string, PlaceResult>>({});
  const isPaginatingRef = useRef<boolean>(false);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const greenZoneMarkerRef = useRef<google.maps.Marker | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const paginationRef = useRef<google.maps.places.PlaceSearchPagination | null>(null);
  const activeInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const searchGenerationRef = useRef<number>(0);

  const clearMarkers = useCallback(() => {
    // Close active InfoWindow
    if (activeInfoWindowRef.current) {
      activeInfoWindowRef.current.close();
      activeInfoWindowRef.current = null;
    }

    // Clear clusterer first
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current = null;
    }

    // Clear all markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Clear heatmap
    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
      heatmapRef.current = null;
    }

    // Clear green zone marker
    if (greenZoneMarkerRef.current) {
      greenZoneMarkerRef.current.setMap(null);
      greenZoneMarkerRef.current = null;
    }
  }, []);

  const clearDirections = useCallback(() => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }
    setDirectionsResult(null);
  }, []);

  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
    setNextPageToken(null);
    paginationRef.current = null;
    clearMarkers();
  }, [clearMarkers]);


  const toggleAnalysisCard = useCallback(() => {
    setIsAnalysisCardVisible((prev) => !prev);
  }, []);

  const getPlaceDetails = useCallback(async (
    placeId: string,
    map: google.maps.Map
  ): Promise<PlaceResult | null> => {
    // Check cache first
    if (placeDetailsCache[placeId]) {
      return placeDetailsCache[placeId];
    }

    const service = new google.maps.places.PlacesService(map);

    return new Promise((resolve) => {
      service.getDetails(
        {
          placeId,
          fields: [
            'name', 'formatted_address', 'geometry', 'rating',
            'user_ratings_total', 'photos', 'types', 'opening_hours',
            'website', 'formatted_phone_number', 'price_level',
            'reviews', 'business_status', 'url', 'place_id'
          ]
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            const details: PlaceResult = {
              placeId: place.place_id!,
              name: place.name || 'Unknown',
              address: place.formatted_address || '',
              location: {
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0,
              },
              rating: place.rating,
              userRatingsTotal: place.user_ratings_total,
              photos: place.photos,
              types: place.types,
              openNow: place.opening_hours?.isOpen?.(),
              website: place.website,
              phoneNumber: place.formatted_phone_number,
              openingHours: place.opening_hours,
              priceLevel: place.price_level,
              reviews: place.reviews?.slice(0, 3), // First 3 reviews only
              businessStatus: place.business_status,
              url: place.url,
            };

            // Cache it
            setPlaceDetailsCache(prev => ({ ...prev, [placeId]: details }));
            resolve(details);
          } else {
            resolve(null);
          }
        }
      );
    });
  }, [placeDetailsCache]);

  const addMarker = useCallback((lat: number, lng: number, title: string, map: google.maps.Map): google.maps.Marker => {
    const marker = new google.maps.Marker({
      position: { lat, lng },
      map,
      title,
      animation: google.maps.Animation.DROP,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#00f0ff',
        fillOpacity: 0.9,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="background: #12121a; color: white; padding: 12px; border-radius: 8px; font-family: system-ui; min-width: 150px;">
          <h3 style="margin: 0; color: #00f0ff; font-size: 14px;">${title}</h3>
        </div>
      `,
    });

    marker.addListener('click', () => {
      // Close previously opened InfoWindow
      if (activeInfoWindowRef.current) {
        activeInfoWindowRef.current.close();
      }

      // Open new InfoWindow and set it as active
      infoWindow.open(map, marker);
      activeInfoWindowRef.current = infoWindow;
    });

    markersRef.current.push(marker);
    return marker;
  }, []);

  const searchPlaces = useCallback(async (query: string, map: google.maps.Map): Promise<void> => {
    setIsSearching(true);

    // Increment search generation to invalidate stale callbacks
    if (!isPaginatingRef.current) {
      searchGenerationRef.current += 1;
    }
    const currentGeneration = searchGenerationRef.current;

    // ALWAYS clear on new search (unless paginating)
    if (!isPaginatingRef.current) {
      clearMarkers(); // Now handles everything: markers, heatmap, green zone
    }

    try {
      // Add to recent searches
      setRecentSearches((prev) => {
        const filtered = prev.filter((s) => s.toLowerCase() !== query.toLowerCase());
        return [query, ...filtered].slice(0, 10);
      });

      const service = new google.maps.places.PlacesService(map);

      // First try text search
      const request: google.maps.places.TextSearchRequest = {
        query,
        location: map.getCenter(),
        radius: 50000, // 50km radius
      };

      service.textSearch(request, (results, status, pagination) => {
        // Ignore stale callback from a previous search
        if (currentGeneration !== searchGenerationRef.current) {
          return;
        }

        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          // REMOVED 10-result limit - now shows all results
          const places: PlaceResult[] = results.map((place) => ({
            placeId: place.place_id || '',
            name: place.name || 'Unknown',
            address: place.formatted_address || '',
            location: {
              lat: place.geometry?.location?.lat() || 0,
              lng: place.geometry?.location?.lng() || 0,
            },
            rating: place.rating,
            userRatingsTotal: place.user_ratings_total,
            types: place.types,
            openNow: place.opening_hours?.isOpen?.(),
          }));

          // Store the count before updating for proper marker numbering
          const previousCount = isPaginatingRef.current ? markersRef.current.length : 0;

          // If paginating, append to existing results; otherwise replace
          if (isPaginatingRef.current) {
            setSearchResults((prev) => [...prev, ...places]);
            isPaginatingRef.current = false;
          } else {
            setSearchResults(places);
          }

          // Store pagination token
          if (pagination?.hasNextPage) {
            paginationRef.current = pagination;
            setNextPageToken('available');
          } else {
            paginationRef.current = null;
            setNextPageToken(null);
          }

          // Add markers for results
          const bounds = new google.maps.LatLngBounds();
          const startIndex = previousCount;
          places.forEach((place, index) => {
            const markerColor = getCategoryColor(place.types);

            const marker = new google.maps.Marker({
              position: place.location,
              map,
              title: place.name,
              animation: google.maps.Animation.DROP,
              label: {
                text: String(startIndex + index + 1),
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 'bold',
              },
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 14,
                fillColor: markerColor,
                fillOpacity: 0.9,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              },
            });

            const infoWindow = new google.maps.InfoWindow({
              content: '<div style="padding: 20px; color: white;">Loading details...</div>',
              maxWidth: 400,
            });

            marker.addListener('click', async () => {
              // Close previously opened InfoWindow
              if (activeInfoWindowRef.current) {
                activeInfoWindowRef.current.close();
              }

              // Open new InfoWindow and set it as active
              infoWindow.open(map, marker);
              activeInfoWindowRef.current = infoWindow;

              // Fetch full details
              const details = await getPlaceDetails(place.placeId, map);

              if (details) {
                infoWindow.setContent(renderRichInfoWindow(details));
              } else {
                infoWindow.setContent('<div style="padding: 20px; color: white;">Failed to load details</div>');
              }
            });

            markersRef.current.push(marker);
            bounds.extend(place.location);
          });

          // Clear old clusterer before creating new one (safety net)
          if (clustererRef.current) {
            clustererRef.current.clearMarkers();
            clustererRef.current = null;
          }

          // Create marker clusterer
          if (markersRef.current.length > 0) {
            clustererRef.current = new MarkerClusterer({
              map,
              markers: markersRef.current,
            });
          }

          // Fit map to show all results
          if (places.length > 0) {
            map.fitBounds(bounds);
            // Don't zoom in too much
            const listener = google.maps.event.addListener(map, 'idle', () => {
              const zoom = map.getZoom();
              if (zoom && zoom > 15) map.setZoom(15);
              google.maps.event.removeListener(listener);
            });
          }
        } else {
          setSearchResults([]);
          setNextPageToken(null);
          paginationRef.current = null;
        }
        setIsSearching(false);
      });
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setIsSearching(false);
      isPaginatingRef.current = false; // Reset flag on error
    }
  }, [clearMarkers, getPlaceDetails]);

  const loadMoreResults = useCallback(async (map: google.maps.Map): Promise<void> => {
    void map;
    if (!paginationRef.current || !paginationRef.current.hasNextPage) return;

    setIsSearching(true);
    isPaginatingRef.current = true;

    try {
      // nextPage() will trigger the same callback from the original textSearch
      paginationRef.current.nextPage();
    } catch (error) {
      console.error('Load more error:', error);
      setIsSearching(false);
      isPaginatingRef.current = false;
    }
  }, []);

  const getDirections = useCallback(async (
    origin: string,
    destination: string,
    map: google.maps.Map,
    travelMode: google.maps.TravelMode = google.maps.TravelMode.DRIVING
  ): Promise<void> => {
    setIsSearching(true);
    clearDirections();

    try {
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#00f0ff',
          strokeOpacity: 0.8,
          strokeWeight: 5,
        },
      });

      directionsRendererRef.current = directionsRenderer;

      const result = await directionsService.route({
        origin,
        destination,
        travelMode,
      });

      directionsRenderer.setDirections(result);
      setDirectionsResult(result);
    } catch (error) {
      console.error('Directions error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [clearDirections]);


  return {
    searchResults,
    isSearching,
    directionsResult,
    recentSearches,
    analysisCard,
    isAnalysisCardVisible,
    nextPageToken,
    hasMoreResults: nextPageToken !== null,
    searchPlaces,
    getDirections,
    clearSearchResults,
    clearDirections,
    toggleAnalysisCard,
    addMarker,
    clearMarkers,
    loadMoreResults,
  };
}
