"use client";

import { useState, useCallback, useEffect } from "react";
import { Menu, PanelRightOpen } from "lucide-react";
import { Map, ResultsPanel, useMapActions } from "@/features/map";
import { ChatSidebar, useChat, useMarketAnalysis } from "@/features/chat";
import {
    ChatContext,
    ChatMessage,
    AnalysisCardData,
} from "@/shared/types/chat";

export default function Home() {
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiZones, setAiZones] = useState<AnalysisCardData | null>(null);
    const [isResultsPanelOpen, setIsResultsPanelOpen] = useState(false);

    const { messages, isLoading, sendMessage, addMessage, clearMessages } =
        useChat();
    const { analyzeMarket } = useMarketAnalysis();
    const {
        searchResults,
        isSearching,
        directionsResult,
        recentSearches,
        selectedRouteIndex,
        searchPlaces,
        getDirections,
        analyzeAccessibility,
        clearSearchResults,
        clearDirections,
        setHeatmapMode,
        zoneClusters,
        renderAIZones,
        triggerMarkerClick,
    } = useMapActions();

    const handleMapReady = useCallback((mapInstance: google.maps.Map) => {
        setMap(mapInstance);
    }, []);

    const getMapContext = useCallback((): ChatContext | undefined => {
        if (!map) return undefined;
        const center = map.getCenter();
        return {
            center: center
                ? { lat: center.lat(), lng: center.lng() }
                : undefined,
            zoom: map.getZoom(),
        };
    }, [map]);

    const handleSendMessage = useCallback(
        async (content: string) => {
            const mapContext = getMapContext();
            const result = await sendMessage(content, mapContext);

            // Handle intent-based actions
            if (result && map) {
                if (
                    (result.intent === "search" ||
                        result.intent === "analyze") &&
                    result.query
                ) {
                    clearSearchResults();
                    clearDirections();
                    setAiZones(null);
                    const places = await searchPlaces(result.query, map, {
                        category: result.category,
                        location: result.location,
                    });

                    // Auto-open results panel when results are found
                    if (places.length > 0) {
                        setIsResultsPanelOpen(true);
                    }

                    // Trigger market analysis for "analyze" intent
                    if (result.intent === "analyze") {
                        if (places.length === 0) {
                            addMessage({
                                id: `analysis-fallback-${Date.now()}`,
                                role: "assistant",
                                content: `I couldn't find any ${
                                    result.category || "business"
                                } competitors in ${
                                    result.location || "this area"
                                }. Try a different location or business type.`,
                                timestamp: new Date(),
                            });
                        } else {
                            setHeatmapMode("competition");
                            setIsAnalyzing(true);
                            try {
                                const analysis = await analyzeMarket(
                                    places,
                                    result.category || "business",
                                    result.location || "this area",
                                    content
                                );

                                if (analysis) {
                                    renderAIZones(analysis.analysis, map);
                                    setAiZones(analysis.analysis);

                                    const analysisMessage: ChatMessage = {
                                        id: `analysis-${Date.now()}`,
                                        role: "assistant",
                                        content: "", // Content is displayed via the MarketAnalysisCard, not as text
                                        timestamp: new Date(),
                                        analysisData: analysis.analysis,
                                    };

                                    addMessage(analysisMessage);
                                } else {
                                    addMessage({
                                        id: `analysis-error-${Date.now()}`,
                                        role: "assistant",
                                        content:
                                            "Market analysis failed. Please try again.",
                                        timestamp: new Date(),
                                    });
                                }
                            } finally {
                                setIsAnalyzing(false);
                            }
                        }
                    }
                } else if (
                    result.intent === "directions" &&
                    result.directions
                ) {
                    clearSearchResults();
                    clearDirections();
                    await getDirections(
                        result.directions.origin,
                        result.directions.destination,
                        map
                    );
                } else if (result.intent === "accessibility" && result.query) {
                    clearSearchResults();
                    clearDirections();
                    await analyzeAccessibility(result.query, map);
                }
                // If intent === 'chat', do nothing with map
            }
        },
        [
            sendMessage,
            getMapContext,
            map,
            clearSearchResults,
            clearDirections,
            searchPlaces,
            getDirections,
            analyzeAccessibility,
            analyzeMarket,
            addMessage,
            setHeatmapMode,
            renderAIZones,
        ]
    );

    const handleSearch = useCallback(
        async (query: string) => {
            if (map) {
                clearDirections();
                await searchPlaces(query, map);
            }
        },
        [map, searchPlaces, clearDirections]
    );

    const handleClearSearch = useCallback(() => {
        clearSearchResults();
        clearDirections();
    }, [clearSearchResults, clearDirections]);

    const handleClearMap = useCallback(() => {
        clearSearchResults();
        clearDirections();
        setAiZones(null);
        setIsResultsPanelOpen(false);
    }, [clearSearchResults, clearDirections]);

    const handleNewChat = useCallback(() => {
        clearMessages();
        clearSearchResults();
        clearDirections();
        setAiZones(null);
        setIsResultsPanelOpen(false);
    }, [clearMessages, clearSearchResults, clearDirections]);

    const handlePlaceClick = useCallback(
        (placeId: string, location: { lat: number; lng: number }) => {
            if (!map) return;
            map.panTo(location);
            map.setZoom(16);
            triggerMarkerClick(placeId);
        },
        [map, triggerMarkerClick]
    );

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
            const prompt =
                level === "green"
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

            {/* Results Panel Toggle Button - right side */}
            {!isResultsPanelOpen && searchResults.length > 0 && (
                <button
                    onClick={() => setIsResultsPanelOpen(true)}
                    className="absolute top-35 right-2.5 z-[100] w-10 h-10 bg-[#12121a]/90 backdrop-blur-sm border border-[#2a2a3a] rounded-lg flex items-center justify-center hover:bg-[#1a1a25] hover:border-cyan-500/30 transition-all duration-300 ease-out"
                >
                    <PanelRightOpen size={20} className="text-white" />
                </button>
            )}

            {/* Results Panel - Right side */}
            <ResultsPanel
                results={searchResults}
                aiZones={aiZones}
                isVisible={isResultsPanelOpen}
                onClose={() => setIsResultsPanelOpen(false)}
                onPlaceClick={handlePlaceClick}
            />

            {/* Map - Full Width */}
            <div className="w-full h-full">
                <Map
                    onMapReady={handleMapReady}
                    searchResults={searchResults}
                    directionsResult={directionsResult}
                    selectedRouteIndex={selectedRouteIndex}
                    onStreetViewChange={handleStreetViewChange}
                    zoneClusters={zoneClusters}
                    aiZones={aiZones}
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
