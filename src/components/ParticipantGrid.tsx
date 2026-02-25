import { AnimatePresence } from "framer-motion";
import { ParticipantCard } from "./ParticipantCard";
import type { ClientParticipant } from "../../server/types";

interface ParticipantGridProps {
  participants: ClientParticipant[];
  phase: "voting" | "revealed";
  socketId: string | undefined;
}

export function ParticipantGrid({
  participants,
  phase,
  socketId,
}: ParticipantGridProps) {
  return (
    <div className="flex flex-wrap justify-center gap-4 p-4">
      <AnimatePresence mode="popLayout">
        {participants.map((p, i) => (
          <ParticipantCard
            key={p.id}
            participant={p}
            phase={phase}
            revealDelay={i * 0.15}
            isMe={p.id === socketId}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
