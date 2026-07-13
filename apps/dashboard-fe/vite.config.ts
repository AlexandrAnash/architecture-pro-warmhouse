import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// FE ходит относительными /svc/* на свой origin. В проде их проксирует nginx;
// в dev (vite dev) то же самое делает dev-proxy → в gateway (опубликован на :8000).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    proxy: {
      '/svc': 'http://localhost:8000',
    },
  },
})
