import type { HeatmapConfig } from '../types/heatmap';

export const HEATMAP_GRADIENTS = {
  // Competition Density: Classic thermal — transparent → green → yellow → orange → red
  competition: [
    'rgba(0, 255, 255, 0)',       // Transparent
    'rgba(0, 255, 0, 0.2)',       // Faint green
    'rgba(0, 255, 0, 0.5)',       // Green
    'rgba(128, 255, 0, 0.6)',     // Yellow-green
    'rgba(255, 255, 0, 0.7)',     // Yellow
    'rgba(255, 200, 0, 0.8)',     // Gold
    'rgba(255, 128, 0, 0.9)',     // Orange
    'rgba(255, 64, 0, 0.95)',     // Red-orange
    'rgba(255, 0, 0, 1)',         // Red
    'rgba(200, 0, 0, 1)',         // Dark red (hotspot center)
  ],

  // Opportunity: Red (avoid) → Yellow → Bright Green (best opportunity)
  opportunity: [
    'rgba(0, 255, 0, 0)',         // Transparent
    'rgba(255, 0, 0, 0.3)',       // Faint red (low opportunity)
    'rgba(255, 64, 0, 0.4)',      // Red-orange
    'rgba(255, 128, 0, 0.5)',     // Orange
    'rgba(255, 200, 0, 0.6)',     // Gold
    'rgba(255, 255, 0, 0.7)',     // Yellow
    'rgba(128, 255, 0, 0.8)',     // Yellow-green
    'rgba(0, 255, 0, 0.9)',       // Green
    'rgba(0, 255, 64, 0.95)',     // Bright green
    'rgba(0, 255, 128, 1)',       // Emerald (best opportunity)
  ],

  // Environment Risk: Green (safe) → Yellow → Red (danger)
  environment: [
    'rgba(0, 255, 0, 0)',         // Transparent
    'rgba(0, 255, 0, 0.2)',       // Faint green
    'rgba(0, 255, 0, 0.5)',       // Green
    'rgba(128, 255, 0, 0.6)',     // Yellow-green
    'rgba(255, 255, 0, 0.7)',     // Yellow
    'rgba(255, 200, 0, 0.8)',     // Gold
    'rgba(255, 128, 0, 0.9)',     // Orange
    'rgba(255, 64, 0, 0.95)',     // Red-orange
    'rgba(255, 0, 0, 1)',         // Red
    'rgba(200, 0, 0, 1)',         // Dark red
  ],
};

export const DEFAULT_HEATMAP_CONFIG: HeatmapConfig = {
  mode: 'off',
  radius: 40,        // Moderate radius — Google handles interpolation
  opacity: 0.7,      // Slightly transparent for map visibility
  maxIntensity: 20,   // Low maxIntensity spreads color over larger area
  dissipating: true,
};
