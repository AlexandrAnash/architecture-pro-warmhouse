import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// API идёт через gateway (http://localhost:8000) по абсолютному URL,
// поэтому dev-proxy не нужен — CORS отдаёт сам gateway.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
  },
})
