export type HeatmapMode = 'competition' | 'opportunity' | 'environment' | 'off';

export interface WeightedPoint {
  location: google.maps.LatLng;
  weight: number;  // 0-100 normalized
}

export interface HeatmapConfig {
  mode: HeatmapMode;
  radius: number;          // Pixels (20-50)
  opacity: number;         // 0-1
  maxIntensity: number;    // Color scaling (50-100)
  dissipating: boolean;    // true = smooth gradient
}

export interface HeatmapZoneAnalysis {
  location: google.maps.LatLng;
  competitionLevel: 'low' | 'medium' | 'high';
  competitionScore: number;  // 0-100
  nearestCompetitors: Array<{
    name: string;
    distance: number;  // meters
    rating?: number;
    reviews?: number;
  }>;
  environmentData?: {
    elevation?: number;
    aqi?: number;
    floodRisk?: 'low' | 'medium' | 'high';
  };
  recommendation: string;  // AI-generated or static
}
