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

// Grid configuration for dense heatmap sampling
export interface GridConfig {
  cellsPerSide: number;     // Grid dimensions (e.g., 20 = 20×20 = 400 cells)
  minCellSize: number;      // Minimum cell size in meters (e.g., 200m)
  maxCellSize: number;      // Maximum cell size in meters (e.g., 500m)
  idwPower: number;         // Inverse distance weighting power (default: 2)
  idwSmoothing: number;     // Distance smoothing to prevent division by zero (default: 100m)
}

// Default grid configuration
export const DEFAULT_GRID_CONFIG: GridConfig = {
  cellsPerSide: 25,         // 25×25 = 625 grid points (good balance)
  minCellSize: 150,         // 150m minimum spacing (street-level detail)
  maxCellSize: 800,         // 800m maximum spacing (city-level overview)
  idwPower: 2,              // Quadratic distance decay
  idwSmoothing: 100,        // 100m smoothing radius
};
