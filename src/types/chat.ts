export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mapAction?: MapAction;
}

export interface MapAction {
  type: 'search' | 'directions' | 'marker' | 'zoom' | 'center' | 'heatmap' | 'greenZone' | 'analysisCard';
  data: SearchActionData | DirectionsActionData | MarkerActionData | ZoomActionData | CenterActionData | HeatmapActionData | GreenZoneActionData | AnalysisCardData;
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
  reply: string;
  mapAction?: MapAction;
  mapActions?: MapAction[];
}

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  rating?: number;
  userRatingsTotal?: number;
  photos?: string[];
  types?: string[];
  openNow?: boolean;
  priceLevel?: number;
}
