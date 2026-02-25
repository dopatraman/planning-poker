import { io, type Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "../../server/types.js";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const URL =
  import.meta.env.MODE === "production" ? "" : "http://localhost:3000";

export const socket: TypedSocket = io(URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
