'use client';

import { useState, useCallback, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Map, useMapActions } from '@/features/map';
import { ChatSidebar, useChat, useMarketAnalysis } from '@/features/chat';
import { ChatContext, ChatMessage } from '@/shared/types/chat';


export default function Home() {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { messages, isLoading, sendMessage, addMessage, clearMessages } = useChat();
  const { analyzeMarket } = useMarketAnalysis();
  const {
    searchResults,
    isSearching,
    directionsResult,
    recentSearches,
    hasMoreResults,
    selectedRouteIndex,
    searchPlaces,
    getDirections,
    analyzeAccessibility,
    clearSearchResults,
    clearDirections,
    loadMoreResults,
    heatmapMode,
    setHeatmapMode,
    updateZoneOverlays,
    zoneClusters,
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
        const places = await searchPlaces(result.query, map, {
          category: result.category,
          location: result.location
        });

        // Trigger market analysis for "analyze" intent
        if (result.intent === 'analyze' && places.length > 0) {
          // Auto-enable competition heatmap: red = saturated, green = gap/opportunity
          setHeatmapMode('competition');
          updateZoneOverlays(places, 'competition', map);

          setIsAnalyzing(true);
          try {
            const analysis = await analyzeMarket(
              places,
              result.category || 'business',
              result.location || 'this area',
              content
            );

            if (analysis) {
              const analysisMessage: ChatMessage = {
                id: `analysis-${Date.now()}`,
                role: 'assistant',
                content: analysis.insights,
                timestamp: new Date(),
                analysisData: analysis.analysis,
              };

              addMessage(analysisMessage);
            }
          } finally {
            setIsAnalyzing(false);
          }
        }
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
  }, [sendMessage, getMapContext, map, clearSearchResults, clearDirections, searchPlaces, getDirections, analyzeAccessibility, analyzeMarket, addMessage, setHeatmapMode, updateZoneOverlays]);

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

  // Global callback for AI Zone Deep-Dive button in InfoWindows
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__analyzeZone = (
      areaName: string,
      level: string,
      placeCount: number,
      strength: number
    ) => {
      const prompt = level === 'green'
        ? `Analyze this market gap opportunity in ${areaName}. This is a green zone with no nearby competitors. What type of business would thrive here? Consider demographics, foot traffic, and local demand. Provide specific actionable recommendations.`
        : `Deep-dive analysis of ${areaName} zone (${level} competition, ${placeCount} competitors, competitor strength ${strength}/100). What are the weaknesses of existing businesses? What service gaps exist? How can a new entrant differentiate and succeed? Give specific strategic advice.`;

      setIsSidebarOpen(true);
      handleSendMessage(prompt);
    };
    return () => {
      delete (window as unknown as Record<string, unknown>).__analyzeZone;
    };
  }, [handleSendMessage]);

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
        isAnalyzing={isAnalyzing}
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
          selectedRouteIndex={selectedRouteIndex}
          hasMoreResults={hasMoreResults}
          onLoadMore={handleLoadMore}
          onStreetViewChange={handleStreetViewChange}
          showZoneLegend={heatmapMode !== 'off'}
          zoneClusters={zoneClusters}
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
