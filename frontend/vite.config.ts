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
      allowedHosts: ['cae8-2a01-4f9-2a-2e19-00-2.ngrok-free.app'],
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3001', // your Express backend
          changeOrigin: true,
          secure: false,
        }
      }
    },
  }
})
