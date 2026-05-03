import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Message, MessageId } from "@jingles/shared";

interface MessagesContextValue {
  messages: Message[];
  upsertMessage: (msg: Message) => void;
  setAll: (msgs: Message[]) => void;
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

  const messages = useMemo(
    () =>
      Array.from(byId.values()).sort((a, b) => a.createdAt - b.createdAt),
    [byId],
  );

  const value = useMemo(
    () => ({ messages, upsertMessage, setAll }),
    [messages, upsertMessage, setAll],
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
