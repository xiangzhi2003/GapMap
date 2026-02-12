import type { HeatmapConfig } from '../types/heatmap';

// Competition density gradient: green (few) → yellow (moderate) → red (many competitors)
// Used for business analysis — shows where market is saturated vs. where gaps exist
export const HEATMAP_GRADIENTS = {
  competition: [
    'rgba(0, 255, 0, 0)',         // Transparent (no data)
    'rgba(0, 200, 0, 0.4)',       // Green (1 competitor — good gap)
    'rgba(100, 220, 0, 0.5)',     // Light green
    'rgba(200, 255, 0, 0.6)',     // Yellow-green
    'rgba(255, 255, 0, 0.7)',     // Yellow (moderate competition)
    'rgba(255, 200, 0, 0.75)',    // Gold
    'rgba(255, 150, 0, 0.8)',     // Orange
    'rgba(255, 100, 0, 0.85)',    // Dark orange (getting saturated)
    'rgba(255, 50, 0, 0.9)',      // Red-orange
    'rgba(255, 0, 0, 0.95)',      // Red (highly saturated — avoid)
  ],

  // Same as competition for now — density-based
  opportunity: [
    'rgba(0, 255, 0, 0)',
    'rgba(0, 200, 0, 0.4)',
    'rgba(100, 220, 0, 0.5)',
    'rgba(200, 255, 0, 0.6)',
    'rgba(255, 255, 0, 0.7)',
    'rgba(255, 200, 0, 0.75)',
    'rgba(255, 150, 0, 0.8)',
    'rgba(255, 100, 0, 0.85)',
    'rgba(255, 50, 0, 0.9)',
    'rgba(255, 0, 0, 0.95)',
  ],

  // Environment Risk: Green (safe) → Red (danger)
  environment: [
    'rgba(0, 255, 0, 0)',
    'rgba(0, 200, 0, 0.4)',
    'rgba(100, 220, 0, 0.5)',
    'rgba(200, 255, 0, 0.6)',
    'rgba(255, 255, 0, 0.7)',
    'rgba(255, 200, 0, 0.75)',
    'rgba(255, 150, 0, 0.8)',
    'rgba(255, 100, 0, 0.85)',
    'rgba(255, 50, 0, 0.9)',
    'rgba(255, 0, 0, 0.95)',
  ],
};

export const DEFAULT_HEATMAP_CONFIG: HeatmapConfig = {
  mode: 'off',
  radius: 80,         // Large radius — each place covers a neighborhood-sized area
  opacity: 0.7,       // Visible but map still readable
  maxIntensity: 4,    // 1 place = green, 2-3 overlapping = yellow, 4+ = red
  dissipating: true,
};
