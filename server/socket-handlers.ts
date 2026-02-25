import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";
import { RoomManager } from "./room-manager.js";
import type { ServerToClientEvents, ClientToServerEvents } from "./types.js";

const VALID_CARD_VALUES = new Set([1, 2, 3, 5, 8, 13, 21, "?", "coffee"]);

let roomManager: RoomManager | null = null;

export function attachSocketIO(httpServer: HttpServer): SocketIOServer {
  if (!roomManager) {
    roomManager = new RoomManager();
  }

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    }
  );

  io.on("connection", (socket) => {
    console.log(`✦ Connected: ${socket.id}`);

    socket.on("create-room", ({ name }, callback) => {
      if (!name?.trim()) {
        socket.emit("error", "Name is required");
        return;
      }

      const roomId = roomManager!.createRoom(socket.id, name.trim());
      socket.join(roomId);
      callback({ roomId });

      const state = roomManager!.getClientState(roomId);
      if (state) {
        io.to(roomId).emit("room-state", state);
      }
    });

    socket.on("join-room", ({ roomId, name }) => {
      if (!name?.trim()) {
        socket.emit("error", "Name is required");
        return;
      }
      if (!roomId) {
        socket.emit("error", "Room ID is required");
        return;
      }

      if (!roomManager!.roomExists(roomId)) {
        socket.emit("error", "Room not found");
        return;
      }

      socket.join(roomId);
      const state = roomManager!.joinRoom(roomId, socket.id, name.trim());
      if (state) {
        io.to(roomId).emit("room-state", state);
      }
    });

    socket.on("cast-vote", ({ value }) => {
      if (!VALID_CARD_VALUES.has(value)) {
        socket.emit("error", "Invalid card value");
        return;
      }

      const roomId = roomManager!.getRoomId(socket.id);
      if (!roomId) return;

      const state = roomManager!.castVote(socket.id, value);
      if (state) {
        io.to(roomId).emit("room-state", state);
      }
    });

    socket.on("reveal-votes", () => {
      const roomId = roomManager!.getRoomId(socket.id);
      if (!roomId) return;

      const state = roomManager!.revealVotes(socket.id);
      if (state) {
        io.to(roomId).emit("room-state", state);
      }
    });

    socket.on("reset-round", () => {
      const roomId = roomManager!.getRoomId(socket.id);
      if (!roomId) return;

      const state = roomManager!.resetRound(socket.id);
      if (state) {
        io.to(roomId).emit("room-state", state);
      }
    });

    socket.on("disconnect", () => {
      console.log(`✦ Disconnected: ${socket.id}`);
      const result = roomManager!.removeParticipant(socket.id);
      if (result) {
        io.to(result.roomId).emit("room-state", result.state);
      }
    });
  });

  return io;
}
