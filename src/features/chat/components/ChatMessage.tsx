"use client";

import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import { ChatMessage as ChatMessageType } from "@/shared/types/chat";
import { MarketAnalysisCard } from "./MarketAnalysisCard";

interface ChatMessageProps {
    message: ChatMessageType;
}

// Lightweight markdown renderer for chat messages
function renderMarkdown(text: string) {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Empty line = paragraph break
        if (line.trim() === "") {
            elements.push(<div key={key++} className="h-2" />);
            continue;
        }

        // Heading: **text** on its own line (bold heading style)
        const headingMatch = line.match(/^\*\*(.+?)\*\*:?$/);
        if (headingMatch) {
            elements.push(
                <p key={key++} className="font-semibold text-white mt-2 mb-1">
                    {headingMatch[1]}
                </p>
            );
            continue;
        }

        // Bullet points: •, -, *
        const bulletMatch = line.match(/^\s*[•\-\*]\s+(.+)/);
        if (bulletMatch) {
            elements.push(
                <div key={key++} className="flex gap-2 ml-1 my-0.5">
                    <span className="text-cyan-400 mt-0.5 flex-shrink-0">
                        •
                    </span>
                    <span>{renderInline(bulletMatch[1])}</span>
                </div>
            );
            continue;
        }

        // Numbered list: 1. text
        const numberedMatch = line.match(/^\s*(\d+)\.\s+(.+)/);
        if (numberedMatch) {
            elements.push(
                <div key={key++} className="flex gap-2 ml-1 my-0.5">
                    <span className="text-cyan-400 flex-shrink-0">
                        {numberedMatch[1]}.
                    </span>
                    <span>{renderInline(numberedMatch[2])}</span>
                </div>
            );
            continue;
        }

        // Regular line
        elements.push(
            <p key={key++} className="my-0.5">
                {renderInline(line)}
            </p>
        );
    }

    return elements;
}

// Render inline formatting: **bold**, *italic*, `code`
function renderInline(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
        // Bold: **text**
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
        // Inline code: `text`
        const codeMatch = remaining.match(/`(.+?)`/);

        // Find earliest match
        const matches = [
            boldMatch ? { type: "bold", match: boldMatch } : null,
            codeMatch ? { type: "code", match: codeMatch } : null,
        ]
            .filter(Boolean)
            .sort((a, b) => a!.match.index! - b!.match.index!);

        if (matches.length === 0) {
            parts.push(remaining);
            break;
        }

        const first = matches[0]!;
        const idx = first.match.index!;

        // Text before match
        if (idx > 0) {
            parts.push(remaining.slice(0, idx));
        }

        if (first.type === "bold") {
            parts.push(
                <strong key={key++} className="font-semibold text-white">
                    {first.match[1]}
                </strong>
            );
        } else if (first.type === "code") {
            parts.push(
                <code
                    key={key++}
                    className="px-1.5 py-0.5 rounded bg-[#2a2a3a] text-cyan-300 text-xs font-mono"
                >
                    {first.match[1]}
                </code>
            );
        }

        remaining = remaining.slice(idx + first.match[0].length);
    }

    return parts.length === 1 ? parts[0] : parts;
}

export default function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === "user";

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            role="article"
            aria-label={`${isUser ? "You" : "GapMap"} at ${formatTime(
                message.timestamp
            )}`}
            className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
        >
            {/* Avatar */}
            <div
                aria-hidden="true"
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isUser
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "bg-purple-500/20 text-purple-400"
                }`}
            >
                {isUser ? <User size={16} /> : <Bot size={16} />}
            </div>

            {/* Message content */}
            <div className="flex-1 max-w-[80%]">
                {/* Message bubble — hide if content is empty and analysis card is present */}
                {!(message.analysisData && !message.content) && (
                    <div
                        className={`rounded-2xl px-4 py-2 ${
                            isUser
                                ? "bg-cyan-500/20 text-cyan-50 rounded-tr-sm"
                                : "bg-[#1a1a25] text-gray-200 rounded-tl-sm border border-purple-500/20"
                        }`}
                    >
                        <div className="text-sm break-words">
                            {isUser ? (
                                <p className="whitespace-pre-wrap">
                                    {message.content}
                                </p>
                            ) : (
                                renderMarkdown(message.content)
                            )}
                        </div>
                        <time
                            dateTime={new Date(message.timestamp).toISOString()}
                            aria-hidden="true"
                            className={`block text-[11px] mt-1 ${
                                isUser ? "text-cyan-400/50" : "text-gray-500"
                            }`}
                        >
                            {formatTime(message.timestamp)}
                        </time>
                    </div>
                )}

                {/* Market Analysis Card (if present) */}
                {!isUser && message.analysisData && (
                    <MarketAnalysisCard data={message.analysisData} />
                )}
            </div>
        </motion.div>
    );
}

function formatTime(date: Date): string {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
