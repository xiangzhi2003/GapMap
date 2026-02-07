'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { loadGoogleMaps } from '@/utils/googleMaps';
import { DARK_MAP_STYLES, DEFAULT_CENTER, DEFAULT_ZOOM } from '@/constants/mapStyles';
import { PlaceResult, AnalysisCardData } from '@/types/chat';
import AnalysisCard from './AnalysisCard';

interface MapProps {
  onMapReady: (map: google.maps.Map) => void;
  searchResults?: PlaceResult[];
  directionsResult?: google.maps.DirectionsResult | null;
  analysisCard?: AnalysisCardData | null;
  isAnalysisCardVisible?: boolean;
  onToggleAnalysisCard?: () => void;
  hasMoreResults?: boolean;
  onLoadMore?: () => void;
  onStreetViewChange?: (isStreetView: boolean) => void;
}

export default function Map({ onMapReady, searchResults = [], directionsResult, analysisCard, isAnalysisCardVisible, onToggleAnalysisCard, hasMoreResults, onLoadMore, onStreetViewChange }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

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

      // Listen for Street View visibility changes
      const streetView = map.getStreetView();
      streetView.addListener('visible_changed', () => {
        onStreetViewChange?.(streetView.getVisible());
      });

      onMapReady(map);
    } catch (error) {
      console.error('Failed to initialize map:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load Google Maps. Check console for details.';
      setMapError(errorMessage);
    }
  }, [onMapReady]);

  useEffect(() => {
    initMap();
  }, [initMap]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-full relative"
    >
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: '100vh' }} />

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

      {/* Analysis Card */}
      {analysisCard && isAnalysisCardVisible && onToggleAnalysisCard && (
        <AnalysisCard data={analysisCard} onClose={onToggleAnalysisCard} />
      )}

      {/* Toggle Analysis Card Button - shows when there's data but card is hidden */}
      {analysisCard && !isAnalysisCardVisible && onToggleAnalysisCard && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          onClick={onToggleAnalysisCard}
          className="absolute bottom-6 left-6 z-10 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 transition-all hover:scale-105"
          title="Show Market Analysis"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
          Show Analysis
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
