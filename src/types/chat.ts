export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface MapAction {
  type: 'search' | 'directions' | 'marker' | 'zoom' | 'center' | 'heatmap' | 'greenZone' | 'analysisCard' | 'multiSearch' | 'clearTopic';
  data: SearchActionData | DirectionsActionData | MarkerActionData | ZoomActionData | CenterActionData | HeatmapActionData | GreenZoneActionData | AnalysisCardData | MultiSearchActionData | ClearTopicActionData;
}

export interface SearchActionData {
  query: string;
  location?: string;
}

export interface DirectionsActionData {
  origin: string;
  destination: string;
  travelMode?: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
}

export interface MarkerActionData {
  lat: number;
  lng: number;
  title?: string;
}

export interface ZoomActionData {
  level: number;
}

export interface CenterActionData {
  lat: number;
  lng: number;
}

export interface HeatmapActionData {
  points: { lat: number; lng: number; weight: number; label?: string }[];
}

export interface GreenZoneActionData {
  lat: number;
  lng: number;
  title: string;
  reason: string;
}

export interface AnalysisZone {
  name: string;
  reason: string;
  count?: number;
}

export interface AnalysisCardData {
  businessType: string;
  location: string;
  redZones: AnalysisZone[];
  orangeZones: AnalysisZone[];
  greenZones: AnalysisZone[];
  recommendation: string;
}

export interface MultiSearchActionData {
  query: string;
  location?: string;
  types: string[];  // e.g., ['restaurant', 'cafe', 'bar']
}

export interface ClearTopicActionData {
  newTopic: string;
  reason: string;
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
  intent: 'search' | 'directions' | 'analyze' | 'chat';
  query: string | null;
  directions: { origin: string; destination: string } | null;
  reply: string;
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
  // NEW FIELDS for rich InfoWindows:
  website?: string;
  phoneNumber?: string;
  openingHours?: google.maps.places.PlaceOpeningHours;
  reviews?: google.maps.places.PlaceReview[];
  businessStatus?: string;
  url?: string;  // Google Maps link
  category?: string;  // For multi-category searches
}
