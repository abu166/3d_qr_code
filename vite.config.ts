import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/three/build/three.core")) return "geometry";
          if (id.includes("/three/build/three.module")) return "webgl";
          if (id.includes("/react-dom/") || id.includes("/react/"))
            return "react";
          if (id.includes("/jsqr/")) return "qr-decoder";
        },
      },
    },
  },
});
