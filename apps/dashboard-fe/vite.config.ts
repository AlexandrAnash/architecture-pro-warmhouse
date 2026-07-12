import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev-прокси: те же относительные пути /svc/<service>/*, что и в проде под nginx,
// разводятся на локальные порты бэкендов. Снимает CORS в режиме `npm run dev`.
const services: Record<string, string> = {
  '/svc/smarthome': 'http://localhost:8080',
  '/svc/temperature': 'http://localhost:8081',
  '/svc/device-manager': 'http://localhost:8082',
  '/svc/telemetry': 'http://localhost:8083',
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    proxy: Object.fromEntries(
      Object.entries(services).map(([prefix, target]) => [
        prefix,
        {
          target,
          changeOrigin: true,
          rewrite: (path: string) => path.replace(new RegExp(`^${prefix}`), ''),
        },
      ]),
    ),
  },
})
