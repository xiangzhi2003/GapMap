'use client';

import { useState, useCallback } from 'react';
import Map from '@/components/Map';
import ChatSidebar from '@/components/ChatSidebar';
import { useChat } from '@/hooks/useChat';
import { useMapActions } from '@/hooks/useMapActions';
import { ChatContext } from '@/types/chat';

export default function Home() {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { messages, isLoading, sendMessage } = useChat();
  const {
    searchResults,
    isSearching,
    directionsResult,
    recentSearches,
    analysisCard,
    isAnalysisCardVisible,
    executeAction,
    searchPlaces,
    clearSearchResults,
    clearDirections,
    toggleAnalysisCard,
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

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#0a0a0f]">
      <ChatSidebar
        messages={messages}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
        isSearching={isSearching}
        recentSearches={recentSearches}
      />
      <div className="flex-1 relative">
        <Map
          onMapReady={handleMapReady}
          searchResults={searchResults}
          directionsResult={directionsResult}
          analysisCard={analysisCard}
          isAnalysisCardVisible={isAnalysisCardVisible}
          onToggleAnalysisCard={toggleAnalysisCard}
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
