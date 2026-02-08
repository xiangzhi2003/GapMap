'use client';

import { useState, useCallback } from 'react';
import { Menu } from 'lucide-react';
import { Map, useMapActions } from '@/features/map';
import { ChatSidebar, useChat } from '@/features/chat';
import { ChatContext } from '@/shared/types/chat';

export default function Home() {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const {
    searchResults,
    isSearching,
    directionsResult,
    recentSearches,
    hasMoreResults,
    routeAnalysis,
    searchPlaces,
    getDirections,
    analyzeAccessibility,
    clearSearchResults,
    clearDirections,
    loadMoreResults,
  } = useMapActions();

  const handleMapReady = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const getMapContext = useCallback((): ChatContext | undefined => {
    if (!map) return undefined;
    const center = map.getCenter();
    return {
      center: center ? { lat: center.lat(), lng: center.lng() } : undefined,
      zoom: map.getZoom(),
    };
  }, [map]);

  const handleSendMessage = useCallback(async (content: string) => {
    const mapContext = getMapContext();
    const result = await sendMessage(content, mapContext);

    // Handle intent-based actions
    if (result && map) {
      if ((result.intent === 'search' || result.intent === 'analyze') && result.query) {
        clearSearchResults();
        clearDirections();
        await searchPlaces(result.query, map);
      } else if (result.intent === 'directions' && result.directions) {
        clearSearchResults();
        clearDirections();
        await getDirections(result.directions.origin, result.directions.destination, map);
      } else if (result.intent === 'accessibility' && result.query) {
        clearSearchResults();
        clearDirections();
        await analyzeAccessibility(result.query, map);
      }
      // If intent === 'chat', do nothing with map
    }
  }, [sendMessage, getMapContext, map, clearSearchResults, clearDirections, searchPlaces, getDirections, analyzeAccessibility]);

  const handleSearch = useCallback(async (query: string) => {
    if (map) {
      clearDirections();
      await searchPlaces(query, map);
    }
  }, [map, searchPlaces, clearDirections]);

  const handleClearSearch = useCallback(() => {
    clearSearchResults();
    clearDirections();
  }, [clearSearchResults, clearDirections]);

  const handleClearMap = useCallback(() => {
    clearSearchResults(); // Clears markers
    clearDirections();     // Clears directions
  }, [clearSearchResults, clearDirections]);

  const handleNewChat = useCallback(() => {
    clearMessages();
    clearSearchResults();
    clearDirections();
  }, [clearMessages, clearSearchResults, clearDirections]);

  const handleLoadMore = useCallback(async () => {
    if (map) {
      await loadMoreResults(map);
    }
  }, [map, loadMoreResults]);

  const handleStreetViewChange = useCallback((inStreetView: boolean) => {
    // Auto-hide sidebar when entering Street View (like Google Maps)
    if (inStreetView) {
      setIsSidebarOpen(false);
    }
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#0a0a0f]">
      {/* Sidebar Toggle Button - always at left side */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-4 left-4 z-[100] w-10 h-10 bg-[#12121a]/90 backdrop-blur-sm border border-[#2a2a3a] rounded-lg flex items-center justify-center hover:bg-[#1a1a25] hover:border-cyan-500/30 transition-all duration-300 ease-out"
        >
          <Menu size={20} className="text-white" />
        </button>
      )}

      {/* Sidebar Overlay */}
      <ChatSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        messages={messages}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
        isSearching={isSearching}
        recentSearches={recentSearches}
        onClearMap={handleClearMap}
        onNewChat={handleNewChat}
        hasMarkers={searchResults.length > 0}
        hasDirections={directionsResult !== null}
      />

      {/* Map - Full Width */}
      <div className="w-full h-full">
        <Map
          onMapReady={handleMapReady}
          searchResults={searchResults}
          directionsResult={directionsResult}
          routeAnalysis={routeAnalysis}
          hasMoreResults={hasMoreResults}
          onLoadMore={handleLoadMore}
          onStreetViewChange={handleStreetViewChange}
        />

        {/* Overlay gradient for visual effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#0a0a0f]/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0a0a0f]/50 to-transparent" />
        </div>
      </div>
    </main>
  );
}
