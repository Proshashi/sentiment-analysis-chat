import { useCallback, useEffect, useRef, useState } from "react";
import {
  createSocket,
  fetchMessages,
  getApiUrl,
  type JinglesSocket,
} from "@jingles/api-client";
import type { Message, Sentiment } from "@jingles/shared";
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

interface UseConversationSocket {
  ready: boolean;
  error: string | null;
  send: (content: string) => void;
  mediator: MediatorState;
  requestMediator: () => void;
  dismissMediator: () => void;
}

const INITIAL_MEDIATOR: MediatorState = {
  open: false,
  streaming: false,
  text: "",
  error: null,
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
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediator, setMediator] = useState<MediatorState>(INITIAL_MEDIATOR);

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

  return {
    ready,
    error,
    send,
    mediator,
    requestMediator,
    dismissMediator,
  };
}
