import { defineConfig } from "vite"
import { resolve } from "node:path"

export default defineConfig({
  // Vercel serves the app from the domain root, so no base path needed.
  base: "/",

  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        success: resolve(__dirname, "success.html"),
        cancel: resolve(__dirname, "cancel.html"),
      },
    },
  },

  server: {
    host: true,
    port: 3000,
    strictPort: true,
  },
})