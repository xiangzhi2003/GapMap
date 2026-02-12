'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { PlaceResult } from '@/shared/types/chat';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { renderRichInfoWindow } from '@/shared/utils/infoWindowRenderer';
import { getCategoryColor } from '@/shared/utils/markerIcons';
import { getElevation } from '@/shared/utils/elevation';
import { getAirQuality } from '@/shared/utils/airQuality';
import { getTimezone } from '@/shared/utils/timezone';
import { calculateAccessibility, type AccessibilityAnalysis } from '@/shared/utils/distanceMatrix';
import { reverseGeocode, forwardGeocode, extractLocationFromQuery } from '@/shared/utils/geocoding';
import { getAdvancedRoutes, type AdvancedRouteResult } from '@/shared/utils/routes';
import {
  calculateCompetitionWeights,
  calculateOpportunityWeights,
  calculateEnvironmentWeights,
} from '@/shared/utils/heatmapCalculator';
import { HEATMAP_GRADIENTS, DEFAULT_HEATMAP_CONFIG } from '@/shared/constants/heatmapGradients';
import type { HeatmapMode, WeightedPoint, HeatmapConfig } from '@/shared/types/heatmap';

interface UseMapActionsResult {
  searchResults: PlaceResult[];
  isSearching: boolean;
  directionsResult: google.maps.DirectionsResult | null;
  recentSearches: string[];
  hasMoreResults: boolean;
  selectedRouteIndex: number;
  searchPlaces: (query: string, map: google.maps.Map, structured?: { category?: string | null; location?: string | null }) => Promise<void>;
  getDirections: (origin: string, destination: string, map: google.maps.Map, travelMode?: google.maps.TravelMode) => Promise<void>;
  analyzeAccessibility: (query: string, map: google.maps.Map) => Promise<void>;
  clearSearchResults: () => void;
  clearDirections: () => void;
  loadMoreResults: (map: google.maps.Map) => Promise<void>;
  heatmapMode: HeatmapMode;
  setHeatmapMode: (mode: HeatmapMode) => void;
  updateHeatmapLayer: (places: PlaceResult[], mode: HeatmapMode, map: google.maps.Map) => void;
  showMarkersWithHeatmap: boolean;
  setShowMarkersWithHeatmap: (show: boolean) => void;
}

