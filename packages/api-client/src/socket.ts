import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@jingles/shared";

export type JinglesSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createSocket(url: string, userId: string): JinglesSocket {
  return io(url, {
    transports: ["websocket"],
    autoConnect: false,
    auth: { userId },
  });
}
