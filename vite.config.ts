import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import type { Server as HttpServer } from "http";

function socketIoPlugin(): PluginOption {
  return {
    name: "socket-io-dev",
    configureServer(server) {
      if (!server.httpServer) return;
      import("./server/socket-handlers.js").then(({ attachSocketIO }) => {
        attachSocketIO(server.httpServer as HttpServer);
        console.log("⚡ Socket.io attached to Vite dev server");
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), socketIoPlugin()],
  server: {
    port: 3000,
  },
});
