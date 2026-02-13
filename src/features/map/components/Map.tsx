'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react';
import { loadGoogleMaps } from '@/shared/utils/googleMaps';
import { LIGHT_MAP_STYLES, SATELLITE_MAP_STYLES, DEFAULT_CENTER, DEFAULT_ZOOM } from '@/shared/constants/mapStyles';
import { PlaceResult, AnalysisCardData } from '@/shared/types/chat';
import type { ZoneCluster } from '@/shared/utils/zoneClusterer';

interface MapProps {
  onMapReady: (map: google.maps.Map) => void;
  searchResults?: PlaceResult[];
  directionsResult?: google.maps.DirectionsResult | null;
  selectedRouteIndex?: number;
  onStreetViewChange?: (isStreetView: boolean) => void;
  zoneClusters?: ZoneCluster[];
  aiZones?: AnalysisCardData | null;
}

function ZoneComparisonTable({ clusters, aiZones }: { clusters: ZoneCluster[]; aiZones?: AnalysisCardData | null }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const levelColors: Record<string, string> = {
    red: '#ef4444',
    orange: '#f59e0b',
    green: '#22c55e',
  };

  const levelBadge = (level: string) => (
    <span
      style={{
        background: `${levelColors[level] || '#22c55e'}22`,
        color: levelColors[level] || '#22c55e',
        border: `1px solid ${levelColors[level] || '#22c55e'}44`,
      }}
      className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase"
    >
      {level === 'red' ? 'High' : level === 'orange' ? 'Mid' : 'Low'}
    </span>
  );

  // Use AI zones if available, otherwise fall back to clustering-based zones
  if (aiZones) {
    const allZones = [
      ...aiZones.redZones.map(z => ({ ...z, level: 'red' as const })),
      ...aiZones.orangeZones.map(z => ({ ...z, level: 'orange' as const })),
      ...aiZones.greenZones.map(z => ({ ...z, level: 'green' as const })),
    ];

    if (allZones.length === 0) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[95vw] max-w-[800px]"
        >
          <div className="bg-[#12121a]/95 backdrop-blur-xl border border-[#2a2a3a] rounded-xl shadow-2xl overflow-hidden">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  AI Zone Analysis
                </span>
                <span className="text-[10px] text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded">
                  {allZones.length} zones
                </span>
              </div>
              {isExpanded ? (
                <ChevronDown size={14} className="text-gray-400" />
              ) : (
                <ChevronUp size={14} className="text-gray-400" />
              )}
            </button>

            {isExpanded && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-x-auto"
              >
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-t border-[#2a2a3a] text-gray-500">
                      <th className="px-3 py-2 text-left font-medium">Zone</th>
                      <th className="px-3 py-2 text-center font-medium">Level</th>
                      <th className="px-3 py-2 text-center font-medium">Competitors</th>
                      <th className="px-3 py-2 text-left font-medium">AI Reasoning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allZones.map((z, i) => (
                      <tr key={`ai-zone-${i}`} className="border-t border-[#1a1a2e] hover:bg-white/5 transition-colors">
                        <td className="px-3 py-2 text-white font-medium truncate max-w-[160px]">{z.name}</td>
                        <td className="px-3 py-2 text-center">{levelBadge(z.level)}</td>
                        <td className="px-3 py-2 text-center text-gray-300">{z.count ?? 0}</td>
                        <td className="px-3 py-2 text-gray-400 text-[10px] max-w-[300px] truncate">{z.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Fallback: clustering-based zones
  if (clusters.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[95vw] max-w-[800px]"
      >
        <div className="bg-[#12121a]/95 backdrop-blur-xl border border-[#2a2a3a] rounded-xl shadow-2xl overflow-hidden">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Zone Comparison
              </span>
              <span className="text-[10px] text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded">
                {clusters.length} zones
              </span>
            </div>
            {isExpanded ? (
              <ChevronDown size={14} className="text-gray-400" />
            ) : (
              <ChevronUp size={14} className="text-gray-400" />
            )}
          </button>

          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-x-auto"
            >
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-t border-[#2a2a3a] text-gray-500">
                    <th className="px-3 py-2 text-left font-medium">Zone</th>
                    <th className="px-3 py-2 text-center font-medium">Level</th>
                    <th className="px-3 py-2 text-center font-medium">Count</th>
                    <th className="px-3 py-2 text-center font-medium">Density</th>
                    <th className="px-3 py-2 text-center font-medium">Strength</th>
                    <th className="px-3 py-2 text-center font-medium">Avg Rating</th>
                    <th className="px-3 py-2 text-center font-medium">Reviews</th>
                  </tr>
                </thead>
                <tbody>
                  {clusters
                    .sort((a, b) => b.competitorStrength - a.competitorStrength)
                    .map((c) => (
                    <tr key={c.id} className="border-t border-[#1a1a2e] hover:bg-white/5 transition-colors">
                      <td className="px-3 py-2 text-white font-medium truncate max-w-[140px]">{c.areaName}</td>
                      <td className="px-3 py-2 text-center">{levelBadge(c.level)}</td>
                      <td className="px-3 py-2 text-center text-gray-300">{c.placeCount}</td>
                      <td className="px-3 py-2 text-center">
                        <span className="text-cyan-400 font-mono">{c.competitionDensity}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span style={{ color: c.competitorStrength > 60 ? '#ef4444' : c.competitorStrength > 30 ? '#f59e0b' : '#22c55e' }} className="font-mono">
                          {c.competitorStrength}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-gray-300">{c.averageRating.toFixed(1)}★</td>
                      <td className="px-3 py-2 text-center text-gray-300">{c.totalReviews.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Map({
  onMapReady,
  searchResults = [],
  directionsResult,
  selectedRouteIndex = 0,
  onStreetViewChange,
  zoneClusters = [],
  aiZones = null,
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<HTMLDivElement>(null);
  const miniMapInstanceRef = useRef<google.maps.Map | null>(null);
  const miniMapMarkerRef = useRef<google.maps.Marker | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const routeInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isStreetView, setIsStreetView] = useState(false);
  const [streetViewTitle, setStreetViewTitle] = useState('Street View');
  const [streetViewSubtitle, setStreetViewSubtitle] = useState('');
  const [streetViewCoords, setStreetViewCoords] = useState<{ lat: number; lng: number } | null>(null);

  const exitStreetView = useCallback(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.getStreetView().setVisible(false);
  }, []);

  const openStreetViewInGoogleMaps = useCallback(() => {
    const query = [streetViewTitle, streetViewSubtitle].filter(Boolean).join(', ');
    const mapsUrl = streetViewCoords
      ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${streetViewCoords.lat},${streetViewCoords.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || 'Street View')}`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  }, [streetViewCoords, streetViewTitle, streetViewSubtitle]);

  const initMap = useCallback(async () => {
    if (!mapRef.current) return;

    try {
      setMapError(null);
      await loadGoogleMaps();

      const map = new google.maps.Map(mapRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        styles: LIGHT_MAP_STYLES,
        // Clamp to Web Mercator bounds to avoid empty pole bands.
        restriction: {
          latLngBounds: {
            north: 85,
            south: -85,
            west: -180,
            east: 180,
          },
          strictBounds: true,
        },
        // Enable all standard Google Maps controls
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        scaleControl: true,
        rotateControl: true,
        // Smooth gestures and interactions
        gestureHandling: 'greedy',
        scrollwheel: true,
        draggable: true,
        keyboardShortcuts: true,
        clickableIcons: true,
        // Control positions
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_CENTER,
        },
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: google.maps.ControlPosition.TOP_RIGHT,
          mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'],
        },
        streetViewControlOptions: {
          position: google.maps.ControlPosition.RIGHT_CENTER,
        },
        fullscreenControlOptions: {
          position: google.maps.ControlPosition.RIGHT_CENTER,
        },
      });

      mapInstanceRef.current = map;

      // Listen for map type changes and apply appropriate styles
      map.addListener('maptypeid_changed', () => {
        const mapType = map.getMapTypeId();
        if (mapType === 'satellite' || mapType === 'hybrid') {
          map.setOptions({ styles: SATELLITE_MAP_STYLES });
        } else {
          map.setOptions({ styles: LIGHT_MAP_STYLES });
        }
      });

      // Configure Street View controls position
      const streetView = map.getStreetView();
      streetView.setOptions({
        // Hide separate native controls; render a unified custom header instead.
        enableCloseButton: false,
        addressControl: false,
        fullscreenControl: false,
      });

      const updateStreetViewLocation = () => {
        const location = streetView.getLocation();
        const description = location?.description?.trim() || '';
        const shortDescription = location?.shortDescription?.trim() || '';
        const position = streetView.getPosition();

        let title = description;
        let subtitle = shortDescription;

        if (!title && subtitle) {
          title = subtitle;
          subtitle = '';
        }

        if (title && !subtitle && title.includes(',')) {
          const [first, ...rest] = title.split(',');
          title = first.trim();
          subtitle = rest.join(',').trim();
        }

        if (title && subtitle && title.toLowerCase() === subtitle.toLowerCase()) {
          subtitle = '';
        }

        setStreetViewTitle(title || 'Street View');
        setStreetViewSubtitle(subtitle);
        setStreetViewCoords(position ? { lat: position.lat(), lng: position.lng() } : null);
      };

      // Listen for Street View visibility changes
      streetView.addListener('visible_changed', () => {
        const visible = streetView.getVisible();
        setIsStreetView(visible);
        onStreetViewChange?.(visible);
        if (visible) {
          updateStreetViewLocation();
        } else {
          setStreetViewTitle('Street View');
          setStreetViewSubtitle('');
          setStreetViewCoords(null);
        }
      });

      streetView.addListener('position_changed', updateStreetViewLocation);
      streetView.addListener('pano_changed', updateStreetViewLocation);

      onMapReady(map);
    } catch (error) {
      console.error('Failed to initialize map:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load Google Maps. Check console for details.';
      setMapError(errorMessage);
    }
  }, [onMapReady, onStreetViewChange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void initMap();
    }, 0);

    return () => clearTimeout(timer);
  }, [initMap]);

  // Mini-map for Street View — shows current position on a small overview map
  useEffect(() => {
    if (!isStreetView || !streetViewCoords || !miniMapRef.current) {
      // Clean up when leaving Street View
      if (miniMapMarkerRef.current) {
        miniMapMarkerRef.current.setMap(null);
        miniMapMarkerRef.current = null;
      }
      miniMapInstanceRef.current = null;
      return;
    }

    const pos = streetViewCoords;

    // Initialize mini-map if not yet created
    if (!miniMapInstanceRef.current) {
      miniMapInstanceRef.current = new google.maps.Map(miniMapRef.current, {
        center: pos,
        zoom: 16,
        disableDefaultUI: true,
        gestureHandling: 'none',
        clickableIcons: false,
        styles: LIGHT_MAP_STYLES,
      });

      miniMapMarkerRef.current = new google.maps.Marker({
        map: miniMapInstanceRef.current,
        position: pos,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#FBBC04',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 3,
        },
      });
    } else {
      // Update existing mini-map position
      miniMapInstanceRef.current.panTo(pos);
      if (miniMapMarkerRef.current) {
        miniMapMarkerRef.current.setPosition(pos);
      }
    }
  }, [isStreetView, streetViewCoords]);

  // Show route info as an InfoWindow anchored to the route midpoint
  useEffect(() => {
    // Clean up previous route info window
    if (routeInfoWindowRef.current) {
      routeInfoWindowRef.current.close();
      routeInfoWindowRef.current = null;
    }

    const map = mapInstanceRef.current;
    if (!map || !directionsResult?.routes[selectedRouteIndex]) return;

    const selectedRoute = directionsResult.routes[selectedRouteIndex];
    const leg = selectedRoute.legs[0];
    const steps = leg.steps;

    // Find the midpoint of the route by walking halfway through the total distance
    const totalDistance = leg.distance?.value || 0;
    const halfDistance = totalDistance / 2;
    let accumulated = 0;
    let midpoint: google.maps.LatLng | null = null;

    for (const step of steps) {
      const stepDist = step.distance?.value || 0;
      if (accumulated + stepDist >= halfDistance) {
        // Interpolate within this step
        const ratio = stepDist > 0 ? (halfDistance - accumulated) / stepDist : 0;
        const path = step.path;
        if (path && path.length >= 2) {
          const segIndex = Math.min(Math.floor(ratio * (path.length - 1)), path.length - 2);
          const segRatio = (ratio * (path.length - 1)) - segIndex;
          const p1 = path[segIndex];
          const p2 = path[segIndex + 1];
          midpoint = new google.maps.LatLng(
            p1.lat() + (p2.lat() - p1.lat()) * segRatio,
            p1.lng() + (p2.lng() - p1.lng()) * segRatio
          );
        } else {
          midpoint = step.start_location;
        }
        break;
      }
      accumulated += stepDist;
    }

    if (!midpoint) {
      midpoint = leg.start_location;
    }

    // Build clean Google Maps-style route label
    const distance = leg.distance?.text || '';
    const duration = leg.duration?.text || '';

    const carSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" fill="#333"/></svg>';

    const content = `<div style="background:#fff;color:#1a1a1a;padding:6px 10px;border-radius:8px;font-family:Roboto,Arial,sans-serif;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.3);line-height:1.4;display:inline-flex;align-items:center;gap:6px;">
      ${carSvg}
      <div>
        <div style="font-size:13px;font-weight:700;">${duration}</div>
        <div style="font-size:11px;color:#70757a;">${distance}</div>
      </div>
    </div>`;

    const infoWindow = new google.maps.InfoWindow({
      content,
      position: midpoint,
      pixelOffset: new google.maps.Size(0, -8),
      disableAutoPan: true,
    });

    infoWindow.open(map);
    routeInfoWindowRef.current = infoWindow;

    // Remove default InfoWindow chrome (white bg, close button, arrow)
    google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
      document.querySelectorAll('.gm-ui-hover-effect').forEach(btn => {
        (btn as HTMLElement).style.display = 'none';
      });
      document.querySelectorAll('.gm-style-iw, .gm-style-iw-c, .gm-style-iw-d').forEach(el => {
        const e = el as HTMLElement;
        e.style.background = 'transparent';
        e.style.boxShadow = 'none';
        e.style.padding = '0';
        e.style.overflow = 'visible';
        e.style.maxWidth = 'none';
        e.style.maxHeight = 'none';
      });
      document.querySelectorAll('.gm-style-iw-tc, .gm-style-iw-t::after').forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
    });

    return () => {
      infoWindow.close();
      routeInfoWindowRef.current = null;
    };
  }, [directionsResult, selectedRouteIndex]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-full relative"
    >
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: '100vh' }} />

      {/* Enhanced Street View header - Google Maps style */}
      {isStreetView && (
        <div className="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-[360px] z-[100] bg-[#202124]/95 backdrop-blur-md rounded-lg shadow-2xl flex items-stretch overflow-visible">
          {/* Back button */}
          <button
            onClick={exitStreetView}
            className="flex items-center justify-center w-12 text-white/90 hover:bg-white/10 transition-colors rounded-l-lg"
            title="Back to map"
            aria-label="Back to map"
          >
            <ArrowLeft size={22} strokeWidth={2} />
          </button>

          {/* Location info - main content */}
          <div className="flex-1 py-3 pr-4 min-w-0">
            {/* Main title */}
            <h2 className="text-white text-[15px] font-medium leading-snug truncate">
              {streetViewTitle}
            </h2>
            {/* Subtitle - location details */}
            {streetViewSubtitle && (
              <p className="text-[#9aa0a6] text-[13px] leading-snug truncate mt-0.5">
                {streetViewSubtitle}
              </p>
            )}
            {/* Google Street View branding */}
            <div className="flex items-center gap-1.5 mt-1.5">
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-[#4285f4]"
                fill="currentColor"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <span className="text-[#9aa0a6] text-[12px] font-normal">Google Street View</span>
            </div>
          </div>

          {/* Right side - Location pin button */}
          <button
            onClick={openStreetViewInGoogleMaps}
            className="flex items-center justify-center w-12 text-[#8ab4f8] hover:bg-white/10 transition-colors border-l border-white/10 rounded-r-lg"
            title="Open in Google Maps"
            aria-label="Open in Google Maps"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </button>
        </div>
      )}

      {/* Mini-map during Street View */}
      <AnimatePresence>
        {isStreetView && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-6 left-6 z-[100] w-[200px] h-[150px] rounded-lg overflow-hidden border-2 border-white/30 shadow-2xl"
          >
            <div ref={miniMapRef} className="w-full h-full" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message overlay */}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0f]/95 p-8">
          <div className="max-w-md bg-[#12121a] border border-red-500/30 rounded-xl p-6 text-center">
            <div className="text-4xl mb-4">🗺️</div>
            <h2 className="text-xl font-bold text-red-400 mb-3">Map Loading Error</h2>
            <p className="text-sm text-gray-300 mb-4">{mapError}</p>
            <div className="text-xs text-gray-500 space-y-1 text-left bg-[#0a0a0f] p-3 rounded">
              <p><strong>Common fixes:</strong></p>
              <p>1. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to Vercel env vars</p>
              <p>2. Enable Maps JavaScript API in Google Cloud Console</p>
              <p>3. Add your domain to API key restrictions</p>
              <p>4. Check browser console (F12) for specific error</p>
            </div>
          </div>
        </div>
      )}

      {/* Zone Comparison Table */}
      {(aiZones || zoneClusters.length > 0) && <ZoneComparisonTable clusters={zoneClusters} aiZones={aiZones} />}

      {/* Search results count indicator */}
      {searchResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="absolute bottom-6 right-15 bg-[#12121a]/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-cyan-500/30"
        >
          <p className="text-xs font-mono text-cyan-400">
            {searchResults.length} places found
          </p>
        </motion.div>
      )}


      {/* Route info is now shown as a map InfoWindow at the route midpoint */}
    </motion.div>
  );
}
