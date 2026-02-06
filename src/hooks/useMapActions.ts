'use client';

import { useState, useCallback, useRef } from 'react';
import { MapAction, SearchActionData, DirectionsActionData, MarkerActionData, ZoomActionData, CenterActionData, HeatmapActionData, GreenZoneActionData, AnalysisCardData, PlaceResult, MultiSearchActionData } from '@/types/chat';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { renderRichInfoWindow } from '@/utils/infoWindowRenderer';
import { getCategoryColor, CATEGORY_COLORS } from '@/utils/markerIcons';

interface UseMapActionsResult {
  searchResults: PlaceResult[];
  isSearching: boolean;
  directionsResult: google.maps.DirectionsResult | null;
  recentSearches: string[];
  analysisCard: AnalysisCardData | null;
  isAnalysisCardVisible: boolean;
  nextPageToken: string | null;
  hasMoreResults: boolean;
  executeAction: (action: MapAction, map: google.maps.Map) => Promise<void>;
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
  const [analysisCard, setAnalysisCard] = useState<AnalysisCardData | null>(null);
  const [isAnalysisCardVisible, setIsAnalysisCardVisible] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [placeDetailsCache, setPlaceDetailsCache] = useState<Record<string, PlaceResult>>({});
  const markersRef = useRef<google.maps.Marker[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const greenZoneMarkerRef = useRef<google.maps.Marker | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const paginationRef = useRef<google.maps.places.PlaceSearchPagination | null>(null);

  const clearMarkers = useCallback(() => {
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current = null;
    }
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
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
    clearMarkers();
  }, [clearMarkers]);

