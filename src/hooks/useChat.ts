'use client';

import { useState, useCallback } from 'react';
import { ChatMessage, MapAction, ChatContext, ChatApiResponse } from '@/types/chat';

interface UseChatResult {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string, mapContext?: ChatContext) => Promise<MapAction[] | undefined>;
  clearMessages: () => void;
}

export function useChat(): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string, mapContext?: ChatContext): Promise<MapAction[] | undefined> => {
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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history: messages,
          mapContext,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Extract analysis card data if present
      const analysisCardAction = data.mapActions?.find(
        (action: MapAction) => action.type === 'analysisCard'
      );
      const analysisCardData = analysisCardAction
        ? (analysisCardAction.data as import('@/types/chat').AnalysisCardData)
        : undefined;

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
        mapAction: data.mapAction,
        mapActions: data.mapActions,
        analysisCardData,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      return data.mapActions || (data.mapAction ? [data.mapAction] : undefined);
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
