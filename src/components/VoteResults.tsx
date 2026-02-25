import { motion } from "framer-motion";
import { PokerCard } from "./PokerCard";
import type { ClientParticipant } from "../../server/types";
import type { CardValue } from "../../server/types";

interface VoteResultsProps {
  participants: ClientParticipant[];
}

export function VoteResults({ participants }: VoteResultsProps) {
  const numericVotes: number[] = [];
  for (const p of participants) {
    if (typeof p.vote === "number") numericVotes.push(p.vote);
  }

  let medianValue: CardValue;
  let isConsensus = false;

  if (numericVotes.length === 0) {
    medianValue = "?";
  } else {
    const sorted = [...numericVotes].sort((a, b) => a - b);
    // Upper-middle for even count, exact middle for odd
    const midIndex = Math.ceil((sorted.length - 1) / 2);
    medianValue = sorted[midIndex] as CardValue;
    isConsensus = sorted.every((v) => v === sorted[0]) && sorted.length > 1;
  }

  return (
    <motion.div
      className="flex flex-col items-center gap-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <PokerCard value={medianValue} faceUp size="lg" />
      <span className="text-sm text-muted-foreground font-medium">Median</span>
      {isConsensus && (
        <motion.span
          className="text-sm font-semibold text-primary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Consensus!
        </motion.span>
      )}
    </motion.div>
  );
}
