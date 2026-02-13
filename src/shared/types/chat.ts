export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    analysisData?: AnalysisCardData;
}

export interface MarketZone {
    name: string;
    reason: string;
    count?: number;
    lat: number;
    lng: number;
    radius: number; // meters
    audienceFit?: "good" | "moderate" | "poor"; // how well the zone's demographics match the business
    audienceNote?: string; // brief explanation of target audience suitability
}

export interface TargetAudienceAnalysis {
    primaryAudience: string; // e.g. "Young professionals aged 25-35"
    incomeLevel: "low" | "middle" | "upper-middle" | "high"; // ideal customer income bracket
    ageRange: string; // e.g. "18-35"
    keyTraits: string[]; // e.g. ["health-conscious", "tech-savvy", "social media active"]
    idealAreaTraits: string[]; // e.g. ["near offices", "high foot traffic", "residential density"]
    avoidAreaTraits: string[]; // e.g. ["industrial zones", "low-income housing"]
}

export interface AnalysisCardData {
    businessType: string;
    location: string;
    redZones: MarketZone[];
    orangeZones: MarketZone[];
    greenZones: MarketZone[];
    recommendation: string;
    targetAudienceAnalysis?: TargetAudienceAnalysis;
}

export interface ChatContext {
    center?: { lat: number; lng: number };
    zoom?: number;
    lastSearchQuery?: string;
}

export interface ChatApiRequest {
    message: string;
    history: ChatMessage[];
    mapContext?: ChatContext;
}

export interface ChatApiResponse {
    intent: "search" | "directions" | "analyze" | "accessibility" | "chat";
    query: string | null;
    directions: { origin: string; destination: string } | null;
    reply: string;
    category?: string | null;
    location?: string | null;
}

export interface PlaceResult {
    placeId: string;
    name: string;
    address: string;
    location: { lat: number; lng: number };
    rating?: number;
    userRatingsTotal?: number;
    photos?: google.maps.places.PlacePhoto[];
    types?: string[];
    openNow?: boolean;
    priceLevel?: number;
    website?: string;
    phoneNumber?: string;
    openingHours?: google.maps.places.PlaceOpeningHours;
    reviews?: google.maps.places.PlaceReview[];
    businessStatus?: string;
    url?: string;
    category?: string;
    delivery?: boolean;
    takeout?: boolean;
    dineIn?: boolean;
    wheelchairAccessible?: boolean;
    outdoorSeating?: boolean;
    parkingOptions?: string[];
    paymentOptions?: string[];
    elevation?: number;
    airQualityIndex?: number;
    airQualityCategory?: string;
    timezone?: string;
    localTime?: string;
}
