import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { CARD_LABELS } from "../lib/constants";
import type { CardValue } from "../../server/types";

interface PokerCardProps {
  value: CardValue;
  faceUp: boolean;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  delay?: number;
}

export function PokerCard({
  value,
  faceUp,
  selected = false,
  onClick,
  size = "md",
  delay = 0,
}: PokerCardProps) {
  const label = CARD_LABELS[String(value)];
  const isSpecial = value === "?" || value === "coffee";

  const sizeClasses = {
    sm: "w-14 h-20 text-lg",
    md: "w-20 h-28 text-2xl",
    lg: "w-24 h-36 text-3xl",
  };

  return (
    <motion.div
      className="perspective-[600px] cursor-pointer"
      onClick={onClick}
      whileHover={onClick ? { y: -8, scale: 1.05 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      layout
    >
      <motion.div
        className="relative preserve-3d"
        animate={{ rotateY: faceUp ? 0 : 180 }}
        transition={{
          duration: 0.6,
          delay,
          type: "spring",
          stiffness: 200,
          damping: 20,
        }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front face */}
        <div
          className={cn(
            sizeClasses[size],
            "rounded-xl border-2 flex items-center justify-center font-bold shadow-lg backface-hidden",
            selected
              ? "border-primary bg-primary/20 text-primary ring-2 ring-primary/50 shadow-primary/25"
              : "border-border bg-card text-card-foreground hover:border-primary/50",
            isSpecial && "italic"
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          {label}
        </div>

        {/* Back face */}
        <div
          className={cn(
            sizeClasses[size],
            "absolute inset-0 rounded-xl border-2 border-primary/30 flex items-center justify-center shadow-lg",
            "bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10"
          )}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="text-primary/60 text-3xl">🂠</div>
        </div>
      </motion.div>
    </motion.div>
  );
}
