import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: "autoUpdate",

      manifest: {
        name: "Church Attendance System",
        short_name: "Attendance",
        description: "Sunday Morning Church Attendance System",
        theme_color: "#2563eb",
        background_color: "#f3f4f6",
        display: "standalone",

        icons: [
          {
            src: "pwa-icon.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-icon.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
