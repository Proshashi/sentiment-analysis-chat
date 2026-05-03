import { randomUUID } from "node:crypto";
import type { Server as HTTPServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import {
  mediatorRequestPayload,
  messageSendPayload,
  presendAnalyzePayload,
  type ClientToServerEvents,
  type Message,
  type ServerToClientEvents,
} from "@jingles/shared";
import {
  getConversation,
  insertMessage,
  listMessages,
  updateMessageSentiment,
} from "./db";
import { analyzeSentiment } from "./sentiment";
import { streamMediator } from "./mediator";
import { analyzeDraft } from "./presend";

const SENTIMENT_CONTEXT_LIMIT = 5;

type IO = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;

function room(conversationId: string): string {
  return `conv:${conversationId}`;
}

export function attachRealtime(httpServer: HTTPServer): IO {
  const io: IO = new SocketIOServer(httpServer, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log(`socket connected: ${socket.id}`);

    socket.on("conversation:join", (conversationId) => {
      if (!getConversation(conversationId)) {
        console.warn(`join refused: unknown conversation ${conversationId}`);
        return;
      }
      socket.join(room(conversationId));
    });

    socket.on("message:send", (rawPayload) => {
      const parsed = messageSendPayload.safeParse(rawPayload);
      if (!parsed.success) {
        console.warn("invalid message:send payload", parsed.error.flatten());
        return;
      }
      const { conversationId, senderId, content } = parsed.data;
      if (!getConversation(conversationId)) {
        console.warn(`send refused: unknown conversation ${conversationId}`);
        return;
      }
      const msg: Message = {
        id: randomUUID(),
        conversationId,
        senderId,
        content,
        createdAt: Date.now(),
        sentiment: null,
      };
      insertMessage({
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        content: msg.content,
        createdAt: msg.createdAt,
      });
      io.to(room(conversationId)).emit("message:new", msg);

      void runSentiment(io, msg);
    });

    socket.on("mediator:request", (rawPayload) => {
      const { requestId, ...rest } = rawPayload ?? {};
      const parsed = mediatorRequestPayload.safeParse(rest);
      if (!parsed.success || typeof requestId !== "string" || !requestId) {
        console.warn(
          "invalid mediator:request payload",
          parsed.success ? "missing requestId" : parsed.error.flatten(),
        );
        return;
      }
      const { conversationId, requesterId } = parsed.data;
      if (!getConversation(conversationId)) {
        socket.emit("mediator:error", {
          requestId,
          message: "unknown conversation",
        });
        return;
      }
      void streamMediator(conversationId, requesterId, {
        onChunk: (delta) => socket.emit("mediator:chunk", { requestId, delta }),
        onDone: () => socket.emit("mediator:done", { requestId }),
        onError: (err) => {
          console.error("mediator failed:", err);
          socket.emit("mediator:error", {
            requestId,
            message: err.message || "mediator failed",
          });
        },
      });
    });

    socket.on("presend:analyze", async (rawPayload) => {
      const { requestId, ...rest } = rawPayload ?? {};
      const parsed = presendAnalyzePayload.safeParse(rest);
      if (!parsed.success || typeof requestId !== "string" || !requestId) {
        console.warn(
          "invalid presend:analyze payload",
          parsed.success ? "missing requestId" : parsed.error.flatten(),
        );
        return;
      }
      const { conversationId, senderId, draft } = parsed.data;
      if (!getConversation(conversationId)) {
        console.warn(`presend refused: unknown conversation ${conversationId}`);
        return;
      }
      try {
        const analysis = await analyzeDraft(conversationId, senderId, draft);
        socket.emit("presend:result", { requestId, analysis });
      } catch (err) {
        console.error("presend failed:", err);
      }
    });

    socket.on("typing:start", (conversationId) => {
      if (typeof conversationId !== "string" || !conversationId) return;
      const userId = socket.handshake.auth?.userId;
      if (typeof userId !== "string" || !userId) return;
      socket.to(room(conversationId)).emit("typing:state", {
        userId,
        conversationId,
        isTyping: true,
      });
    });

    socket.on("typing:stop", (conversationId) => {
      if (typeof conversationId !== "string" || !conversationId) return;
      const userId = socket.handshake.auth?.userId;
      if (typeof userId !== "string" || !userId) return;
      socket.to(room(conversationId)).emit("typing:state", {
        userId,
        conversationId,
        isTyping: false,
      });
    });

    socket.on("disconnect", (reason) => {
      console.log(`socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

async function runSentiment(io: IO, msg: Message): Promise<void> {
  try {
    const history = listMessages(msg.conversationId);
    const recentContext = history
      .filter((m) => m.id !== msg.id)
      .slice(-SENTIMENT_CONTEXT_LIMIT);
    const sentiment = await analyzeSentiment(msg, recentContext);
    updateMessageSentiment(msg.id, sentiment);
    io.to(room(msg.conversationId)).emit("message:analyzed", {
      messageId: msg.id,
      sentiment,
    });
  } catch (err) {
    console.error(`sentiment failed for ${msg.id}:`, err);
  }
}
