import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/pokedex-tracker/',
  plugins: [react()],
  server: {
    // Honour the port the tooling hands us; fall back to Vite's default.
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
})
