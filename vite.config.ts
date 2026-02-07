import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "custom-cache-control",
      configureServer(server) {
        server.middlewares.use((_, res, next) => {
          res.setHeader("Cache-Control", "no-store");
          next();
        });
      },
    },
    visualizer({
      open: true, // Abre o relatório automaticamente após o build
      filename: "stats.html",
      gzipSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
});
