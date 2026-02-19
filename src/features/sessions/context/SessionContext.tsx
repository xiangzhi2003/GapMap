"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useRef,
    useCallback,
    type ReactNode,
} from "react";
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    onSnapshot,
    query,
    orderBy,
    limit,
    increment,
    Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ChatMessage } from "@/shared/types/chat";
import {
    FirestoreSession,
    toLocalMessage,
    toFirestoreMessage,
} from "../types/session";

interface SessionContextValue {
    currentSessionId: string | null;
    messages: ChatMessage[];
    isLoadingMessages: boolean;
    sessions: FirestoreSession[];
    isLoadingSessions: boolean;
    addMessage: (message: ChatMessage) => Promise<void>;
    clearMessages: () => void;
    startNewSession: () => void;
    loadSession: (sessionId: string) => Promise<void>;
    deleteSession: (sessionId: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
    userId: string;
    children: ReactNode;
}

export function SessionProvider({ userId, children }: SessionProviderProps) {
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [sessions, setSessions] = useState<FirestoreSession[]>([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(true);

    // Ref prevents race condition when two messages are sent before session is created
    const sessionIdRef = useRef<string | null>(null);
    // Track message count to avoid reading stale state in callbacks
    const messageCountRef = useRef(0);

    // Sync refs when state changes
    useEffect(() => {
        sessionIdRef.current = currentSessionId;
    }, [currentSessionId]);

    useEffect(() => {
        messageCountRef.current = messages.length;
    }, [messages]);

    // Real-time listener for the sessions list
    useEffect(() => {
        const sessionsRef = collection(db, "users", userId, "sessions");
        const q = query(sessionsRef, orderBy("updatedAt", "desc"), limit(20));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loaded: FirestoreSession[] = snapshot.docs.map((docSnap) => ({
                id: docSnap.id,
                ...(docSnap.data() as Omit<FirestoreSession, "id">),
            }));
            setSessions(loaded);
            setIsLoadingSessions(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const addMessage = useCallback(
        async (message: ChatMessage) => {
            // 1. Optimistic local update — instant UI
            setMessages((prev) => [...prev, message]);

            // 2. Ensure session exists — use ref to avoid stale closure
            let sessionId = sessionIdRef.current;
            const isFirstMessage = sessionId === null;

            if (!sessionId) {
                // Generate ID client-side so it's set synchronously before any await
                sessionId = crypto.randomUUID();
                sessionIdRef.current = sessionId;
                setCurrentSessionId(sessionId);

                // Create the session document
                const sessionRef = doc(db, "users", userId, "sessions", sessionId);
                await setDoc(sessionRef, {
                    title: message.content.slice(0, 60) || "New Analysis",
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                    messageCount: 0,
                    lastMessage: message.content.slice(0, 80),
                });
            }

            // 3. Write message to Firestore
            const messageRef = doc(
                db,
                "users",
                userId,
                "sessions",
                sessionId,
                "messages",
                message.id
            );
            await setDoc(messageRef, toFirestoreMessage(message));

            // 4. Update session metadata
            const sessionRef = doc(db, "users", userId, "sessions", sessionId);
            await updateDoc(sessionRef, {
                updatedAt: Timestamp.now(),
                messageCount: increment(1),
                lastMessage: message.content.slice(0, 80),
                ...(isFirstMessage && {
                    title: message.content.slice(0, 60) || "New Analysis",
                }),
            });
        },
        [userId]
    );

    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    const startNewSession = useCallback(() => {
        sessionIdRef.current = null;
        setCurrentSessionId(null);
        setMessages([]);
    }, []);

    const loadSession = useCallback(
        async (sessionId: string) => {
            setIsLoadingMessages(true);
            sessionIdRef.current = sessionId;
            setCurrentSessionId(sessionId);
            setMessages([]);

            try {
                const messagesRef = collection(
                    db,
                    "users",
                    userId,
                    "sessions",
                    sessionId,
                    "messages"
                );
                const q = query(messagesRef, orderBy("timestamp", "asc"), limit(100));
                const snapshot = await getDocs(q);

                const loaded: ChatMessage[] = snapshot.docs.map((docSnap) =>
                    toLocalMessage(docSnap.data() as Parameters<typeof toLocalMessage>[0])
                );
                setMessages(loaded);
            } finally {
                setIsLoadingMessages(false);
            }
        },
        [userId]
    );

    const deleteSession = useCallback(
        async (sessionId: string) => {
            // Delete all messages in the session first
            const messagesRef = collection(
                db,
                "users",
                userId,
                "sessions",
                sessionId,
                "messages"
            );
            const snapshot = await getDocs(messagesRef);
            await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));

            // Delete the session document
            await deleteDoc(doc(db, "users", userId, "sessions", sessionId));

            // If this was the active session, start a new one
            if (sessionIdRef.current === sessionId) {
                startNewSession();
            }
        },
        [userId, startNewSession]
    );

    return (
        <SessionContext.Provider
            value={{
                currentSessionId,
                messages,
                isLoadingMessages,
                sessions,
                isLoadingSessions,
                addMessage,
                clearMessages,
                startNewSession,
                loadSession,
                deleteSession,
            }}
        >
            {children}
        </SessionContext.Provider>
    );
}

export function useSession(): SessionContextValue {
    const ctx = useContext(SessionContext);
    if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
    return ctx;
}
