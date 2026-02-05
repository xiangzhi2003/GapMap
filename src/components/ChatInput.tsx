'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, isLoading, placeholder = 'Ask MapAI anything...' }: ChatInputProps) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 border-t border-[#2a2a3a] bg-[#0a0a0f]"
    >
      <div className="flex items-end gap-2 bg-[#12121a] rounded-xl border border-[#2a2a3a] p-2 focus-within:border-cyan-500/50 transition-colors">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 resize-none outline-none min-h-[24px] max-h-[120px] py-1 px-2"
        />
        <button
          onClick={handleSubmit}
          disabled={!message.trim() || isLoading}
          className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        >
          {isLoading ? (
            <Loader2 size={16} className="text-white animate-spin" />
          ) : (
            <Send size={16} className="text-white" />
          )}
        </button>
      </div>
      <p className="text-[10px] text-gray-600 mt-2 text-center">
        Press Enter to send, Shift+Enter for new line
      </p>
    </motion.div>
  );
}
