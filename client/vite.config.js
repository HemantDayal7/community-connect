import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Load environment variables
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Default port for Vite
  },
  define: {
    "process.env": {},
  },
});
