import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Датчик работает как отдельное SPA; к брокеру ходит напрямую по WebSocket
// (ws://localhost:15674/ws), поэтому dev-прокси не нужен.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
})
