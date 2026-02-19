"use client";

import { useState, useCallback, useEffect } from "react";
import { Menu, PanelRightOpen } from "lucide-react";
import { type User } from "firebase/auth";
import { Map, ResultsPanel, useMapActions } from "@/features/map";
import { ChatSidebar, useChat, useMarketAnalysis } from "@/features/chat";
import { useAuth, LoginScreen } from "@/features/auth";
import { SessionProvider, useSession } from "@/features/sessions";
import {
    ChatContext,
    ChatMessage,
    AnalysisCardData,
} from "@/shared/types/chat";

// ─── Loading screen shown while auth state is resolving ───────────────────────
function LoadingScreen() {
    return (
        <main className="h-screen w-screen bg-[#0a0a0f] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />
                <p className="text-xs text-gray-500">Loading GapMap…</p>
            </div>
        </main>
    );
}

// ─── Main app content — only rendered when authenticated ──────────────────────
interface HomeContentProps {
    user: User;
    onSignOut: () => Promise<void>;
}

function HomeContent({ user, onSignOut }: HomeContentProps) {
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiZones, setAiZones] = useState<AnalysisCardData | null>(null);
    const [isResultsPanelOpen, setIsResultsPanelOpen] = useState(false);

    const {
        messages,
        addMessage,
        startNewSession,
        loadSession,
        deleteSession,
        sessions,
        isLoadingSessions,
        currentSessionId,
    } = useSession();

    const { isLoading, sendMessage, addMessage: chatAddMessage } = useChat({
        messages,
        onMessageAdd: addMessage,
    });

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

    const handleClearMap = useCallback(() => {
        clearSearchResults();
        clearDirections();
        setAiZones(null);
        setIsResultsPanelOpen(false);
    }, [clearSearchResults, clearDirections]);

    const handleSendMessage = useCallback(
        async (content: string) => {
            const mapContext = getMapContext();
            const result = await sendMessage(content, mapContext);

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

                    if (places.length > 0) {
                        setIsResultsPanelOpen(true);
                    }

                    if (result.intent === "analyze") {
                        if (places.length === 0) {
                            chatAddMessage({
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

                                    chatAddMessage({
                                        id: `analysis-${Date.now()}`,
                                        role: "assistant",
                                        content: "",
                                        timestamp: new Date(),
                                        analysisData: analysis.analysis,
                                    });
                                } else {
                                    chatAddMessage({
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
            chatAddMessage,
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

    const handleNewChat = useCallback(() => {
        startNewSession();
        clearSearchResults();
        clearDirections();
        setAiZones(null);
        setIsResultsPanelOpen(false);
    }, [startNewSession, clearSearchResults, clearDirections]);

    const handleLoadSession = useCallback(
        async (sessionId: string) => {
            await loadSession(sessionId);
            handleClearMap();
        },
        [loadSession, handleClearMap]
    );

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
            {/* Sidebar Toggle Button */}
            {!isSidebarOpen && (
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="absolute top-4 left-4 z-[100] w-10 h-10 bg-[#12121a]/90 backdrop-blur-sm border border-[#2a2a3a] rounded-lg flex items-center justify-center hover:bg-[#1a1a25] hover:border-cyan-500/30 transition-all duration-300 ease-out"
                >
                    <Menu size={20} className="text-white" />
                </button>
            )}

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
                user={user}
                sessions={sessions}
                isLoadingSessions={isLoadingSessions}
                currentSessionId={currentSessionId}
                onLoadSession={handleLoadSession}
                onDeleteSession={deleteSession}
                onSignOut={onSignOut}
            />

            {/* Results Panel Toggle */}
            {!isResultsPanelOpen && searchResults.length > 0 && (
                <button
                    onClick={() => setIsResultsPanelOpen(true)}
                    className="absolute top-35 right-2.5 z-[100] w-10 h-10 bg-[#12121a]/90 backdrop-blur-sm border border-[#2a2a3a] rounded-lg flex items-center justify-center hover:bg-[#1a1a25] hover:border-cyan-500/30 transition-all duration-300 ease-out"
                >
                    <PanelRightOpen size={20} className="text-white" />
                </button>
            )}

            <ResultsPanel
                results={searchResults}
                aiZones={aiZones}
                isVisible={isResultsPanelOpen}
                onClose={() => setIsResultsPanelOpen(false)}
                onPlaceClick={handlePlaceClick}
            />

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

                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#0a0a0f]/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0a0a0f]/50 to-transparent" />
                </div>
            </div>
        </main>
    );
}

// ─── Root page — handles auth gating ─────────────────────────────────────────
export default function Home() {
    const { user, loading, signOut } = useAuth();

    if (loading) return <LoadingScreen />;
    if (!user) return <LoginScreen />;

    return (
        <SessionProvider userId={user.uid}>
            <HomeContent user={user} onSignOut={signOut} />
        </SessionProvider>
    );
}
