"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronDown,
    ChevronUp,
    MapPin,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Users,
} from "lucide-react";
import { AnalysisCardData, MarketZone } from "@/shared/types/chat";

interface MarketAnalysisCardProps {
    data: AnalysisCardData;
}

export function MarketAnalysisCard({ data }: MarketAnalysisCardProps) {
    const [expandedSections, setExpandedSections] = useState<
        Record<string, boolean>
    >({
        audience: true,
        red: true,
        orange: true,
        green: true,
    });

    const toggleSection = (section: string) => {
        setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    const getAudienceFitBadge = (zone: MarketZone) => {
        if (!zone.audienceFit) return null;
        const colors = {
            good: "bg-green-500/20 text-green-300 border-green-500/30",
            moderate: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
            poor: "bg-red-500/20 text-red-300 border-red-500/30",
        };
        const labels = {
            good: "✓ Good Fit",
            moderate: "~ Moderate Fit",
            poor: "✗ Poor Fit",
        };
        return (
            <span
                className={`inline-flex items-center text-[9px] font-medium px-1.5 py-0.5 rounded border ${
                    colors[zone.audienceFit]
                }`}
            >
                {labels[zone.audienceFit]}
            </span>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="glass-panel p-4 rounded-xl border border-cyan-500/20 glow-cyan my-3"
        >
            {/* Header */}
            <div className="flex items-start gap-3 mb-4 pb-3 border-b border-cyan-500/20">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                    <TrendingUp size={20} className="text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-cyan-400 mb-1">
                        Market Analysis
                    </h3>
                    <p className="text-xs text-gray-400">
                        {data.businessType} • {data.location}
                    </p>
                </div>
            </div>

            {/* Target Audience Analysis */}
            {data.targetAudienceAnalysis && (
                <div className="mb-3">
                    <button
                        onClick={() => toggleSection("audience")}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-purple-500/5 border-l-4 border-purple-500 hover:bg-purple-500/10 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Users size={16} className="text-purple-400" />
                            <span className="text-sm font-medium text-purple-400">
                                Target Audience
                            </span>
                        </div>
                        {expandedSections.audience ? (
                            <ChevronUp size={16} className="text-purple-400" />
                        ) : (
                            <ChevronDown
                                size={16}
                                className="text-purple-400"
                            />
                        )}
                    </button>
                    <AnimatePresence>
                        {expandedSections.audience && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-2 p-3 rounded bg-purple-500/5 border border-purple-500/20">
                                    <p className="text-xs font-medium text-purple-300 mb-2">
                                        {
                                            data.targetAudienceAnalysis
                                                .primaryAudience
                                        }
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20">
                                            💰{" "}
                                            {
                                                data.targetAudienceAnalysis
                                                    .incomeLevel
                                            }{" "}
                                            income
                                        </span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20">
                                            👤 Age{" "}
                                            {
                                                data.targetAudienceAnalysis
                                                    .ageRange
                                            }
                                        </span>
                                    </div>
                                    {data.targetAudienceAnalysis.keyTraits
                                        .length > 0 && (
                                        <div className="mb-2">
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                                                Key Traits
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {data.targetAudienceAnalysis.keyTraits.map(
                                                    (trait, i) => (
                                                        <span
                                                            key={i}
                                                            className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700"
                                                        >
                                                            {trait}
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-2">
                                        {data.targetAudienceAnalysis
                                            .idealAreaTraits.length > 0 && (
                                            <div>
                                                <p className="text-[10px] text-green-400/70 uppercase tracking-wider mb-1">
                                                    ✓ Ideal Areas
                                                </p>
                                                <ul className="space-y-0.5">
                                                    {data.targetAudienceAnalysis.idealAreaTraits.map(
                                                        (trait, i) => (
                                                            <li
                                                                key={i}
                                                                className="text-[10px] text-gray-400"
                                                            >
                                                                {trait}
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                        {data.targetAudienceAnalysis
                                            .avoidAreaTraits.length > 0 && (
                                            <div>
                                                <p className="text-[10px] text-red-400/70 uppercase tracking-wider mb-1">
                                                    ✗ Avoid Areas
                                                </p>
                                                <ul className="space-y-0.5">
                                                    {data.targetAudienceAnalysis.avoidAreaTraits.map(
                                                        (trait, i) => (
                                                            <li
                                                                key={i}
                                                                className="text-[10px] text-gray-400"
                                                            >
                                                                {trait}
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Red Zones */}
            {data.redZones.length > 0 && (
                <div className="mb-3">
                    <button
                        onClick={() => toggleSection("red")}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-red-500/5 border-l-4 border-red-500 hover:bg-red-500/10 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={16} className="text-red-400" />
                            <span className="text-sm font-medium text-red-400">
                                Red Zones ({data.redZones.length})
                            </span>
                        </div>
                        {expandedSections.red ? (
                            <ChevronUp size={16} className="text-red-400" />
                        ) : (
                            <ChevronDown size={16} className="text-red-400" />
                        )}
                    </button>
                    <AnimatePresence>
                        {expandedSections.red && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-2 space-y-2 pl-3">
                                    {data.redZones.map((zone, index) => (
                                        <div
                                            key={index}
                                            className="p-2 rounded bg-red-500/5 border border-red-500/20"
                                        >
                                            <div className="flex items-start gap-2 mb-1">
                                                <MapPin
                                                    size={14}
                                                    className="text-red-400 mt-0.5 flex-shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <p className="text-xs font-medium text-red-300">
                                                            {zone.name}
                                                        </p>
                                                        {getAudienceFitBadge(
                                                            zone
                                                        )}
                                                    </div>
                                                    {zone.count !==
                                                        undefined && (
                                                        <p className="text-[10px] text-red-400/60 mt-0.5">
                                                            {zone.count}{" "}
                                                            competitor
                                                            {zone.count !== 1
                                                                ? "s"
                                                                : ""}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                                {zone.reason}
                                            </p>
                                            {zone.audienceNote && (
                                                <p className="text-[10px] text-purple-400/80 mt-1 italic">
                                                    👥 {zone.audienceNote}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Orange Zones */}
            {data.orangeZones.length > 0 && (
                <div className="mb-3">
                    <button
                        onClick={() => toggleSection("orange")}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-orange-500/5 border-l-4 border-orange-500 hover:bg-orange-500/10 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <AlertTriangle
                                size={16}
                                className="text-orange-400"
                            />
                            <span className="text-sm font-medium text-orange-400">
                                Orange Zones ({data.orangeZones.length})
                            </span>
                        </div>
                        {expandedSections.orange ? (
                            <ChevronUp size={16} className="text-orange-400" />
                        ) : (
                            <ChevronDown
                                size={16}
                                className="text-orange-400"
                            />
                        )}
                    </button>
                    <AnimatePresence>
                        {expandedSections.orange && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-2 space-y-2 pl-3">
                                    {data.orangeZones.map((zone, index) => (
                                        <div
                                            key={index}
                                            className="p-2 rounded bg-orange-500/5 border border-orange-500/20"
                                        >
                                            <div className="flex items-start gap-2 mb-1">
                                                <MapPin
                                                    size={14}
                                                    className="text-orange-400 mt-0.5 flex-shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-orange-300">
                                                        {zone.name}
                                                    </p>
                                                    {zone.count !==
                                                        undefined && (
                                                        <p className="text-[10px] text-orange-400/60 mt-0.5">
                                                            {zone.count}{" "}
                                                            competitor
                                                            {zone.count !== 1
                                                                ? "s"
                                                                : ""}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                                {zone.reason}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Green Zones */}
            {data.greenZones.length > 0 && (
                <div className="mb-3">
                    <button
                        onClick={() => toggleSection("green")}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-green-500/5 border-l-4 border-green-500 hover:bg-green-500/10 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <CheckCircle2
                                size={16}
                                className="text-green-400"
                            />
                            <span className="text-sm font-medium text-green-400">
                                Green Zones ({data.greenZones.length})
                            </span>
                        </div>
                        {expandedSections.green ? (
                            <ChevronUp size={16} className="text-green-400" />
                        ) : (
                            <ChevronDown size={16} className="text-green-400" />
                        )}
                    </button>
                    <AnimatePresence>
                        {expandedSections.green && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-2 space-y-2 pl-3">
                                    {data.greenZones.map((zone, index) => (
                                        <div
                                            key={index}
                                            className="p-2 rounded bg-green-500/5 border border-green-500/20"
                                        >
                                            <div className="flex items-start gap-2 mb-1">
                                                <MapPin
                                                    size={14}
                                                    className="text-green-400 mt-0.5 flex-shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-green-300">
                                                        {zone.name}
                                                    </p>
                                                    {zone.count !==
                                                        undefined && (
                                                        <p className="text-[10px] text-green-400/60 mt-0.5">
                                                            {zone.count}{" "}
                                                            competitor
                                                            {zone.count !== 1
                                                                ? "s"
                                                                : ""}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                                {zone.reason}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Strategic Recommendation */}
            <div className="mt-4 pt-3 border-t border-cyan-500/20">
                <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                        <TrendingUp size={14} className="text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-cyan-400 mb-1">
                            Strategic Recommendation
                        </h4>
                        <p className="text-[11px] text-gray-300 leading-relaxed">
                            {data.recommendation}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
