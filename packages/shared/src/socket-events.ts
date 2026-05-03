import type { Message, PresendAnalysis, Sentiment } from "./types";
import type {
  MediatorRequestPayload,
  MessageSendPayload,
  PresendAnalyzePayload,
} from "./schemas";

export interface ServerToClientEvents {
  "message:new": (msg: Message) => void;
  "message:analyzed": (payload: {
    messageId: string;
    sentiment: Sentiment;
  }) => void;
  "mediator:chunk": (payload: { requestId: string; delta: string }) => void;
  "mediator:done": (payload: { requestId: string }) => void;
  "mediator:error": (payload: { requestId: string; message: string }) => void;
  "presend:result": (payload: {
    requestId: string;
    analysis: PresendAnalysis;
  }) => void;
}

export interface ClientToServerEvents {
  "conversation:join": (conversationId: string) => void;
  "message:send": (payload: MessageSendPayload) => void;
  "mediator:request": (
    payload: MediatorRequestPayload & { requestId: string },
  ) => void;
  "presend:analyze": (
    payload: PresendAnalyzePayload & { requestId: string },
  ) => void;
}
