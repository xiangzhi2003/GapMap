"use client";

import { useState, useCallback } from "react";
import { ChatMessage, ChatContext, ChatApiResponse } from "@/shared/types/chat";

interface UseChatResult {
    messages: ChatMessage[];
    isLoading: boolean;
    error: string | null;
    sendMessage: (
        content: string,
        mapContext?: ChatContext
    ) => Promise<ChatApiResponse | undefined>;
    addMessage: (message: ChatMessage) => void;
    clearMessages: () => void;
}

export function useChat(): UseChatResult {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendMessage = useCallback(
        async (
            content: string,
            mapContext?: ChatContext
        ): Promise<ChatApiResponse | undefined> => {
            const userMessage: ChatMessage = {
                id: `user-${Date.now()}`,
                role: "user",
                content,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, userMessage]);
            setIsLoading(true);
            setError(null);

            try {
                // Clean history: only send role, content, timestamp (as ISO string)
                // For analysis messages with empty content, generate a summary from analysisData
                // so Gemini has proper conversation context
                const cleanedHistory = messages
                    .map((msg) => {
                        let content = msg.content;
                        if (!content && msg.analysisData) {
                            content = `[Market analysis completed for ${msg.analysisData.businessType} in ${msg.analysisData.location}: ${msg.analysisData.redZones.length} red zones, ${msg.analysisData.orangeZones.length} orange zones, ${msg.analysisData.greenZones.length} green zones. Recommendation: ${msg.analysisData.recommendation}]`;
                        }
                        return {
                            id: msg.id,
                            role: msg.role,
                            content,
                            timestamp: msg.timestamp.toISOString(),
                        };
                    })
                    .filter((msg) => msg.content);

                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: content,
                        history: cleanedHistory,
                        mapContext,
                    }),
                });

                const data: ChatApiResponse = await response.json();

                if (!response.ok) {
                    throw new Error(
                        (data as unknown as { error: string }).error ||
                            "Failed to get response"
                    );
                }

                const assistantMessage: ChatMessage = {
                    id: `assistant-${Date.now()}`,
                    role: "assistant",
                    content: data.reply,
                    timestamp: new Date(),
                };

                setMessages((prev) => [...prev, assistantMessage]);

                // Return full response for map handling
                return data;
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "Something went wrong";
                setError(errorMessage);

                // Add error message to chat
                const errorAssistantMessage: ChatMessage = {
                    id: `assistant-error-${Date.now()}`,
                    role: "assistant",
                    content: `Error: ${errorMessage}`,
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, errorAssistantMessage]);
                return undefined;
            } finally {
                setIsLoading(false);
            }
        },
        [messages]
    );

    const addMessage = useCallback((message: ChatMessage) => {
        setMessages((prev) => [...prev, message]);
    }, []);

    const clearMessages = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        addMessage,
        clearMessages,
    };
}
