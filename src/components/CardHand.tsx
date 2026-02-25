import { motion } from "framer-motion";
import { PokerCard } from "./PokerCard";
import { CARD_VALUES } from "../lib/constants";
import type { CardValue } from "../../server/types";

interface CardHandProps {
  selectedValue: CardValue | null | undefined;
  hasVoted: boolean | undefined;
  onSelect: (value: CardValue) => void;
  disabled: boolean;
}

export function CardHand({
  selectedValue,
  hasVoted,
  onSelect,
  disabled,
}: CardHandProps) {
  return (
    <motion.div
      className="flex flex-wrap justify-center gap-2 sm:gap-3 p-4"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      {CARD_VALUES.map((value, i) => (
        <motion.div
          key={String(value)}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: i * 0.05 }}
        >
          <PokerCard
            value={value}
            faceUp={true}
            selected={hasVoted && selectedValue === value}
            onClick={disabled ? undefined : () => onSelect(value)}
            size="md"
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
