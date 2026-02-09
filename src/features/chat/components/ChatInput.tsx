'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Navigation, BarChart3, Search } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

const QUICK_ACTIONS = [
  { icon: Search, label: 'Find', prompt: 'Find ', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/20' },
  { icon: Navigation, label: 'Directions', prompt: 'Directions from ', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20' },
  { icon: BarChart3, label: 'Analyze', prompt: 'Analyze the market for ', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20' },
];

export default function ChatInput({ onSend, isLoading, placeholder = 'Ask GapMap anything...' }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickAction = (prompt: string) => {
    setMessage(prompt);
    textareaRef.current?.focus();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 border-t border-[#2a2a3a] bg-[#0a0a0f]"
    >
      {/* Quick Action Buttons */}
      <div className="flex gap-1.5 mb-2 overflow-x-auto" role="toolbar" aria-label="Quick actions">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => handleQuickAction(action.prompt)}
            disabled={isLoading}
            aria-label={`${action.label}: ${action.prompt.trim()}`}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all whitespace-nowrap disabled:opacity-50 ${action.color}`}
          >
            <action.icon size={12} aria-hidden="true" />
            {action.label}
          </button>
        ))}
      </div>

      <div className="flex items-end gap-2 bg-[#12121a] rounded-xl border border-[#2a2a3a] p-2 focus-within:border-cyan-500/50 transition-colors">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Chat message input"
          disabled={isLoading}
          rows={1}
          className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 resize-none outline-none min-h-[24px] max-h-[120px] py-1 px-2"
        />
        <button
          onClick={handleSubmit}
          disabled={!message.trim() || isLoading}
          aria-label={isLoading ? 'Sending message' : 'Send message'}
          className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        >
          {isLoading ? (
            <Loader2 size={16} className="text-white animate-spin" aria-hidden="true" />
          ) : (
            <Send size={16} className="text-white" aria-hidden="true" />
          )}
        </button>
      </div>
      <p className="text-[10px] text-gray-600 mt-2 text-center">
        Press Enter to send, Shift+Enter for new line
      </p>
    </motion.div>
  );
}
