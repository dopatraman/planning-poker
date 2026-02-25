import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useRoom } from "../hooks/use-room";

export function Home() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { createRoom } = useRoom(undefined, null);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || loading) return;

    setLoading(true);
    try {
      const roomId = await createRoom(name.trim());
      sessionStorage.setItem("playerName", name.trim());
      navigate(`/room/${roomId}`);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        className="w-full max-w-md space-y-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center space-y-3">
          <motion.div
            className="text-6xl"
            animate={{ rotateY: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            🃏
          </motion.div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Planning Poker
          </h1>
          <p className="text-muted-foreground text-lg">
            Estimate together, decide faster
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-sm font-medium text-foreground"
            >
              Your name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              autoFocus
              maxLength={20}
              className="h-12 text-lg"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base"
            disabled={!name.trim() || loading}
          >
            {loading ? "Creating room..." : "Create New Room"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Got a link? Just open it and you'll be asked to enter your name.
        </p>
      </motion.div>
    </div>
  );
}
