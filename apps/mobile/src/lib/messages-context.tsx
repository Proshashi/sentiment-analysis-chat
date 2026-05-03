import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Message, MessageId, Sentiment } from "@jingles/shared";

interface MessagesContextValue {
  messages: Message[];
  upsertMessage: (msg: Message) => void;
  setAll: (msgs: Message[]) => void;
  applySentiment: (messageId: MessageId, sentiment: Sentiment) => void;
}

const MessagesContext = createContext<MessagesContextValue | null>(null);

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [byId, setById] = useState<Map<MessageId, Message>>(new Map());

  const upsertMessage = useCallback((msg: Message) => {
    setById((prev) => {
      const next = new Map(prev);
      next.set(msg.id, msg);
      return next;
    });
  }, []);

  const setAll = useCallback((msgs: Message[]) => {
    setById(new Map(msgs.map((m) => [m.id, m])));
  }, []);

  const applySentiment = useCallback(
    (messageId: MessageId, sentiment: Sentiment) => {
      setById((prev) => {
        const existing = prev.get(messageId);
        if (!existing) return prev;
        const next = new Map(prev);
        next.set(messageId, { ...existing, sentiment });
        return next;
      });
    },
    [],
  );

  const messages = useMemo(
    () =>
      Array.from(byId.values()).sort((a, b) => a.createdAt - b.createdAt),
    [byId],
  );

  const value = useMemo(
    () => ({ messages, upsertMessage, setAll, applySentiment }),
    [messages, upsertMessage, setAll, applySentiment],
  );

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages(): MessagesContextValue {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error("useMessages must be used within MessagesProvider");
  return ctx;
}
