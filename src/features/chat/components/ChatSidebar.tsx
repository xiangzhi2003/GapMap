'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Sparkles, Menu, Trash2, SquarePen, Info, Clock, LogOut, X, MessageSquare } from 'lucide-react';
import { type User } from 'firebase/auth';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import SearchBar from '@/features/map/components/SearchBar';
import { ChatMessage as ChatMessageType } from '@/shared/types/chat';
import { type FirestoreSession } from '@/features/sessions';

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
  // Auth + session props
  user: User;
  sessions: FirestoreSession[];
  isLoadingSessions: boolean;
  currentSessionId: string | null;
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onSignOut: () => void;
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
  user,
  sessions,
  isLoadingSessions,
  currentSessionId,
  onLoadSession,
  onDeleteSession,
  onSignOut,
}: ChatSidebarProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const isResizing = useRef(false);

  // Auto-scroll to bottom when new messages arrive (only when chat view is visible)
  useEffect(() => {
    if (!isHistoryOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAnalyzing, isHistoryOpen]);

  // Resize drag listeners
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const maxWidth = window.innerWidth < 640 ? window.innerWidth * 0.85 : 560;
      setSidebarWidth(Math.min(Math.max(e.clientX, 380), maxWidth));
    };
    const onUp = () => { isResizing.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const handleResizeStart = (e: React.MouseEvent) => {
    isResizing.current = true;
    e.preventDefault();
  };

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
            initial={{ x: -sidebarWidth, opacity: 0 }}
            animate={{ x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } }}
            exit={{ x: -sidebarWidth, opacity: 0, transition: { duration: 0.18, ease: 'easeIn' } }}
            role="complementary"
            aria-label="GapMap AI Chat"
            style={{ width: sidebarWidth }}
            className="fixed left-0 top-0 z-50 h-full bg-[#0a0a0f] border-r border-[#2a2a3a] flex flex-col shadow-2xl"
          >
          {/* Drag handle */}
          <div
            onMouseDown={handleResizeStart}
            title="Drag to resize"
            className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-cyan-500/40 active:bg-cyan-500/60 transition-colors z-10"
          />
          {/* Header */}
          <div className="p-4 border-b border-[#2a2a3a]">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer min-w-0 flex-1 overflow-hidden"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Map size={20} className="text-white" />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <h1 className="text-lg font-bold text-white leading-tight flex items-center gap-1 truncate">
                    GapMap
                    <Sparkles size={14} className="text-cyan-400 flex-shrink-0" />
                  </h1>
                  <p className="text-xs text-gray-500 leading-tight truncate">Market Gap Intelligence</p>
                </div>
              </button>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* History toggle */}
                <IconTooltip label="Chat History" align="right">
                  <button
                    onClick={() => setIsHistoryOpen((prev) => !prev)}
                    aria-label="Toggle chat history"
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isHistoryOpen
                        ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400'
                        : 'bg-[#1a1a25] hover:bg-[#2a2a3a] text-gray-400'
                    }`}
                  >
                    <Clock size={16} />
                  </button>
                </IconTooltip>
                {messages.length > 0 && !isHistoryOpen && (
                  <IconTooltip label="New Chat" align="right">
                    <button
                      onClick={onNewChat}
                      aria-label="New chat"
                      className="w-8 h-8 rounded-lg bg-[#1a1a25] hover:bg-[#2a2a3a] flex items-center justify-center transition-colors"
                    >
                      <SquarePen size={16} className="text-gray-400" />
                    </button>
                  </IconTooltip>
                )}
                <IconTooltip label="Guide" align="right">
                  <button
                    onClick={() => setIsGuideOpen((prev) => !prev)}
                    aria-label="Toggle guide"
                    className="w-8 h-8 rounded-lg bg-[#1a1a25] hover:bg-[#2a2a3a] flex items-center justify-center transition-colors"
                  >
                    <Info size={16} className="text-gray-400" />
                  </button>
                </IconTooltip>
                <IconTooltip label="Close" align="right">
                  <button
                    onClick={onClose}
                    aria-label="Close chat sidebar"
                    className="w-8 h-8 rounded-lg bg-[#1a1a25] hover:bg-[#2a2a3a] flex items-center justify-center transition-colors"
                  >
                    <Menu size={16} className="text-gray-400" />
                  </button>
                </IconTooltip>
              </div>
            </div>
          </div>

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
                      Limits: can&apos;t search private databases, real-time traffic incidents, or places without public Google Maps listings.
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

          {/* Main content area — toggled between chat and history */}
          {isHistoryOpen ? (
            /* ── Session History Panel ── */
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 pt-3 pb-2 border-b border-[#2a2a3a]">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Chat History
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {isLoadingSessions ? (
                  /* Loading skeleton */
                  Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-14 rounded-lg bg-[#1a1a25] animate-pulse"
                    />
                  ))
                ) : sessions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4 py-12">
                    <MessageSquare size={32} className="text-gray-600 mb-3" />
                    <p className="text-sm text-gray-500">No previous chats</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Your conversations will appear here
                    </p>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActive={session.id === currentSessionId}
                      onLoad={() => {
                        onLoadSession(session.id);
                        setIsHistoryOpen(false);
                      }}
                      onDelete={() => onDeleteSession(session.id)}
                    />
                  ))
                )}
              </div>
              {/* New chat button at bottom of history */}
              <div className="p-3 border-t border-[#2a2a3a]">
                <button
                  onClick={() => {
                    onNewChat();
                    setIsHistoryOpen(false);
                  }}
                  className="w-full py-2 px-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/40 rounded-lg text-cyan-400 text-sm font-medium transition-all flex items-center justify-center gap-2"
                >
                  <SquarePen size={14} />
                  New Chat
                </button>
              </div>
            </div>
          ) : (
            /* ── Chat Panel ── */
            <>
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

              {/* Clear Map Button */}
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
            </>
          )}

          {/* User Profile Footer — always visible */}
          <div className="p-3 border-t border-[#2a2a3a] flex items-center gap-3 bg-[#0a0a0f]">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName ?? 'User'}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full ring-1 ring-cyan-500/30 flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {user.displayName ?? 'User'}
              </p>
              <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
            </div>
            <IconTooltip label="Sign Out" align="right">
              <button
                onClick={onSignOut}
                aria-label="Sign out"
                className="w-8 h-8 rounded-lg bg-[#1a1a25] hover:bg-red-500/10 border border-[#2a2a3a] hover:border-red-500/30 flex items-center justify-center transition-colors flex-shrink-0"
              >
                <LogOut size={14} className="text-gray-400 hover:text-red-400" />
              </button>
            </IconTooltip>
          </div>

        </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Session list item ────────────────────────────────────────────────────────
interface SessionItemProps {
  session: FirestoreSession;
  isActive: boolean;
  onLoad: () => void;
  onDelete: () => void;
}

function SessionItem({ session, isActive, onLoad, onDelete }: SessionItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`group relative flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
        isActive
          ? 'bg-cyan-500/10 border-l-2 border-cyan-500'
          : 'hover:bg-[#1a1a25] border-l-2 border-transparent'
      }`}
      onClick={onLoad}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex-1 min-w-0 pr-6">
        <p className="text-xs font-medium text-white truncate leading-snug">
          {session.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-gray-500">
            {formatRelativeTime(session.updatedAt.toDate())}
          </span>
          <span className="text-[10px] text-gray-600">·</span>
          <span className="text-[10px] text-gray-600">
            {session.messageCount} msg{session.messageCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      {/* Delete button — slides in on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete session"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 flex items-center justify-center transition-colors"
          >
            <X size={11} className="text-red-400" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function IconTooltip({ label, children, align = 'center' }: { label: string; children: React.ReactNode; align?: 'center' | 'right' }) {
  const posClass = align === 'right'
    ? 'right-0'
    : 'left-1/2 -translate-x-1/2';
  return (
    <div className="relative group">
      {children}
      <div className={`absolute top-full ${posClass} mt-2 px-2 py-1 bg-[#1a1a25] border border-[#2a2a3a] rounded-md text-[10px] text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-[80]`}>
        {label}
      </div>
    </div>
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
