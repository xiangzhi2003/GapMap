'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Lightbulb } from 'lucide-react';
import { AnalysisCardData, AnalysisZone } from '@/types/chat';

interface AnalysisCardProps {
  data: AnalysisCardData;
  onClose: () => void;
}

export default function AnalysisCard({ data, onClose }: AnalysisCardProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
        className="absolute bottom-6 left-6 z-10 w-96 max-h-[75vh] overflow-y-auto rounded-xl shadow-2xl"
        style={{ background: '#12121a', border: '1px solid #2a2a3a' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-[#2a2a3a]">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-white">GapMap Market Analysis</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {data.businessType} &middot; {data.location}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-0.5 rounded hover:bg-[#1a1a25]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Red Zones */}
        {data.redZones.length > 0 && (
          <ZoneSection
            title="Red Zone"
            subtitle="Avoid"
            emoji="🔴"
            borderColor="#ef4444"
            zones={data.redZones}
          />
        )}

        {/* Orange Zones */}
        {data.orangeZones.length > 0 && (
          <ZoneSection
            title="Orange Zone"
            subtitle="Moderate"
            emoji="🟡"
            borderColor="#f59e0b"
            zones={data.orangeZones}
          />
        )}

        {/* Green Zones */}
        {data.greenZones.length > 0 && (
          <ZoneSection
            title="Green Zone"
            subtitle="Opportunity"
            emoji="🟢"
            borderColor="#22c55e"
            zones={data.greenZones}
          />
        )}

        {/* Strategic Recommendation */}
        <div className="p-4 border-t border-[#2a2a3a]">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={14} className="text-cyan-400" />
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">Strategic Advice</span>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{data.recommendation}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function ZoneSection({
  title,
  subtitle,
  emoji,
  borderColor,
  zones,
}: {
  title: string;
  subtitle: string;
  emoji: string;
  borderColor: string;
  zones: AnalysisZone[];
}) {
  return (
    <div className="p-4 border-b border-[#2a2a3a]" style={{ borderLeft: `3px solid ${borderColor}` }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">{emoji}</span>
        <span className="text-xs font-semibold text-gray-300">{title}</span>
        <span className="text-xs text-gray-600">({subtitle})</span>
      </div>
      <div className="space-y-2">
        {zones.map((zone, i) => (
          <div key={i}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">{zone.name}</span>
              {zone.count !== undefined && (
                <span className="text-xs text-gray-500">{zone.count} competitor{zone.count !== 1 ? 's' : ''}</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{zone.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
