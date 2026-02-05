'use client';

import { useEffect, useRef, useCallback } from 'react';
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
  onCloseAnalysisCard?: () => void;
}

export default function Map({ onMapReady, searchResults = [], directionsResult, analysisCard, onCloseAnalysisCard }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  const initMap = useCallback(async () => {
    if (!mapRef.current) return;

    try {
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
      onMapReady(map);
    } catch (error) {
      console.error('Failed to initialize map:', error);
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

      {/* Analysis Card */}
      {analysisCard && onCloseAnalysisCard && (
        <AnalysisCard data={analysisCard} onClose={onCloseAnalysisCard} />
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
