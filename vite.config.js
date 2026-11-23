import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Local: the API runs on :5100 (dashboard/server). VITE_API_URL (Amplify
// environment variable) points the built site at the dashboard Lambda.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    proxy: { "/api": "http://localhost:5100" },
  },
});
