import { useEffect, useReducer, useCallback } from "react";
import { socket } from "../lib/socket.js";
import type { CardValue, ClientRoomState } from "../../server/types.js";

interface RoomHookState {
  roomState: ClientRoomState | null;
  connected: boolean;
  error: string | null;
}

type RoomAction =
  | { type: "connected" }
  | { type: "disconnected" }
  | { type: "room-state"; payload: ClientRoomState }
  | { type: "error"; payload: string }
  | { type: "clear-error" };

function reducer(state: RoomHookState, action: RoomAction): RoomHookState {
  switch (action.type) {
    case "connected":
      return { ...state, connected: true, error: null };
    case "disconnected":
      return { ...state, connected: false };
    case "room-state":
      return { ...state, roomState: action.payload, error: null };
    case "error":
      return { ...state, error: action.payload };
    case "clear-error":
      return { ...state, error: null };
  }
}

export function useRoom(roomId: string | undefined, playerName: string | null) {
  const [state, dispatch] = useReducer(reducer, {
    roomState: null,
    connected: false,
    error: null,
  });

  useEffect(() => {
    if (!roomId || !playerName) return;

    socket.connect();

    function onConnect() {
      dispatch({ type: "connected" });
      socket.emit("join-room", { roomId: roomId!, name: playerName! });
    }

    function onDisconnect() {
      dispatch({ type: "disconnected" });
    }

    function onRoomState(roomState: ClientRoomState) {
      dispatch({ type: "room-state", payload: roomState });
    }

    function onError(message: string) {
      dispatch({ type: "error", payload: message });
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room-state", onRoomState);
    socket.on("error", onError);

    // If already connected, join immediately
    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room-state", onRoomState);
      socket.off("error", onError);
      // Don't disconnect — socket is a singleton that persists across mounts.
      // Socket.io will disconnect naturally when the tab closes.
    };
  }, [roomId, playerName]);

  const castVote = useCallback((value: CardValue) => {
    socket.emit("cast-vote", { value });
  }, []);

  const revealVotes = useCallback(() => {
    socket.emit("reveal-votes");
  }, []);

  const resetRound = useCallback(() => {
    socket.emit("reset-round");
  }, []);

  const createRoom = useCallback(
    (name: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        socket.connect();

        function doCreate() {
          socket.emit("create-room", { name }, ({ roomId }) => {
            resolve(roomId);
          });
        }

        if (socket.connected) {
          doCreate();
        } else {
          socket.once("connect", doCreate);
          setTimeout(() => reject(new Error("Connection timeout")), 5000);
        }
      });
    },
    []
  );

  const isCreator =
    state.roomState?.creatorId === socket.id;

  const myVote = state.roomState?.participants.find(
    (p) => p.id === socket.id
  )?.vote;

  const myHasVoted = state.roomState?.participants.find(
    (p) => p.id === socket.id
  )?.hasVoted;

  return {
    ...state,
    isCreator,
    myVote,
    myHasVoted,
    castVote,
    revealVotes,
    resetRound,
    createRoom,
    socketId: socket.id,
  };
}
