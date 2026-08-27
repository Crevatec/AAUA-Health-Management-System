import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// AAUA Health Management System — build configuration.
// The PWA plugin handles installability (Android/iOS "Add to Home Screen"),
// the service worker, and offline caching of the app shell.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "AAUA Health Management System — Ibadan Campus",
        short_name: "AAUA HMS",
        description:
          "Adekunle Ajasin University Clinic, Ibadan Campus — student, lecturer and staff health records.",
        theme_color: "#0F6B5C",
        background_color: "#F7FAF9",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // App shell + static assets are cached for installable, offline-tolerant use.
        // Live data (medical records, appointments) always goes to the network first —
        // clinic data must never be served stale.
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: { port: 5173 },
  build: { outDir: "dist", sourcemap: false },
});
