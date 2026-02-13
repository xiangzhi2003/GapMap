'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Sparkles, Menu, Trash2, SquarePen, Info } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import SearchBar from '@/features/map/components/SearchBar';
import { ChatMessage as ChatMessageType } from '@/shared/types/chat';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessageType[];
  isLoading: boolean;
  isAnalyzing?: boolean;
  onSendMessage: (message: string) => void;
  onSearch: (query: string) => void;
  onClearSearch: () => void;
  isSearching: boolean;
  recentSearches: string[];
  onClearMap: () => void;
  onNewChat: () => void;
  hasMarkers: boolean;
  hasDirections: boolean;
}

export default function ChatSidebar({
  isOpen,
  onClose,
  messages,
  isLoading,
  isAnalyzing,
  onSendMessage,
  onSearch,
  onClearSearch,
  isSearching,
  recentSearches,
  onClearMap,
  onNewChat,
  hasMarkers,
  hasDirections,
}: ChatSidebarProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Auto-scroll to bottom when new messages arrive or analyzing starts
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAnalyzing]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm sm:hidden"
          />
          <motion.aside
            initial={{ x: -320, opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            role="complementary"
            aria-label="GapMap AI Chat"
            className="fixed left-0 top-0 z-50 w-[85vw] sm:w-80 h-full bg-[#0a0a0f] border-r border-[#2a2a3a] flex flex-col shadow-2xl"
          >
          {/* Header */}
          <div className="p-4 border-b border-[#2a2a3a]">
            <div className="flex items-center justify-between">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                  <Map size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white flex items-center gap-2">
                    GapMap
                    <Sparkles size={14} className="text-cyan-400" />
                  </h1>
                  <p className="text-xs text-gray-500">Market Gap Intelligence</p>
                </div>
              </button>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    onClick={onNewChat}
                    aria-label="New chat"
                    className="w-8 h-8 rounded-lg bg-[#1a1a25] hover:bg-[#2a2a3a] flex items-center justify-center transition-colors"
                  >
                    <SquarePen size={16} className="text-gray-400" />
                  </button>
                )}
                <button
                  onClick={() => setIsGuideOpen((prev) => !prev)}
                  aria-label="Toggle guide"
                  className="w-8 h-8 rounded-lg bg-[#1a1a25] hover:bg-[#2a2a3a] flex items-center justify-center transition-colors"
                >
                  <Info size={16} className="text-gray-400" />
                </button>
                <button
                  onClick={onClose}
                  aria-label="Close chat sidebar"
                  className="w-8 h-8 rounded-lg bg-[#1a1a25] hover:bg-[#2a2a3a] flex items-center justify-center transition-colors"
                >
                  <Menu size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <SearchBar
            onSearch={onSearch}
            onClear={onClearSearch}
            isSearching={isSearching}
            recentSearches={recentSearches}
          />

          {/* Guide Modal */}
          <AnimatePresence>
            {isGuideOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsGuideOpen(false)}
                  aria-hidden="true"
                  className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 10 }}
                  transition={{ duration: 0.2 }}
                  role="dialog"
                  aria-modal="true"
                  aria-label="GapMap guide"
                  className="fixed left-1/2 top-1/2 z-[70] w-[90vw] max-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#2a2a3a] bg-[#0f0f16] shadow-2xl"
                >
                  <div className="flex items-center justify-between border-b border-[#2a2a3a] px-4 py-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white">What can I ask?</h3>
                      <p className="text-[11px] text-gray-500">Quick guide to GapMap capabilities</p>
                    </div>
                    <button
                      onClick={() => setIsGuideOpen(false)}
                      aria-label="Close guide"
                      className="w-8 h-8 rounded-lg bg-[#1a1a25] hover:bg-[#2a2a3a] flex items-center justify-center transition-colors"
                    >
                      <Menu size={16} className="text-gray-400" />
                    </button>
                  </div>
                  <div className="p-4 text-xs text-gray-300 space-y-3">
                    <div className="text-gray-400">
                      Capabilities: search places, directions, market analysis, accessibility scoring, and environment insights.
                    </div>
                    <div className="text-gray-500">
                      Limits: can't search private databases, real-time traffic incidents, or places without public Google Maps listings.
                    </div>
                    <div className="grid gap-2">
                      <SuggestionButton
                        text="Find cafes in Kuala Lumpur"
                        onClick={() => onSendMessage('Find cafes in Kuala Lumpur')}
                      />
                      <SuggestionButton
                        text="Directions from KL Sentral to KLCC"
                        onClick={() => onSendMessage('Directions from KL Sentral to KLCC')}
                      />
                      <SuggestionButton
                        text="Analyze market for gyms in Petaling Jaya"
                        onClick={() => onSendMessage('Analyze market for gyms in Petaling Jaya')}
                      />
                      <SuggestionButton
                        text="How accessible is Mid Valley Megamall?"
                        onClick={() => onSendMessage('How accessible is Mid Valley Megamall?')}
                      />
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Chat Messages */}
          <div role="log" aria-label="Chat messages" aria-live="polite" className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#2a2a3a] scrollbar-track-transparent">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                  <Sparkles size={28} className="text-cyan-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Welcome to GapMap
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Find the best location to open your business using AI-powered competitor analysis.
                </p>
                <div className="space-y-2 w-full">
                  <SuggestionButton
                    text="Open a Pet Cafe in Selangor"
                    onClick={() => onSendMessage('I want to open a Pet Cafe in Selangor. Where should I set up?')}
                  />
                  <SuggestionButton
                    text="Gym at Bukit Jalil"
                    onClick={() => onSendMessage('I want to open a Gym at Bukit Jalil. Analyze the competition and find the best location.')}
                  />
                  <SuggestionButton
                    text="Coffee Shop in KL"
                    onClick={() => onSendMessage('Analyze the market for opening a Coffee Shop in Kuala Lumpur. Where are the gaps?')}
                  />
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {(isLoading || isAnalyzing) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      >
                        <Sparkles size={16} className="text-purple-400" />
                      </motion.div>
                    </div>
                    <div className="flex-1">
                      <div className="rounded-2xl px-4 py-3 bg-[#1a1a25] border border-purple-500/20 rounded-tl-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-300">
                            {isAnalyzing ? 'Analyzing market data' : 'Thinking'}
                          </span>
                          <motion.span
                            className="text-sm text-purple-400"
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                          >
                            ...
                          </motion.span>
                        </div>
                        {isAnalyzing && (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 15, ease: 'easeOut' }}
                            className="h-0.5 bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500 rounded-full mt-2"
                          />
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Clear Map Button - show when there are markers or directions */}
          {(hasMarkers || hasDirections) && (
            <div className="px-4 pb-2">
              <button
                onClick={onClearMap}
                className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-lg text-red-400 text-sm font-medium transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Trash2 size={16} />
                Clear All Markers
              </button>
            </div>
          )}

          {/* Chat Input */}
          <ChatInput onSend={onSendMessage} isLoading={isLoading} />
        </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function SuggestionButton({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left text-sm text-gray-400 hover:text-cyan-400 bg-[#12121a] hover:bg-[#1a1a25] border border-[#2a2a3a] hover:border-cyan-500/30 rounded-lg px-3 py-2 transition-all"
    >
      {text}
    </button>
  );
}
