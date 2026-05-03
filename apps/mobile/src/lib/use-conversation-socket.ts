import { useCallback, useEffect, useRef, useState } from "react";
import {
  createSocket,
  fetchMessages,
  getApiUrl,
  type JinglesSocket,
} from "@jingles/api-client";
import type { Message, PresendAnalysis, Sentiment } from "@jingles/shared";
import { useMessages } from "./messages-context";

interface UseConversationSocketArgs {
  conversationId: string;
  userId: string;
}

export interface MediatorState {
  open: boolean;
  streaming: boolean;
  text: string;
  error: string | null;
}

export interface PresendState {
  loading: boolean;
  analysis: PresendAnalysis | null;
  draft: string;
}

interface UseConversationSocket {
  ready: boolean;
  error: string | null;
  send: (content: string) => void;
  mediator: MediatorState;
  requestMediator: () => void;
  dismissMediator: () => void;
  presend: PresendState;
  analyzeDraft: (draft: string) => void;
  clearPresend: () => void;
  typingUsers: string[];
  emitTypingStart: () => void;
  emitTypingStop: () => void;
}

const TYPING_AUTO_EXPIRE_MS = 4000;

const INITIAL_MEDIATOR: MediatorState = {
  open: false,
  streaming: false,
  text: "",
  error: null,
};

const INITIAL_PRESEND: PresendState = {
  loading: false,
  analysis: null,
  draft: "",
};

function newRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useConversationSocket({
  conversationId,
  userId,
}: UseConversationSocketArgs): UseConversationSocket {
  const { upsertMessage, setAll, applySentiment } = useMessages();
  const socketRef = useRef<JinglesSocket | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);
  const activePresendIdRef = useRef<string | null>(null);
  const presendDraftRef = useRef<string>("");
  const typingExpireTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediator, setMediator] = useState<MediatorState>(INITIAL_MEDIATOR);
  const [presend, setPresend] = useState<PresendState>(INITIAL_PRESEND);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const socket = createSocket(getApiUrl(), userId);
    socketRef.current = socket;

    socket.on("connect", () => {
      if (cancelled) return;
      socket.emit("conversation:join", conversationId);
      setReady(true);
    });

    socket.on("connect_error", (err) => {
      if (cancelled) return;
      setError(err.message);
    });

    socket.on("message:new", (msg: Message) => {
      if (cancelled) return;
      upsertMessage(msg);
    });

    socket.on(
      "message:analyzed",
      ({
        messageId,
        sentiment,
      }: {
        messageId: string;
        sentiment: Sentiment;
      }) => {
        if (cancelled) return;
        applySentiment(messageId, sentiment);
      },
    );

    socket.on("mediator:chunk", ({ requestId, delta }) => {
      if (cancelled) return;
      if (requestId !== activeRequestIdRef.current) return;
      setMediator((prev) => ({ ...prev, text: prev.text + delta }));
    });

    socket.on("mediator:done", ({ requestId }) => {
      if (cancelled) return;
      if (requestId !== activeRequestIdRef.current) return;
      setMediator((prev) => ({ ...prev, streaming: false }));
    });

    socket.on("mediator:error", ({ requestId, message }) => {
      if (cancelled) return;
      if (requestId !== activeRequestIdRef.current) return;
      setMediator((prev) => ({
        ...prev,
        streaming: false,
        error: message,
      }));
    });

    socket.on("presend:result", ({ requestId, analysis }) => {
      if (cancelled) return;
      if (requestId !== activePresendIdRef.current) return;
      setPresend({
        loading: false,
        analysis,
        draft: presendDraftRef.current,
      });
    });

    socket.on("typing:state", ({ userId: typingUserId, isTyping }) => {
      if (cancelled) return;
      if (typingUserId === userId) return;
      const timers = typingExpireTimersRef.current;
      const existing = timers.get(typingUserId);
      if (existing) clearTimeout(existing);
      if (isTyping) {
        setTypingUsers((prev) =>
          prev.includes(typingUserId) ? prev : [...prev, typingUserId],
        );
        const timer = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u !== typingUserId));
          timers.delete(typingUserId);
        }, TYPING_AUTO_EXPIRE_MS);
        timers.set(typingUserId, timer);
      } else {
        setTypingUsers((prev) => prev.filter((u) => u !== typingUserId));
        timers.delete(typingUserId);
      }
    });

    (async () => {
      try {
        const history = await fetchMessages(conversationId);
        if (cancelled) return;
        setAll(history);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      }
      if (!cancelled) socket.connect();
    })();

    return () => {
      cancelled = true;
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      const timers = typingExpireTimersRef.current;
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, [conversationId, userId, upsertMessage, setAll, applySentiment]);

  const send = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      const socket = socketRef.current;
      if (!socket) return;
      socket.emit("message:send", {
        conversationId,
        senderId: userId,
        content: trimmed,
      });
    },
    [conversationId, userId],
  );

  const requestMediator = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const requestId = newRequestId();
    activeRequestIdRef.current = requestId;
    setMediator({ open: true, streaming: true, text: "", error: null });
    socket.emit("mediator:request", {
      conversationId,
      requesterId: userId,
      requestId,
    });
  }, [conversationId, userId]);

  const dismissMediator = useCallback(() => {
    activeRequestIdRef.current = null;
    setMediator(INITIAL_MEDIATOR);
  }, []);

  const analyzeDraft = useCallback(
    (draft: string) => {
      const socket = socketRef.current;
      if (!socket) return;
      const requestId = newRequestId();
      activePresendIdRef.current = requestId;
      presendDraftRef.current = draft;
      setPresend({ loading: true, analysis: null, draft });
      socket.emit("presend:analyze", {
        conversationId,
        senderId: userId,
        draft,
        requestId,
      });
    },
    [conversationId, userId],
  );

  const clearPresend = useCallback(() => {
    activePresendIdRef.current = null;
    presendDraftRef.current = "";
    setPresend(INITIAL_PRESEND);
  }, []);

  const emitTypingStart = useCallback(() => {
    socketRef.current?.emit("typing:start", conversationId);
  }, [conversationId]);

  const emitTypingStop = useCallback(() => {
    socketRef.current?.emit("typing:stop", conversationId);
  }, [conversationId]);

  return {
    ready,
    error,
    send,
    mediator,
    requestMediator,
    dismissMediator,
    presend,
    analyzeDraft,
    clearPresend,
    typingUsers,
    emitTypingStart,
    emitTypingStop,
  };
}
