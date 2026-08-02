import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "portable",
  publicDir: "../public",
  base: "./",
  plugins: [react()],
  optimizeDeps: { exclude: ["pyodide"] },
  build: {
    outDir: "../dist-portable",
    emptyOutDir: true,
    target: "es2022",
  },
});
