import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface NameDialogProps {
  onSubmit: (name: string) => void;
  title?: string;
}

export function NameDialog({
  onSubmit,
  title = "Enter your name",
}: NameDialogProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        className="bg-card border border-border rounded-2xl p-8 shadow-2xl w-full max-w-sm mx-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground text-sm mb-6">
          This will be visible to other players in the room.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoFocus
            maxLength={20}
            className="text-lg h-12"
          />
          <Button
            type="submit"
            className="w-full h-12 text-base"
            disabled={!name.trim()}
          >
            Join
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
