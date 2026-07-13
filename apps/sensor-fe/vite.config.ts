import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Датчик ходит в брокер по относительному /ws на свой origin. В проде это проксирует
// nginx; в dev (vite dev) — dev-proxy → RabbitMQ Web-STOMP (опубликован на :15674), ws:true.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/ws': { target: 'ws://localhost:15674', ws: true },
    },
  },
})
