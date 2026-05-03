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

interface UseConversationSocket {
  ready: boolean;
  error: string | null;
  send: (content: string) => void;
}

export function useConversationSocket({
  conversationId,
  userId,
}: UseConversationSocketArgs): UseConversationSocket {
  const { upsertMessage, setAll, applySentiment } = useMessages();
  const socketRef = useRef<JinglesSocket | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      ({ messageId, sentiment }: { messageId: string; sentiment: Sentiment }) => {
        if (cancelled) return;
        applySentiment(messageId, sentiment);
      },
    );

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

  return { ready, error, send };
}
