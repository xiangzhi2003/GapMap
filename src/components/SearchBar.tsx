'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MapPin, Loader2 } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  isSearching: boolean;
  recentSearches?: string[];
}

export default function SearchBar({ onSearch, onClear, isSearching, recentSearches = [] }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (query.trim() && !isSearching) {
      onSearch(query.trim());
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setQuery('');
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setQuery('');
    onClear();
    inputRef.current?.focus();
  };

  const handleRecentClick = (search: string) => {
    setQuery(search);
    onSearch(search);
    setIsFocused(false);
  };

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-3 border-b border-[#2a2a3a]"
      >
        <div
          className={`flex items-center gap-2 bg-[#12121a] rounded-xl border px-3 py-2 transition-colors ${
            isFocused ? 'border-cyan-500/50' : 'border-[#2a2a3a]'
          }`}
        >
          {isSearching ? (
            <Loader2 size={18} className="text-cyan-400 animate-spin flex-shrink-0" />
          ) : (
            <Search size={18} className="text-gray-500 flex-shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            placeholder="Search places..."
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none"
          />
          {query && (
            <button
              onClick={handleClear}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </motion.div>

      {/* Recent searches dropdown */}
      <AnimatePresence>
        {isFocused && recentSearches.length > 0 && !query && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute left-3 right-3 top-full mt-1 bg-[#12121a] border border-[#2a2a3a] rounded-lg shadow-lg z-10 overflow-hidden"
          >
            <p className="text-[10px] text-gray-500 px-3 py-2 border-b border-[#2a2a3a]">
              Recent Searches
            </p>
            {recentSearches.slice(0, 5).map((search, index) => (
              <button
                key={index}
                onClick={() => handleRecentClick(search)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-[#1a1a25] transition-colors text-left"
              >
                <MapPin size={14} className="text-gray-500" />
                {search}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
