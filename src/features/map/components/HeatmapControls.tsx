'use client';

import { HeatmapMode } from '@/shared/types/heatmap';
import { Flame, MapPin, Cloud, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeatmapControlsProps {
  mode: HeatmapMode;
  showMarkers: boolean;
  onModeChange: (mode: HeatmapMode) => void;
  onToggleMarkers: () => void;
}

export default function HeatmapControls({
  mode,
  showMarkers,
  onModeChange,
  onToggleMarkers,
}: HeatmapControlsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-20 left-4 z-10 w-80 max-w-[calc(100vw-2rem)]"
    >
      {/* Glassmorphism Panel */}
      <div className="bg-[#12121a]/90 backdrop-blur-xl border border-[#2a2a3a] rounded-xl p-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Heatmap Analysis</h3>
          </div>
          {mode !== 'off' && (
            <button
              onClick={() => onModeChange('off')}
              className="w-6 h-6 rounded-md bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center transition-colors"
              aria-label="Close heatmap"
            >
              <X size={14} className="text-red-400" />
            </button>
          )}
        </div>

        {/* Mode Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <ModeButton
            active={mode === 'opportunity'}
            onClick={() => onModeChange('opportunity')}
            icon={<MapPin size={14} />}
            label="Opportunity"
            color="green"
          />
          <ModeButton
            active={mode === 'competition'}
            onClick={() => onModeChange('competition')}
            icon={<Flame size={14} />}
            label="Competition"
            color="red"
          />
          <ModeButton
            active={mode === 'environment'}
            onClick={() => onModeChange('environment')}
            icon={<Cloud size={14} />}
            label="Environment"
            color="orange"
          />
          <ModeButton
            active={mode === 'off'}
            onClick={() => onModeChange('off')}
            icon={<X size={14} />}
            label="Off"
            color="gray"
          />
        </div>

        {/* Show Markers Toggle */}
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer hover:text-gray-300 transition-colors">
          <input
            type="checkbox"
            checked={showMarkers}
            onChange={onToggleMarkers}
            className="w-4 h-4 rounded border-[#2a2a3a] bg-[#1a1a25] text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
          />
          <span>Show Markers</span>
        </label>

        {/* Legend */}
        {mode !== 'off' && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-[#2a2a3a]"
            >
              <div className="text-[10px] text-gray-500 mb-1">Legend</div>
              <div className="flex items-center gap-2">
                <div className={`h-2 flex-1 rounded-full heatmap-legend-gradient ${mode}`} />
              </div>
              <div className="flex justify-between text-[9px] text-gray-500 mt-1">
                <span>{getLegendLabel(mode, 'low')}</span>
                <span>{getLegendLabel(mode, 'high')}</span>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

function ModeButton({ active, onClick, icon, label, color }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: 'green' | 'red' | 'orange' | 'gray';
}) {
  const colorClasses = {
    green: active ? 'bg-green-500/20 border-green-500 text-green-400' : 'border-[#2a2a3a] text-gray-400',
    red: active ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-[#2a2a3a] text-gray-400',
    orange: active ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'border-[#2a2a3a] text-gray-400',
    gray: active ? 'bg-gray-500/20 border-gray-500 text-gray-400' : 'border-[#2a2a3a] text-gray-400',
  };

  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-1.5 hover:scale-105 ${colorClasses[color]}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function getLegendLabel(mode: HeatmapMode, end: 'low' | 'high'): string {
  if (mode === 'opportunity') {
    return end === 'low' ? 'Avoid' : 'Best';
  }
  if (mode === 'competition') {
    return end === 'low' ? 'Low' : 'High';
  }
  if (mode === 'environment') {
    return end === 'low' ? 'Safe' : 'Risk';
  }
  return '';
}
