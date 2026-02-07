'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, MoreVertical, ExternalLink, Copy, LogOut } from 'lucide-react';
import { loadGoogleMaps } from '@/utils/googleMaps';
import { DARK_MAP_STYLES, DEFAULT_CENTER, DEFAULT_ZOOM } from '@/constants/mapStyles';
import { PlaceResult } from '@/types/chat';

interface MapProps {
  onMapReady: (map: google.maps.Map) => void;
  searchResults?: PlaceResult[];
  directionsResult?: google.maps.DirectionsResult | null;
  hasMoreResults?: boolean;
  onLoadMore?: () => void;
  onStreetViewChange?: (isStreetView: boolean) => void;
}

export default function Map({ onMapReady, searchResults = [], directionsResult, hasMoreResults, onLoadMore, onStreetViewChange }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isStreetView, setIsStreetView] = useState(false);
  const [streetViewTitle, setStreetViewTitle] = useState('Street View');
  const [streetViewSubtitle, setStreetViewSubtitle] = useState('');
  const [streetViewCoords, setStreetViewCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isStreetViewMenuOpen, setIsStreetViewMenuOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

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
    setIsStreetViewMenuOpen(false);
  }, [streetViewCoords, streetViewTitle, streetViewSubtitle]);

  const copyStreetViewCoordinates = useCallback(async () => {
    if (!streetViewCoords) return;

    const value = `${streetViewCoords.lat.toFixed(6)}, ${streetViewCoords.lng.toFixed(6)}`;
    try {
      await navigator.clipboard.writeText(value);
      setCopyFeedback('Copied');
    } catch {
      setCopyFeedback('Copy failed');
    }

    setIsStreetViewMenuOpen(false);
    setTimeout(() => setCopyFeedback(''), 1200);
  }, [streetViewCoords]);

  const initMap = useCallback(async () => {
    if (!mapRef.current) return;

    try {
      setMapError(null);
      await loadGoogleMaps();

      const map = new google.maps.Map(mapRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        styles: DARK_MAP_STYLES,
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
          position: google.maps.ControlPosition.RIGHT_TOP,
        },
      });

      mapInstanceRef.current = map;

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
          setIsStreetViewMenuOpen(false);
          setCopyFeedback('');
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

  useEffect(() => {
    if (!isStreetViewMenuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsStreetViewMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsStreetViewMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isStreetViewMenuOpen]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-full relative"
    >
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: '100vh' }} />

      {/* Unified Street View header (arrow + location + actions in one bar) */}
      {isStreetView && (
        <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-auto sm:w-[420px] z-[100] h-[52px] bg-[#11151b]/95 backdrop-blur-sm rounded-[2px] shadow-lg border border-[#232a35] flex items-center overflow-visible">
          <button
            onClick={exitStreetView}
            className="h-full px-3 text-white hover:bg-white/5 transition-colors"
            title="Back to map"
            aria-label="Back to map"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="min-w-0 flex-1 px-1">
            <p className="text-white text-[17px] font-semibold leading-tight truncate">{streetViewTitle}</p>
            {streetViewSubtitle && (
              <p className="text-gray-300 text-[14px] leading-tight truncate">{streetViewSubtitle}</p>
            )}
          </div>

          <div className="h-7 w-px bg-white/20 mx-1" />

          <button
            onClick={openStreetViewInGoogleMaps}
            className="h-full px-2 text-white/80 hover:text-white hover:bg-white/5 transition-colors"
            title="Open this view in Google Maps"
            aria-label="Open this view in Google Maps"
          >
            <MapPin size={18} />
          </button>

          <div ref={menuRef} className="relative h-full">
            <button
              onClick={() => setIsStreetViewMenuOpen((prev) => !prev)}
              className="h-full px-2 pr-3 text-white/80 hover:text-white hover:bg-white/5 transition-colors"
              title="Street View options"
              aria-label="Street View options"
            >
              <MoreVertical size={18} />
            </button>

            {isStreetViewMenuOpen && (
              <div className="absolute top-[56px] right-0 w-56 bg-[#11151b] border border-[#232a35] rounded-md shadow-xl overflow-hidden">
                <button
                  onClick={openStreetViewInGoogleMaps}
                  className="w-full text-left px-3 py-2 text-sm text-gray-100 hover:bg-white/5 flex items-center gap-2"
                >
                  <ExternalLink size={14} />
                  Open in Google Maps
                </button>
                <button
                  onClick={copyStreetViewCoordinates}
                  disabled={!streetViewCoords}
                  className="w-full text-left px-3 py-2 text-sm text-gray-100 hover:bg-white/5 disabled:text-gray-500 disabled:hover:bg-transparent flex items-center gap-2"
                >
                  <Copy size={14} />
                  {streetViewCoords ? 'Copy coordinates' : 'Coordinates unavailable'}
                </button>
                <button
                  onClick={exitStreetView}
                  className="w-full text-left px-3 py-2 text-sm text-gray-100 hover:bg-white/5 flex items-center gap-2"
                >
                  <LogOut size={14} />
                  Exit Street View
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {copyFeedback && isStreetView && (
        <div className="absolute top-[60px] left-2 sm:left-3 z-[101] bg-[#11151b]/95 border border-[#232a35] rounded px-2 py-1 text-xs text-gray-100">
          {copyFeedback}
        </div>
      )}

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

      {/* Search results count indicator */}
      {searchResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="absolute bottom-4 right-4 bg-[#12121a]/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-cyan-500/30"
        >
          <p className="text-xs font-mono text-cyan-400">
            {searchResults.length} places found
          </p>
        </motion.div>
      )}

      {/* Load More Results Button */}
      {hasMoreResults && onLoadMore && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          onClick={onLoadMore}
          className="absolute bottom-16 right-4 bg-cyan-500 hover:bg-cyan-400 text-white font-medium px-4 py-2 rounded-lg shadow-lg transition-all hover:scale-105 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          Load More Results
        </motion.button>
      )}

      {/* Directions summary */}
      {directionsResult && directionsResult.routes[0] && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-4 left-4 bg-[#12121a]/90 backdrop-blur-sm px-4 py-3 rounded-lg border border-purple-500/30 max-w-xs"
        >
          <p className="text-xs font-medium text-purple-400 mb-1">Route</p>
          <p className="text-sm text-white">
            {directionsResult.routes[0].legs[0].distance?.text} · {directionsResult.routes[0].legs[0].duration?.text}
          </p>
          <p className="text-xs text-gray-400 mt-1 truncate">
            via {directionsResult.routes[0].summary}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
