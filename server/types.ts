export type CardValue = 1 | 2 | 3 | 5 | 8 | 13 | 21 | "?" | "coffee";

export interface Participant {
  id: string;
  name: string;
  vote: CardValue | null;
  isCreator: boolean;
}

export interface RoomState {
  id: string;
  participants: Map<string, Participant>;
  phase: "voting" | "revealed";
  creatorId: string;
  lastActivity: number;
}

// What the client receives (sanitized)
export interface ClientParticipant {
  id: string;
  name: string;
  vote: CardValue | null;
  hasVoted: boolean;
  isCreator: boolean;
}

export interface ClientRoomState {
  id: string;
  participants: ClientParticipant[];
  phase: "voting" | "revealed";
  creatorId: string;
}

// Socket events
export interface ServerToClientEvents {
  "room-state": (state: ClientRoomState) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  "create-room": (
    data: { name: string },
    callback: (response: { roomId: string }) => void
  ) => void;
  "join-room": (data: { roomId: string; name: string }) => void;
  "cast-vote": (data: { value: CardValue }) => void;
  "reveal-votes": () => void;
  "reset-round": () => void;
}
