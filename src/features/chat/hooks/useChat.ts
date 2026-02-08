'use client';

import { useState, useCallback } from 'react';
import { ChatMessage, ChatContext, ChatApiResponse } from '@/shared/types/chat';

interface UseChatResult {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string, mapContext?: ChatContext) => Promise<{ intent: 'search' | 'directions' | 'analyze' | 'chat'; query: string | null; directions: { origin: string; destination: string } | null } | undefined>;
  clearMessages: () => void;
}

export function useChat(): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string, mapContext?: ChatContext): Promise<{ intent: 'search' | 'directions' | 'analyze' | 'chat'; query: string | null; directions: { origin: string; destination: string } | null } | undefined> => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Clean history: only send role, content, timestamp (as ISO string)
      const cleanedHistory = messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString()
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history: cleanedHistory,
          mapContext,
        }),
      });

      const data: ChatApiResponse = await response.json();

      if (!response.ok) {
        throw new Error((data as unknown as { error: string }).error || 'Failed to get response');
      }

      // Store ONLY clean message - no extra fields
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Return intent, query, and directions for map handling
      return { intent: data.intent, query: data.query, directions: data.directions };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);

      // Add error message to chat
      const errorAssistantMessage: ChatMessage = {
        id: `assistant-error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorAssistantMessage]);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
