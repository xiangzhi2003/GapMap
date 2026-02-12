'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Sparkles, Menu, Trash2, SquarePen } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import SearchBar from '@/features/map/components/SearchBar';
import { ChatMessage as ChatMessageType } from '@/shared/types/chat';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessageType[];
  isLoading: boolean;
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <div role="status" aria-label="GapMap is typing a response" className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <div className="flex gap-1" aria-hidden="true">
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
