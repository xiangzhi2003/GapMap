'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, MapPin, Clock } from 'lucide-react';
import { PlaceResult, AnalysisCardData, MarketZone } from '@/shared/types/chat';
import { getCategoryColor } from '@/shared/utils/markerIcons';

interface ResultsPanelProps {
  results: PlaceResult[];
  aiZones: AnalysisCardData | null;
  isVisible: boolean;
  onClose: () => void;
  onPlaceClick: (placeId: string, location: { lat: number; lng: number }) => void;
}

/** Haversine distance in meters */
function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

interface ZoneGroup {
  zone: MarketZone;
  level: 'red' | 'orange' | 'green';
  places: PlaceResult[];
}

function groupByZones(
  places: PlaceResult[],
  aiZones: AnalysisCardData
): { groups: ZoneGroup[]; ungrouped: PlaceResult[] } {
  const assigned = new Set<string>();
  const groups: ZoneGroup[] = [];

  const allZones = [
    ...aiZones.redZones.map(z => ({ zone: z, level: 'red' as const })),
    ...aiZones.orangeZones.map(z => ({ zone: z, level: 'orange' as const })),
    ...aiZones.greenZones.map(z => ({ zone: z, level: 'green' as const })),
  ];

  for (const { zone, level } of allZones) {
    // Use a generous multiplier so places near the boundary are included
    const matchRadius = zone.radius * 1.5;
    const matched = places.filter(p => {
      if (assigned.has(p.placeId)) return false;
      return distanceMeters(p.location, { lat: zone.lat, lng: zone.lng }) <= matchRadius;
    });
    matched.forEach(p => assigned.add(p.placeId));
    groups.push({ zone, level, places: matched });
  }

  const ungrouped = places.filter(p => !assigned.has(p.placeId));
  return { groups, ungrouped };
}

function RatingStars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.3;
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={10}
          className={
            i < full
              ? 'text-amber-400 fill-amber-400'
              : i === full && half
                ? 'text-amber-400 fill-amber-400/50'
                : 'text-gray-600'
          }
        />
      ))}
    </span>
  );
}

function PlaceCard({
  place,
  index,
  onClick,
}: {
  place: PlaceResult;
  index: number;
  onClick: () => void;
}) {
  const markerColor = getCategoryColor(place.types);
  const mainType = place.types?.find(
    t => !['point_of_interest', 'establishment'].includes(t)
  );
  const typeLabel = mainType
    ? mainType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : null;

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors border-b border-[#1a1a2e] flex gap-3 items-start cursor-pointer"
    >
      {/* Marker number badge */}
      <div
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white mt-0.5"
        style={{ backgroundColor: markerColor }}
      >
        {index}
      </div>

      <div className="flex-1 min-w-0">
        {/* Name */}
        <div className="text-[13px] font-semibold text-white truncate leading-tight">
          {place.name}
        </div>

        {/* Rating row */}
        {place.rating && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[12px] font-medium text-amber-400">
              {place.rating.toFixed(1)}
            </span>
            <RatingStars rating={place.rating} />
            {place.userRatingsTotal !== undefined && (
              <span className="text-[11px] text-gray-500">
                ({place.userRatingsTotal.toLocaleString()})
              </span>
            )}
          </div>
        )}

        {/* Type */}
        {typeLabel && (
          <div className="text-[11px] text-gray-400 mt-0.5 truncate">
            {typeLabel}
          </div>
        )}

        {/* Address */}
        <div className="text-[11px] text-gray-500 mt-0.5 truncate flex items-center gap-1">
          <MapPin size={9} className="flex-shrink-0" />
          {place.address}
        </div>

        {/* Open/Closed */}
        {place.openNow !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            <Clock size={9} className={place.openNow ? 'text-green-400' : 'text-red-400'} />
            <span
              className={`text-[10px] font-medium ${place.openNow ? 'text-green-400' : 'text-red-400'}`}
            >
              {place.openNow ? 'Open' : 'Closed'}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

function ZoneSection({
  group,
  results,
  onPlaceClick,
}: {
  group: ZoneGroup;
  results: PlaceResult[];
  onPlaceClick: (placeId: string, location: { lat: number; lng: number }) => void;
}) {
  const colorMap = {
    red: { bg: '#ef444422', border: '#ef444444', text: '#ef4444', label: 'Saturated' },
    orange: { bg: '#f59e0b22', border: '#f59e0b44', text: '#f59e0b', label: 'Moderate' },
    green: { bg: '#22c55e22', border: '#22c55e44', text: '#22c55e', label: 'Opportunity' },
  };
  const c = colorMap[group.level];

  return (
    <div className="mb-1">
      {/* Zone header */}
      <div
        className="sticky top-0 z-10 px-3 py-2 flex items-center gap-2"
        style={{ background: c.bg, borderBottom: `1px solid ${c.border}` }}
      >
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: c.text }}
        />
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-semibold truncate" style={{ color: c.text }}>
            {group.zone.name}
          </span>
          <span className="text-[10px] text-gray-500 ml-2">
            {c.label}
          </span>
        </div>
        <span className="text-[10px] text-gray-500">
          {group.places.length}
        </span>
      </div>

      {/* Places in this zone */}
      {group.places.length > 0 ? (
        group.places.map(place => {
          const idx = results.indexOf(place) + 1;
          return (
            <PlaceCard
              key={place.placeId}
              place={place}
              index={idx}
              onClick={() => onPlaceClick(place.placeId, place.location)}
            />
          );
        })
      ) : (
        <div className="px-3 py-3 text-[11px] text-gray-500 italic">
          No competitors found — market gap!
        </div>
      )}
    </div>
  );
}

export default function ResultsPanel({
  results,
  aiZones,
  isVisible,
  onClose,
  onPlaceClick,
}: ResultsPanelProps) {
  const { groups, ungrouped } = useMemo(() => {
    if (!aiZones) return { groups: [] as ZoneGroup[], ungrouped: results };
    return groupByZones(results, aiZones);
  }, [results, aiZones]);

  return (
    <AnimatePresence>
      {isVisible && results.length > 0 && (
        <>
          {/* Mobile backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="sm:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full z-50 w-[85vw] sm:w-80 bg-[#0a0a0f] border-l border-[#2a2a3a] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a3a]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Results</span>
                <span className="text-[11px] text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded">
                  {results.length}
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable results */}
            <div className="flex-1 overflow-y-scroll custom-scrollbar">
              {aiZones && groups.length > 0 ? (
                <>
                  {groups.map((group, i) => (
                    <ZoneSection
                      key={`zone-${i}`}
                      group={group}
                      results={results}
                      onPlaceClick={onPlaceClick}
                    />
                  ))}
                  {ungrouped.length > 0 && (
                    <div className="mb-1">
                      <div className="sticky top-0 z-10 px-3 py-2 bg-[#12121a] border-b border-[#2a2a3a] flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-gray-500" />
                        <span className="text-[11px] font-semibold text-gray-400">
                          Other Areas
                        </span>
                        <span className="text-[10px] text-gray-500 ml-auto">
                          {ungrouped.length}
                        </span>
                      </div>
                      {ungrouped.map(place => {
                        const idx = results.indexOf(place) + 1;
                        return (
                          <PlaceCard
                            key={place.placeId}
                            place={place}
                            index={idx}
                            onClick={() => onPlaceClick(place.placeId, place.location)}
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                results.map((place, i) => (
                  <PlaceCard
                    key={place.placeId}
                    place={place}
                    index={i + 1}
                    onClick={() => onPlaceClick(place.placeId, place.location)}
                  />
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
