import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0", // Required for Replit
    port: 8080,
    allowedHosts: [
      "84eba0c0-73d6-44c5-82c2-422aa9c5c945-00-dq4gqwd3mc9u.spock.replit.dev",
    ], // <- Copy error message's host exactly
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean,
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
