import { randomUUID } from "node:crypto";
import type { Server as HTTPServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import {
  messageSendPayload,
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
