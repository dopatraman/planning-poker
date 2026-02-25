import express from "express";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { attachSocketIO } from "./socket-handlers.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || "3000", 10);

const app = express();
const httpServer = createServer(app);

// Attach Socket.io
attachSocketIO(httpServer);

// Serve static files from the Vite build
const distPath = join(__dirname, "..", "dist");
app.use(express.static(distPath));

// SPA fallback — serve index.html for all non-API routes
app.get("/{*splat}", (_req, res) => {
  res.sendFile(join(distPath, "index.html"));
});

httpServer.listen(PORT, () => {
  console.log(`🃏 Planning Poker running on http://localhost:${PORT}`);
});
