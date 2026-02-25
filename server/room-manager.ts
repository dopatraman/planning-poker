import { nanoid } from "nanoid";
import type {
  RoomState,
  Participant,
  CardValue,
  ClientRoomState,
  ClientParticipant,
} from "./types.js";

const ROOM_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes of inactivity

export class RoomManager {
  private rooms = new Map<string, RoomState>();
  private socketToRoom = new Map<string, string>();
  private gcInterval: ReturnType<typeof setInterval>;

  constructor() {
    this.gcInterval = setInterval(() => this.cleanupStaleRooms(), 60_000);
  }

  createRoom(socketId: string, name: string): string {
    // Leave any previous room first
    this.removeParticipant(socketId);

    const roomId = nanoid(8);
    const participant: Participant = {
      id: socketId,
      name,
      vote: null,
      isCreator: true,
    };

    const room: RoomState = {
      id: roomId,
      participants: new Map([[socketId, participant]]),
      phase: "voting",
      creatorId: socketId,
      lastActivity: Date.now(),
    };

    this.rooms.set(roomId, room);
    this.socketToRoom.set(socketId, roomId);
    return roomId;
  }

  joinRoom(
    roomId: string,
    socketId: string,
    name: string
  ): ClientRoomState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.lastActivity = Date.now();

    // If already in this room, just update name and return state
    const existing = room.participants.get(socketId);
    if (existing) {
      existing.name = name;
      return this.sanitizeState(room);
    }

    // Leave any previous room first
    const currentRoomId = this.socketToRoom.get(socketId);
    if (currentRoomId && currentRoomId !== roomId) {
      this.removeParticipant(socketId);
    }

    // If the room is empty (everyone left), make the joiner the new creator
    const isCreator = room.participants.size === 0;
    const participant: Participant = {
      id: socketId,
      name,
      vote: null,
      isCreator,
    };
    if (isCreator) {
      room.creatorId = socketId;
    }

    room.participants.set(socketId, participant);
    this.socketToRoom.set(socketId, roomId);

    return this.sanitizeState(room);
  }

  castVote(socketId: string, value: CardValue): ClientRoomState | null {
    const room = this.getRoomBySocket(socketId);
    if (!room || room.phase !== "voting") return null;

    const participant = room.participants.get(socketId);
    if (!participant) return null;

    participant.vote = value;
    room.lastActivity = Date.now();

    return this.sanitizeState(room);
  }

  revealVotes(socketId: string): ClientRoomState | null {
    const room = this.getRoomBySocket(socketId);
    if (!room) return null;
    if (room.creatorId !== socketId) return null;

    room.phase = "revealed";
    room.lastActivity = Date.now();

    return this.sanitizeState(room);
  }

  resetRound(socketId: string): ClientRoomState | null {
    const room = this.getRoomBySocket(socketId);
    if (!room) return null;
    if (room.creatorId !== socketId) return null;

    room.phase = "voting";
    room.lastActivity = Date.now();

    for (const participant of room.participants.values()) {
      participant.vote = null;
    }

    return this.sanitizeState(room);
  }

  removeParticipant(socketId: string): { roomId: string; state: ClientRoomState } | null {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.participants.delete(socketId);
    this.socketToRoom.delete(socketId);
    room.lastActivity = Date.now();

    // Keep empty rooms around — GC will clean them up after the timeout.
    // This allows reconnecting clients to rejoin rooms that briefly had 0 participants.
    if (room.participants.size === 0) {
      return null;
    }

    // Transfer creator if the creator left
    if (room.creatorId === socketId) {
      const newCreator = room.participants.values().next().value;
      if (newCreator) {
        room.creatorId = newCreator.id;
        newCreator.isCreator = true;
      }
    }

    return { roomId, state: this.sanitizeState(room) };
  }

  getRoomId(socketId: string): string | undefined {
    return this.socketToRoom.get(socketId);
  }

  roomExists(roomId: string): boolean {
    return this.rooms.has(roomId);
  }

  getClientState(roomId: string): ClientRoomState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    return this.sanitizeState(room);
  }

  private getRoomBySocket(socketId: string): RoomState | null {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;
    return this.rooms.get(roomId) ?? null;
  }

  sanitizeState(room: RoomState): ClientRoomState {
    const participants: ClientParticipant[] = [];

    for (const p of room.participants.values()) {
      participants.push({
        id: p.id,
        name: p.name,
        vote: room.phase === "revealed" ? p.vote : null,
        hasVoted: p.vote !== null,
        isCreator: p.isCreator,
      });
    }

    return {
      id: room.id,
      participants,
      phase: room.phase,
      creatorId: room.creatorId,
    };
  }

  private cleanupStaleRooms(): void {
    const now = Date.now();
    for (const [roomId, room] of this.rooms) {
      if (now - room.lastActivity > ROOM_TIMEOUT_MS && room.participants.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  destroy(): void {
    clearInterval(this.gcInterval);
  }
}
