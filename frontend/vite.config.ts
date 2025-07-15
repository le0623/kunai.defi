import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts: ['kunai.trade', 'www.kunai.trade', 'api.kunai.trade'],
      hmr: {
        port: 5173,
        host: 'kunai-frontend'
      },
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'https://api.kunai.trade',
          changeOrigin: true,
          secure: true,
        }
      }
    },
  }
})