  const clearHeatmap = useCallback(() => {
    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
      heatmapRef.current = null;
    }
  }, []);

  const toggleAnalysisCard = useCallback(() => {
    setIsAnalysisCardVisible((prev) => !prev);
  }, []);

  const showHeatmap = useCallback((points: { lat: number; lng: number; weight: number; label?: string }[], map: google.maps.Map) => {
    clearHeatmap();

    const weightedLocations: google.maps.visualization.WeightedLocation[] = points.map((p) => ({
      location: new google.maps.LatLng(p.lat, p.lng),
      weight: p.weight,
    }));

    const heatmapLayer = new google.maps.visualization.HeatmapLayer({
      data: weightedLocations,
      map,
      gradient: [
        'rgba(0, 0, 0, 0)',
        'rgba(255, 165, 0, 0.6)',
        'rgba(255, 69, 0, 0.8)',
        'rgba(220, 0, 0, 1)',
      ],
      radius: 80,
      opacity: 0.6,
    });

    heatmapRef.current = heatmapLayer;

    // Fit map to show all heatmap points
    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
    map.fitBounds(bounds);
  }, [clearHeatmap]);

  const showGreenZone = useCallback((lat: number, lng: number, title: string, reason: string, map: google.maps.Map) => {
    // Remove previous green zone marker if any
    if (greenZoneMarkerRef.current) {
      greenZoneMarkerRef.current.setMap(null);
      greenZoneMarkerRef.current = null;
    }

    const marker = new google.maps.Marker({
      position: { lat, lng },
      map,
      title,
      animation: google.maps.Animation.DROP,
      icon: {
        path: 'M12 2C6.48 2 2 6.48 2 12c0 5.33 10 10 10 10s10-4.67 10-10c0-5.52-4.48-10-10-10zm0 13.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z',
        fillColor: '#FFD700',
        fillOpacity: 1,
        strokeColor: '#FFA500',
        strokeWeight: 2,
        scale: 2.2,
        anchor: new google.maps.Point(12, 22),
      },
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="background: #12121a; color: white; padding: 14px; border-radius: 8px; font-family: system-ui; min-width: 200px; border: 1px solid #22c55e;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 18px;">⭐</span>
            <h3 style="margin: 0; color: #22c55e; font-size: 15px;">${title}</h3>
          </div>
          <p style="margin: 0 0 6px; font-size: 11px; color: #22c55e; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Green Zone — Opportunity</p>
          <p style="margin: 0; font-size: 13px; color: #ccc;">${reason}</p>
        </div>
      `,
    });

    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });

    greenZoneMarkerRef.current = marker;

    // Pan map to this location (with slight delay so heatmap fit completes first)
    setTimeout(() => {
      map.panTo({ lat, lng });
    }, 600);
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
      infoWindow.open(map, marker);
    });

    markersRef.current.push(marker);
    return marker;
  }, []);

  const searchPlaces = useCallback(async (query: string, map: google.maps.Map): Promise<void> => {
    setIsSearching(true);
    clearMarkers();

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

          setSearchResults(places);

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
          places.forEach((place, index) => {
            const markerColor = getCategoryColor(place.types);

            const marker = new google.maps.Marker({
              position: place.location,
              map,
              title: place.name,
              animation: google.maps.Animation.DROP,
              label: {
                text: String(index + 1),
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
              infoWindow.open(map, marker);

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
    }
  }, [clearMarkers, getPlaceDetails]);

  const loadMoreResults = useCallback(async (map: google.maps.Map): Promise<void> => {
    if (!paginationRef.current || !paginationRef.current.hasNextPage) return;

    setIsSearching(true);

    try {
      paginationRef.current.nextPage();

      // The nextPage() call will trigger another callback with more results
      // We need to wait a bit for the API
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Load more error:', error);
    } finally {
      setIsSearching(false);
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

  const executeAction = useCallback(async (action: MapAction, map: google.maps.Map): Promise<void> => {
    switch (action.type) {
      case 'search': {
        const data = action.data as SearchActionData;
        const query = data.location ? `${data.query} in ${data.location}` : data.query;
        await searchPlaces(query, map);
        break;
      }
      case 'directions': {
        const data = action.data as DirectionsActionData;
        const travelMode = google.maps.TravelMode[data.travelMode || 'DRIVING'];
        await getDirections(data.origin, data.destination, map, travelMode);
        break;
      }
      case 'marker': {
        const data = action.data as MarkerActionData;
        addMarker(data.lat, data.lng, data.title || 'Marker', map);
        map.panTo({ lat: data.lat, lng: data.lng });
        map.setZoom(15);
        break;
      }
      case 'zoom': {
        const data = action.data as ZoomActionData;
        map.setZoom(data.level);
        break;
      }
      case 'center': {
        const data = action.data as CenterActionData;
        map.panTo({ lat: data.lat, lng: data.lng });
        break;
      }
      case 'heatmap': {
        const data = action.data as HeatmapActionData;
        showHeatmap(data.points, map);
        break;
      }
      case 'greenZone': {
        const data = action.data as GreenZoneActionData;
        showGreenZone(data.lat, data.lng, data.title, data.reason, map);
        break;
      }
      case 'analysisCard': {
        const data = action.data as AnalysisCardData;
        setAnalysisCard(data);
        setIsAnalysisCardVisible(true);
        break;
      }
      case 'multiSearch': {
        const data = action.data as MultiSearchActionData;
        clearMarkers();

        const allResults: PlaceResult[] = [];

        for (const type of data.types) {
          const service = new google.maps.places.PlacesService(map);
          const request = {
            query: `${data.query} ${type}`,
            location: data.location ? undefined : map.getCenter(),
            radius: 50000,
          };

          await new Promise<void>((resolve) => {
            service.textSearch(request, (results, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                const places = results.slice(0, 20).map(place => ({
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
                  category: type,  // Tag with category
                }));
                allResults.push(...places);
              }
              resolve();
            });
          });
        }

        setSearchResults(allResults);

        // Create markers with category-based colors
        const bounds = new google.maps.LatLngBounds();
        allResults.forEach((place, index) => {
          const markerColor = place.category ? (CATEGORY_COLORS[place.category] || CATEGORY_COLORS.default) : getCategoryColor(place.types);

          const marker = new google.maps.Marker({
            position: place.location,
            map,
            title: place.name,
            animation: google.maps.Animation.DROP,
            label: {
              text: String(index + 1),
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
            infoWindow.open(map, marker);

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

        // Create marker clusterer
        if (markersRef.current.length > 0) {
          clustererRef.current = new MarkerClusterer({
            map,
            markers: markersRef.current,
          });
        }

        // Fit map to show all results
        if (allResults.length > 0) {
          map.fitBounds(bounds);
          const listener = google.maps.event.addListener(map, 'idle', () => {
            const zoom = map.getZoom();
            if (zoom && zoom > 15) map.setZoom(15);
            google.maps.event.removeListener(listener);
          });
        }
        break;
      }
    }
  }, [searchPlaces, getDirections, addMarker, showHeatmap, showGreenZone, clearMarkers, getPlaceDetails]);

  return {
    searchResults,
    isSearching,
    directionsResult,
    recentSearches,
    analysisCard,
    isAnalysisCardVisible,
    nextPageToken,
    hasMoreResults: nextPageToken !== null,
    executeAction,
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
