import type { HeatmapConfig } from '../types/heatmap';

export const HEATMAP_GRADIENTS = {
  // Competition Density: Green (low) → Red (saturated)
  competition: [
    'rgba(0, 255, 0, 0)',      // Transparent green at 0%
    'rgba(255, 255, 0, 0.7)',  // Yellow at 33%
    'rgba(255, 128, 0, 0.9)',  // Orange at 66%
    'rgba(255, 0, 0, 1)',      // Red at 100%
  ],

  // Opportunity: Red (avoid) → Bright Green (best opportunity)
  opportunity: [
    'rgba(255, 0, 0, 0)',      // Transparent red at 0%
    'rgba(255, 255, 0, 0.7)',  // Yellow at 33%
    'rgba(0, 255, 0, 0.9)',    // Green at 66%
    'rgba(0, 255, 128, 1)',    // Bright green at 100%
  ],

  // Environment Risk: Green (safe) → Red (danger)
  environment: [
    'rgba(0, 255, 0, 0)',      // Transparent green at 0%
    'rgba(255, 255, 0, 0.7)',  // Yellow at 33%
    'rgba(255, 128, 0, 0.9)',  // Orange at 66%
    'rgba(255, 0, 0, 1)',      // Red at 100%
  ],
};

export const DEFAULT_HEATMAP_CONFIG: HeatmapConfig = {
  mode: 'off',
  radius: 30,
  opacity: 0.7,
  maxIntensity: 80,
  dissipating: true,
};
