import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

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
  ],
});
