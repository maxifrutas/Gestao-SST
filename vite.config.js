import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" permite publicar tanto no GitHub Pages (subpasta) quanto no Firebase Hosting
export default defineConfig({ plugins: [react()], base: "./" });
