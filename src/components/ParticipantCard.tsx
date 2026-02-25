import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { CARD_LABELS } from "../lib/constants";
import type { ClientParticipant } from "../../server/types";

interface ParticipantCardProps {
  participant: ClientParticipant;
  phase: "voting" | "revealed";
  revealDelay?: number;
  isMe: boolean;
}

export function ParticipantCard({
  participant,
  phase,
  revealDelay = 0,
  isMe,
}: ParticipantCardProps) {
  const { name, vote, hasVoted, isCreator } = participant;
  const isRevealed = phase === "revealed";
  const label = vote != null ? CARD_LABELS[String(vote)] : null;

  return (
    <motion.div
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-xl transition-colors",
        isMe && "bg-primary/5 ring-1 ring-primary/20"
      )}
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold",
          "bg-gradient-to-br from-primary/40 to-primary/20 text-primary-foreground"
        )}
      >
        {name.charAt(0).toUpperCase()}
      </div>

      {/* Name */}
      <span className="text-sm font-medium text-foreground truncate max-w-[80px]">
        {name}
        {isCreator && " ★"}
      </span>

      {/* Card */}
      <div className="perspective-[400px]">
        <motion.div
          className="relative w-16 h-24"
          animate={{ rotateY: isRevealed && hasVoted ? 0 : 180 }}
          transition={{
            duration: 0.6,
            delay: isRevealed ? revealDelay : 0,
            type: "spring",
            stiffness: 200,
            damping: 20,
          }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front - vote value */}
          <div
            className={cn(
              "absolute inset-0 rounded-lg border-2 flex items-center justify-center font-bold text-xl",
              "border-border bg-card text-card-foreground shadow-md"
            )}
            style={{ backfaceVisibility: "hidden" }}
          >
            {label ?? "—"}
          </div>

          {/* Back - face down */}
          <div
            className={cn(
              "absolute inset-0 rounded-lg border-2 flex items-center justify-center shadow-md",
              hasVoted
                ? "border-primary/50 bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10"
                : "border-border/50 bg-muted/50"
            )}
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {hasVoted ? (
              <motion.span
                className="text-primary text-xl"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                ✓
              </motion.span>
            ) : (
              <span className="text-muted-foreground text-sm">...</span>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
