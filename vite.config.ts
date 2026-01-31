import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    viteSingleFile(),
    // Custom plugin to ignore .DS_Store files
    {
      name: "ignore-ds-store",
      load(id: string) {
        if (id.includes(".DS_Store")) {
          return "";
        }
      },
    },
  ],
  base: "./", // Ensures relative paths for assets
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    fs: {
      // Allow serving files from one level up to the project root
      strict: false,
      deny: [".DS_Store"],
    },
  },
  build: {
    outDir: "docs",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Forces everything into one file
        manualChunks: undefined,
      },
    },
  },
}));
