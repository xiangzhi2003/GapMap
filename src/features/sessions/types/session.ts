import { Timestamp } from "firebase/firestore";
import { ChatMessage, AnalysisCardData } from "@/shared/types/chat";

export interface FirestoreMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Timestamp;
    analysisData: AnalysisCardData | null;
}

export interface FirestoreSession {
    id: string;
    title: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    messageCount: number;
    lastMessage: string;
}

export function toLocalMessage(data: FirestoreMessage): ChatMessage {
    return {
        id: data.id,
        role: data.role,
        content: data.content,
        timestamp: data.timestamp.toDate(),
        analysisData: data.analysisData ?? undefined,
    };
}

export function toFirestoreMessage(message: ChatMessage): FirestoreMessage {
    return {
        id: message.id,
        role: message.role,
        content: message.content,
        timestamp: Timestamp.fromDate(message.timestamp),
        analysisData: message.analysisData ?? null,
    };
}
