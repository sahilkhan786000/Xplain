// frontend/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, "../dist"), // build into repo-root/dist
    emptyOutDir: true,
  },
});
