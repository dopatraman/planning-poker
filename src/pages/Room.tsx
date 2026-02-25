import { useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useRoom } from "../hooks/use-room";
import { NameDialog } from "../components/NameDialog";
import { RoomHeader } from "../components/RoomHeader";
import { ParticipantGrid } from "../components/ParticipantGrid";
import { CardHand } from "../components/CardHand";
import { CreatorControls } from "../components/CreatorControls";
import { VoteResults } from "../components/VoteResults";

export function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const [playerName, setPlayerName] = useState<string | null>(
    () => sessionStorage.getItem("playerName")
  );

  const {
    roomState,
    connected,
    error,
    isCreator,
    myVote,
    myHasVoted,
    castVote,
    revealVotes,
    resetRound,
    socketId,
  } = useRoom(roomId, playerName);

  // Show name dialog if we don't have a name yet
  if (!playerName) {
    return (
      <NameDialog
        title="Join the room"
        onSubmit={(name) => {
          sessionStorage.setItem("playerName", name);
          setPlayerName(name);
        }}
      />
    );
  }

  // Loading / error states
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          className="text-center space-y-4 p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-4xl">😕</div>
          <h2 className="text-xl font-bold text-foreground">Oops!</h2>
          <p className="text-muted-foreground">{error}</p>
          <a href="/" className="text-primary hover:underline text-sm">
            Go back home
          </a>
        </motion.div>
      </div>
    );
  }

  if (!connected || !roomState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          className="text-center space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="text-4xl"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            🃏
          </motion.div>
          <p className="text-muted-foreground">Connecting to room...</p>
        </motion.div>
      </div>
    );
  }

  const hasAnyVotes = roomState.participants.some((p) => p.hasVoted);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <RoomHeader
        roomId={roomState.id}
        participantCount={roomState.participants.length}
        phase={roomState.phase}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Participant grid - center of the "table" */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl space-y-6">
            <ParticipantGrid
              participants={roomState.participants}
              phase={roomState.phase}
              socketId={socketId}
            />

            {/* Vote results (shown after reveal) */}
            {roomState.phase === "revealed" && (
              <VoteResults participants={roomState.participants} />
            )}
          </div>
        </div>

        {/* Creator controls */}
        {isCreator && (
          <CreatorControls
            phase={roomState.phase}
            onReveal={revealVotes}
            onReset={resetRound}
            hasAnyVotes={hasAnyVotes}
          />
        )}

        {/* Card hand - fixed at bottom */}
        <div className="border-t border-border bg-card/30 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <CardHand
              selectedValue={myVote}
              hasVoted={myHasVoted}
              onSelect={castVote}
              disabled={roomState.phase === "revealed"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
