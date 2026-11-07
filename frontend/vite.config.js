import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  // Base relativa: la app funciona en la raíz o en una subcarpeta (GitHub Pages sirve en /SIGR/).
  base: "./",
  plugins: [vue()],
  server: { port: 5173 },
});
