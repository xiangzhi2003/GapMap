'use client';

import { motion } from 'framer-motion';
import { AnalysisCardData } from '@/types/chat';

interface InlineAnalysisCardProps {
  data: AnalysisCardData;
}

export default function InlineAnalysisCard({ data }: InlineAnalysisCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="bg-[#12121a] border border-purple-500/30 rounded-xl p-4 text-sm"
    >
      {/* Header */}
      <div className="mb-3 pb-3 border-b border-purple-500/20">
        <h3 className="font-bold text-white text-base">{data.businessType}</h3>
        <p className="text-xs text-gray-400 mt-1">{data.location}</p>
      </div>

      {/* Red Zones */}
      {data.redZones.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🔴</span>
            <h4 className="font-semibold text-red-400 text-xs">Red Zones - Avoid</h4>
          </div>
          <div className="space-y-1.5">
            {data.redZones.map((zone, idx) => (
              <div key={idx} className="bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1.5">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-red-300 text-xs">{zone.name}</p>
                  {zone.count !== undefined && (
                    <span className="text-[10px] text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded">
                      {zone.count} competitors
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">{zone.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orange Zones */}
      {data.orangeZones.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🟠</span>
            <h4 className="font-semibold text-orange-400 text-xs">Orange Zones - Competitive</h4>
          </div>
          <div className="space-y-1.5">
            {data.orangeZones.map((zone, idx) => (
              <div key={idx} className="bg-orange-500/10 border border-orange-500/20 rounded-lg px-2 py-1.5">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-orange-300 text-xs">{zone.name}</p>
                  {zone.count !== undefined && (
                    <span className="text-[10px] text-orange-400 bg-orange-500/20 px-1.5 py-0.5 rounded">
                      {zone.count} competitors
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">{zone.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Green Zones */}
      {data.greenZones.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🟢</span>
            <h4 className="font-semibold text-green-400 text-xs">Green Zones - Opportunity</h4>
          </div>
          <div className="space-y-1.5">
            {data.greenZones.map((zone, idx) => (
              <div key={idx} className="bg-green-500/10 border border-green-500/20 rounded-lg px-2 py-1.5">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-green-300 text-xs">{zone.name}</p>
                  {zone.count !== undefined && (
                    <span className="text-[10px] text-green-400 bg-green-500/20 px-1.5 py-0.5 rounded">
                      {zone.count} competitors
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">{zone.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-lg p-3 mt-3">
        <div className="flex items-start gap-2">
          <span className="text-base">💡</span>
          <div className="flex-1">
            <h4 className="font-semibold text-purple-300 text-xs mb-1">Recommendation</h4>
            <p className="text-[11px] text-gray-300 leading-relaxed">{data.recommendation}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
