import { Users } from "lucide-react";
import { ShareLinkButton } from "./ShareLinkButton";

interface RoomHeaderProps {
  roomId: string;
  participantCount: number;
  phase: "voting" | "revealed";
}

export function RoomHeader({
  roomId,
  participantCount,
  phase,
}: RoomHeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-foreground">🃏 Planning Poker</h1>
        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
          {roomId}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{participantCount}</span>
        </div>

        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            phase === "voting"
              ? "bg-primary/10 text-primary"
              : "bg-gold/10 text-gold"
          }`}
        >
          {phase === "voting" ? "Voting" : "Revealed"}
        </span>

        <ShareLinkButton />
      </div>
    </header>
  );
}
