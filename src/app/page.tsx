'use client';

import { useState, useCallback } from 'react';
import { Menu } from 'lucide-react';
import Map from '@/components/Map';
import ChatSidebar from '@/components/ChatSidebar';
import { useChat } from '@/hooks/useChat';
import { useMapActions } from '@/hooks/useMapActions';
import { ChatContext } from '@/types/chat';

export default function Home() {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { messages, isLoading, sendMessage } = useChat();
  const {
    searchResults,
    isSearching,
    directionsResult,
    recentSearches,
    analysisCard,
    isAnalysisCardVisible,
    hasMoreResults,
    executeAction,
    searchPlaces,
    clearSearchResults,
    clearDirections,
    toggleAnalysisCard,
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
    const mapActions = await sendMessage(content, mapContext);

    // Execute all map actions returned by the AI
    if (mapActions && map) {
      for (const action of mapActions) {
        await executeAction(action, map);
      }
    }
  }, [sendMessage, getMapContext, map, executeAction]);

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
      {/* Sidebar Toggle Button - positioned to not overlap Street View panel */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-3 left-[200px] z-[100] w-10 h-10 bg-white hover:bg-gray-100 rounded-sm shadow-md flex items-center justify-center transition-all"
        >
          <Menu size={20} className="text-gray-700" />
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
      />

      {/* Map - Full Width */}
      <div className="w-full h-full">
        <Map
          onMapReady={handleMapReady}
          searchResults={searchResults}
          directionsResult={directionsResult}
          analysisCard={analysisCard}
          isAnalysisCardVisible={isAnalysisCardVisible}
          onToggleAnalysisCard={toggleAnalysisCard}
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