export function useMapActions(): UseMapActionsResult {
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [placeDetailsCache, setPlaceDetailsCache] = useState<Record<string, PlaceResult>>({});
  const [accessibilityResult, setAccessibilityResult] = useState<AccessibilityAnalysis | null>(null);
  const [routeAnalysis, setRouteAnalysis] = useState<AdvancedRouteResult | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('off');
  const [heatmapConfig, setHeatmapConfig] = useState<HeatmapConfig>(DEFAULT_HEATMAP_CONFIG);
  const [showMarkersWithHeatmap, setShowMarkersWithHeatmap] = useState(true);
  const isPaginatingRef = useRef<boolean>(false);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const greenZoneMarkerRef = useRef<google.maps.Marker | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const paginationRef = useRef<google.maps.places.PlaceSearchPagination | null>(null);
  const activeInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const searchGenerationRef = useRef<number>(0);
  const altPolylinesRef = useRef<google.maps.Polyline[]>([]);
  const altLabelsRef = useRef<google.maps.InfoWindow[]>([]);

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
    altPolylinesRef.current.forEach(p => p.setMap(null));
    altPolylinesRef.current = [];
    altLabelsRef.current.forEach(label => label.close());
    altLabelsRef.current = [];
    setSelectedRouteIndex(0);
    setDirectionsResult(null);
    setRouteAnalysis(null);
  }, []);

  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
    setNextPageToken(null);
    paginationRef.current = null;
    setAccessibilityResult(null);
    clearMarkers();
  }, [clearMarkers]);


  /**
   * Enrich a PlaceResult with elevation, air quality, and timezone data.
   * Called when a user clicks a marker to view details.
   */
  const enrichPlaceWithEnvironmentData = useCallback(async (
    details: PlaceResult
  ): Promise<PlaceResult> => {
    const { lat, lng } = details.location;

    // Fetch environment data in parallel (non-blocking, best-effort)
    const [elevation, airQuality, timezone] = await Promise.allSettled([
      getElevation(lat, lng),
      getAirQuality(lat, lng),
      getTimezone(lat, lng),
    ]);

    const enriched = { ...details };

    if (elevation.status === 'fulfilled' && elevation.value !== null) {
      enriched.elevation = elevation.value;
    }

    if (airQuality.status === 'fulfilled' && airQuality.value) {
      enriched.airQualityIndex = airQuality.value.aqi;
      enriched.airQualityCategory = airQuality.value.category;
    }

    if (timezone.status === 'fulfilled' && timezone.value) {
      enriched.timezone = timezone.value.timeZoneId;
      enriched.localTime = timezone.value.localTime;
    }

    return enriched;
  }, []);

  /**
   * Sort places by review count (market presence proxy)
   * Higher review count = stronger market presence
   */
  function sortPlacesByReviewCount(places: PlaceResult[]): PlaceResult[] {
    return places.sort((a, b) => {
      const reviewsA = a.userRatingsTotal || 0;
      const reviewsB = b.userRatingsTotal || 0;
      return reviewsB - reviewsA; // Descending
    });
  }

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
            'reviews', 'business_status', 'url', 'place_id',
            // Places API (New) fields — available when New API is enabled
            'delivery', 'takeout', 'dine_in',
            'wheelchair_accessible_entrance',
          ]
        },
        async (place, status) => {
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
              // Places API (New) enhanced fields
              delivery: (place as Record<string, unknown>).delivery as boolean | undefined,
              takeout: (place as Record<string, unknown>).takeout as boolean | undefined,
              dineIn: (place as Record<string, unknown>).dine_in as boolean | undefined,
              wheelchairAccessible: (place as Record<string, unknown>).wheelchair_accessible_entrance as boolean | undefined,
            };

            // Enrich with environment data (elevation, AQI, timezone)
            const enriched = await enrichPlaceWithEnvironmentData(details);

            // Cache the enriched result
            setPlaceDetailsCache(prev => ({ ...prev, [placeId]: enriched }));
            resolve(enriched);
          } else {
            resolve(null);
          }
        }
      );
    });
  }, [placeDetailsCache, enrichPlaceWithEnvironmentData]);

  /**
   * Update heatmap layer based on mode and places
   * Uses dense grid generation for full area coverage
   */
  const updateHeatmapLayer = useCallback((
    places: PlaceResult[],
    mode: HeatmapMode,
    map: google.maps.Map
  ) => {
    // Clear existing heatmap
    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
      heatmapRef.current = null;
    }

    if (mode === 'off' || places.length === 0) return;

    // Use actual place locations as data points — let Google's HeatmapLayer
    // handle smooth interpolation (produces classic heatmap blobs like Google Maps)
    let weightedPoints: WeightedPoint[];

    if (mode === 'environment') {
      weightedPoints = calculateEnvironmentWeights(places);
    } else if (mode === 'opportunity') {
      weightedPoints = calculateOpportunityWeights(places);
    } else {
      weightedPoints = calculateCompetitionWeights(places);
    }

    // Zoom-adaptive radius for natural-looking heatmap blobs
    const zoom = map.getZoom() || 14;
    let radius: number;
    if (zoom >= 18) radius = 50;
    else if (zoom >= 16) radius = 40;
    else if (zoom >= 14) radius = 30;
    else if (zoom >= 12) radius = 25;
    else radius = 20;

    // Create heatmap layer — classic style with smooth color blobs
    const heatmap = new google.maps.visualization.HeatmapLayer({
      data: weightedPoints,
      radius,
      opacity: heatmapConfig.opacity,
      gradient: HEATMAP_GRADIENTS[mode],
      dissipating: true,
      maxIntensity: heatmapConfig.maxIntensity,
    });

    heatmap.setMap(map);
    heatmapRef.current = heatmap;

    // Optionally hide markers when heatmap is active
    if (!showMarkersWithHeatmap) {
      clustererRef.current?.clearMarkers();
    }
  }, [heatmapConfig, showMarkersWithHeatmap]);

  const searchPlaces = useCallback(async (query: string, map: google.maps.Map, structured?: { category?: string | null; location?: string | null }): Promise<void> => {
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

    // Smart Global Search: Pan map to location BEFORE searching
    if (structured?.location && !isPaginatingRef.current) {
      try {
        const geocodeResult = await forwardGeocode(structured.location);
        if (geocodeResult?.geometry?.location) {
          const targetLatLng = new google.maps.LatLng(
            geocodeResult.geometry.location.lat(),
            geocodeResult.geometry.location.lng()
          );
          map.panTo(targetLatLng);
          map.setZoom(14); // Standard city-level view
          // Wait for map animation to complete
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (geocodeError) {
        console.warn('Geocoding failed, continuing with search:', geocodeError);
        // Continue with search even if geocoding fails
      }
    }

    try {
      // Add to recent searches
      setRecentSearches((prev) => {
        const filtered = prev.filter((s) => s.toLowerCase() !== query.toLowerCase());
        return [query, ...filtered].slice(0, 10);
      });

      const service = new google.maps.places.PlacesService(map);

      // Extract location from query for smart filtering
      const targetLocation = extractLocationFromQuery(query);
      let locationBounds: google.maps.LatLngBounds | undefined;
      let targetLocationName: string | null = null;

      // If a specific location is mentioned, geocode it to get precise bounds
      if (targetLocation) {
        const geocodeResult = await forwardGeocode(targetLocation);
        if (geocodeResult?.geometry?.viewport) {
          locationBounds = geocodeResult.geometry.viewport;
          // Extract the locality/sublocality for filtering
          const locality = geocodeResult.address_components?.find(c =>
            c.types.includes('locality') || c.types.includes('sublocality')
          );
          targetLocationName = locality?.long_name?.toLowerCase() || targetLocation.toLowerCase();
        }
      }

      // Build search request with location bias
      const request: google.maps.places.TextSearchRequest = {
        query,
        ...(locationBounds ? {
          bounds: locationBounds,
        } : {
          location: map.getCenter(),
          radius: 50000, // 50km radius fallback
        }),
      };

      service.textSearch(request, (results, status, pagination) => {
        // Ignore stale callback from a previous search
        if (currentGeneration !== searchGenerationRef.current) {
          return;
        }

        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          // Map results to PlaceResult format
          let places: PlaceResult[] = results.map((place) => ({
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

          // SMART RANKING: Sort by review count before displaying
          places = sortPlacesByReviewCount(places);

          // SMART LOCATION FILTERING: Only show results from the requested area
          if (targetLocationName) {
            places = places.filter((place) => {
              const address = place.address.toLowerCase();
              const vicinity = results.find(r => r.place_id === place.placeId)?.vicinity?.toLowerCase() || '';

              // Check if the place's address contains the target location
              return address.includes(targetLocationName!) || vicinity.includes(targetLocationName!);
            });
          }

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
              zIndex: 1000 - (startIndex + index), // Higher rank = higher z-index
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

              // Center map on marker with offset so InfoWindow is visible
              const markerPos = marker.getPosition();
              if (markerPos) {
                // Offset upward so the InfoWindow content appears centered on screen
                const projection = map.getProjection();
                if (projection) {
                  const point = projection.fromLatLngToPoint(markerPos);
                  if (point) {
                    const scale = Math.pow(2, map.getZoom() || 15);
                    // Shift down by 150px worth of map coordinates so marker+infowindow centers on screen
                    point.y -= 150 / scale;
                    const offsetPos = projection.fromPointToLatLng(point);
                    if (offsetPos) {
                      map.panTo(offsetPos);
                    }
                  }
                } else {
                  map.panTo(markerPos);
                }
              }

              // Open new InfoWindow and set it as active
              infoWindow.open(map, marker);
              activeInfoWindowRef.current = infoWindow;

              // Fetch full details (now enriched with elevation, AQI, timezone)
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

          // Auto-generate heatmap if mode is active
          if (heatmapMode !== 'off' && places.length > 0) {
            updateHeatmapLayer(places, heatmapMode, map);
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
  }, [clearMarkers, getPlaceDetails, heatmapMode, updateHeatmapLayer]);

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

  const drawAlternativeRoutes = useCallback((
    map: google.maps.Map,
    routes: google.maps.DirectionsRoute[],
    activeIndex: number
  ) => {
    // Clear previous alternative polylines and labels
    altPolylinesRef.current.forEach(p => p.setMap(null));
    altPolylinesRef.current = [];
    altLabelsRef.current.forEach(label => label.close());
    altLabelsRef.current = [];

    if (routes.length <= 1) return;

    routes.forEach((route, index) => {
      if (index === activeIndex) return;

      const path = route.overview_path;
      if (!path || path.length === 0) return;

      const polyline = new google.maps.Polyline({
        path,
        strokeColor: '#808080',
        strokeOpacity: 0.5,
        strokeWeight: 5,
        clickable: true,
        zIndex: 1,
        map,
      });

      polyline.addListener('click', () => {
        setSelectedRouteIndex(index);
      });

      altPolylinesRef.current.push(polyline);

      // Add Google Maps-style label at route midpoint
      const leg = route.legs[0];
      const duration = leg.duration?.text || '';
      const distance = leg.distance?.text || '';
      const midIndex = Math.floor(path.length / 2);
      const midpoint = path[midIndex];

      if (midpoint && duration) {
        const carSvg = '<svg width="16" height="16" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" fill="#666"/></svg>';

        const label = new google.maps.InfoWindow({
          content: `<div style="background:#fff;color:#1a1a1a;padding:5px 8px;border-radius:8px;font-family:Roboto,Arial,sans-serif;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.3);line-height:1.4;display:inline-flex;align-items:center;gap:5px;cursor:pointer;">
            ${carSvg}
            <div>
              <div style="font-size:12px;font-weight:700;color:#70757a;">${duration}</div>
              <div style="font-size:10px;color:#9aa0a6;">${distance}</div>
            </div>
          </div>`,
          position: midpoint,
          disableAutoPan: true,
        });

        label.open(map);

        google.maps.event.addListenerOnce(label, 'domready', () => {
          document.querySelectorAll('.gm-ui-hover-effect').forEach(btn => {
            (btn as HTMLElement).style.display = 'none';
          });
          document.querySelectorAll('.gm-style-iw, .gm-style-iw-c, .gm-style-iw-d').forEach(el => {
            const e = el as HTMLElement;
            e.style.background = 'transparent';
            e.style.boxShadow = 'none';
            e.style.padding = '0';
            e.style.overflow = 'visible';
          });
          document.querySelectorAll('.gm-style-iw-tc').forEach(el => {
            (el as HTMLElement).style.display = 'none';
          });
        });

        altLabelsRef.current.push(label);
      }
    });
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
      // Use standard Directions API for map rendering
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
        provideRouteAlternatives: true,
      });

      directionsRenderer.setDirections(result);
      setDirectionsResult(result);

      // Draw alternative routes as gray polylines
      if (result.routes.length > 1) {
        drawAlternativeRoutes(map, result.routes, 0);
      }

      // Also fetch advanced route info (alternatives) via Routes API
      const routeMode = travelMode === google.maps.TravelMode.WALKING ? 'WALK'
        : travelMode === google.maps.TravelMode.BICYCLING ? 'BICYCLE'
        : travelMode === google.maps.TravelMode.TRANSIT ? 'TRANSIT'
        : 'DRIVE';
      const advancedRoutes = await getAdvancedRoutes(origin, destination, routeMode);
      if (advancedRoutes) {
        setRouteAnalysis(advancedRoutes);
      }
    } catch (error) {
      console.error('Directions error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [clearDirections, drawAlternativeRoutes]);

  // Re-draw alternative polylines when selected route changes
  useEffect(() => {
    if (!directionsRendererRef.current || !directionsResult || directionsResult.routes.length <= 1) return;

    const map = directionsRendererRef.current.getMap();
    if (!map) return;

    directionsRendererRef.current.setRouteIndex(selectedRouteIndex);
    drawAlternativeRoutes(map as google.maps.Map, directionsResult.routes, selectedRouteIndex);
  }, [selectedRouteIndex, directionsResult, drawAlternativeRoutes]);

  /**
   * Analyze accessibility for a location using Distance Matrix API.
   * Searches for the query first to find the target location, then calculates
   * travel times from surrounding areas.
   */
  const analyzeAccessibility = useCallback(async (
    query: string,
    map: google.maps.Map
  ): Promise<void> => {
    setIsSearching(true);
    setAccessibilityResult(null);

    try {
      // First, search for the place to get coordinates
      await searchPlaces(query, map);

      // Wait briefly for search results to populate
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get the center of the map (which was fitted to search results)
      const center = map.getCenter();
      if (!center) {
        setIsSearching(false);
        return;
      }

      const targetLat = center.lat();
      const targetLng = center.lng();

      // Get a readable address for the target
      const address = await reverseGeocode(targetLat, targetLng);

      // Calculate accessibility from surrounding areas
      const analysis = await calculateAccessibility(
        { lat: targetLat, lng: targetLng },
        address || query
      );

      setAccessibilityResult(analysis);
    } catch (error) {
      console.error('Accessibility analysis error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchPlaces]);

  return {
    searchResults,
    isSearching,
    directionsResult,
    recentSearches,
    hasMoreResults: nextPageToken !== null,
    selectedRouteIndex,
    searchPlaces,
    getDirections,
    analyzeAccessibility,
    clearSearchResults,
    clearDirections,
    loadMoreResults,
    heatmapMode,
    setHeatmapMode,
    updateHeatmapLayer,
    showMarkersWithHeatmap,
    setShowMarkersWithHeatmap,
  };
}
